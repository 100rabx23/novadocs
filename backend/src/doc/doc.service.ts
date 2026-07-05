import { Injectable, NotFoundException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as mammoth from 'mammoth';
import * as bcrypt from 'bcrypt';

@Injectable()
export class DocService {
  constructor(private prisma: PrismaService) {}

  // 1. DOCUMENTS CRUD & METADATA
  async create(userId: string, title: string, content: string, template?: string, folderId?: string) {
    return this.prisma.document.create({
      data: {
        title,
        content,
        userId,
        template: template || 'blank',
        folderId: folderId || null,
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.document.findMany({
      where: { userId },
      include: {
        folder: {
          select: { id: true, name: true }
        }
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(userId: string, docId: string) {
    const doc = await this.prisma.document.findFirst({
      where: {
        id: docId,
        OR: [
          { userId },
          { shares: { some: { sharedWithId: userId } } },
          { shares: { some: { isPublic: true } } }
        ]
      },
      include: {
        folder: true,
        user: {
          select: { id: true, email: true, displayName: true, avatar: true }
        },
        shares: true,
      }
    });

    if (!doc) {
      throw new NotFoundException('Document not found or access denied');
    }
    return doc;
  }

  async update(userId: string, docId: string, updateData: { 
    title?: string; 
    content?: string; 
    favorite?: boolean; 
    pinned?: boolean;
    archived?: boolean;
    trash?: boolean;
    folderId?: string | null;
  }) {
    // Verify document ownership or edit permissions
    const doc = await this.prisma.document.findFirst({
      where: {
        id: docId,
        OR: [
          { userId },
          { shares: { some: { sharedWithId: userId, role: { in: ['editor', 'owner'] } } } }
        ]
      }
    });

    if (!doc) {
      throw new UnauthorizedException('Insufficient permissions to edit document');
    }

    // Auto-create a document version snapshot when contents are updated if substantial changes exist
    if (updateData.content && updateData.content !== doc.content) {
      const charDiff = Math.abs(updateData.content.length - doc.content.length);
      if (charDiff > 200) {
        await this.createVersionSnapshot(userId, docId, doc.content, `Auto Snapshot (${new Date().toLocaleTimeString()})`);
      }
    }

    return this.prisma.document.update({
      where: { id: docId },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
    });
  }

  async remove(userId: string, docId: string) {
    const doc = await this.prisma.document.findFirst({
      where: { id: docId, userId }
    });

    if (!doc) {
      throw new NotFoundException('Document not found or access denied');
    }

    await this.prisma.document.delete({
      where: { id: docId },
    });

    return { success: true };
  }

  // 2. FOLDERS CRUD
  async createFolder(userId: string, name: string, parentId?: string) {
    return this.prisma.folder.create({
      data: {
        name,
        userId,
        parentId: parentId || null,
      },
    });
  }

  async findFolders(userId: string) {
    return this.prisma.folder.findMany({
      where: { userId },
      include: {
        documents: {
          select: { id: true, title: true, favorite: true, updatedAt: true }
        },
        subfolders: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  async updateFolder(userId: string, folderId: string, name?: string, parentId?: string | null) {
    const folder = await this.prisma.folder.findFirst({
      where: { id: folderId, userId }
    });

    if (!folder) {
      throw new NotFoundException('Folder not found');
    }

    return this.prisma.folder.update({
      where: { id: folderId },
      data: {
        ...(name ? { name } : {}),
        ...(parentId !== undefined ? { parentId } : {}),
        updatedAt: new Date(),
      },
    });
  }

  async removeFolder(userId: string, folderId: string) {
    const folder = await this.prisma.folder.findFirst({
      where: { id: folderId, userId }
    });

    if (!folder) {
      throw new NotFoundException('Folder not found');
    }

    await this.prisma.folder.delete({
      where: { id: folderId }
    });

    return { success: true };
  }

  // 3. VERSIONS ENGINE
  async createVersionSnapshot(userId: string, docId: string, content: string, title: string) {
    return this.prisma.version.create({
      data: {
        documentId: docId,
        content,
        title,
        userId,
      },
    });
  }

  async getVersions(userId: string, docId: string) {
    // Confirm access to document
    await this.findOne(userId, docId);

    return this.prisma.version.findMany({
      where: { documentId: docId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, displayName: true }
        }
      }
    });
  }

  async restoreVersion(userId: string, docId: string, versionId: string) {
    const version = await this.prisma.version.findFirst({
      where: { id: versionId, documentId: docId }
    });

    if (!version) {
      throw new NotFoundException('Version snapshot not found');
    }

    // Update document content to matched version
    return this.update(userId, docId, {
      content: version.content,
      title: version.title.startsWith('Auto') ? undefined : version.title,
    });
  }

  // 4. SHARING PERMISSIONS
  async shareDocument(userId: string, docId: string, data: {
    email?: string;
    sharedWithId?: string;
    role: 'viewer' | 'commenter' | 'editor';
    isPublic?: boolean;
    password?: string;
    expiresInDays?: number;
  }) {
    // Verify user owns document
    const doc = await this.prisma.document.findFirst({
      where: { id: docId, userId }
    });

    if (!doc) {
      throw new UnauthorizedException('Only owners can manage shares');
    }

    let sharedUser = null;
    if (data.sharedWithId) {
      sharedUser = await this.prisma.user.findUnique({ where: { id: data.sharedWithId } });
    } else if (data.email) {
      sharedUser = await this.prisma.user.findUnique({ where: { email: data.email } });
    }

    const expiresAt = data.expiresInDays 
      ? new Date(Date.now() + data.expiresInDays * 24 * 60 * 60 * 1000) 
      : null;

    const passwordHash = data.password ? await bcrypt.hash(data.password, 10) : null;

    return this.prisma.share.create({
      data: {
        documentId: docId,
        sharedWithId: sharedUser ? sharedUser.id : null,
        email: data.email || null,
        role: data.role,
        isPublic: !!data.isPublic,
        passwordHash,
        expiresAt,
      },
    });
  }

  async getShares(userId: string, docId: string) {
    const doc = await this.prisma.document.findFirst({
      where: { id: docId, userId }
    });

    if (!doc) {
      throw new UnauthorizedException('Access denied');
    }

    return this.prisma.share.findMany({
      where: { documentId: docId },
      include: {
        user: {
          select: { id: true, email: true, displayName: true }
        }
      }
    });
  }

  async removeShare(userId: string, docId: string, shareId: string) {
    const doc = await this.prisma.document.findFirst({
      where: { id: docId, userId }
    });

    if (!doc) {
      throw new UnauthorizedException('Access denied');
    }

    await this.prisma.share.delete({
      where: { id: shareId }
    });

    return { success: true };
  }

  async getPublicDocument(token: string, password?: string) {
    const share = await this.prisma.share.findFirst({
      where: { token },
      include: {
        document: {
          include: {
            user: { select: { id: true, displayName: true } }
          }
        }
      }
    });

    if (!share) {
      throw new NotFoundException('Public share link not found');
    }

    if (share.expiresAt && share.expiresAt < new Date()) {
      throw new BadRequestException('Share link has expired');
    }

    if (share.passwordHash) {
      if (!password) {
        throw new UnauthorizedException('Password required to view this document');
      }
      const match = await bcrypt.compare(password, share.passwordHash);
      if (!match) {
        throw new UnauthorizedException('Incorrect password');
      }
    }

    return share.document;
  }

  // 5. COMMENTS ENGINE
  async addComment(userId: string, docId: string, content: string, selection?: string) {
    // Enforce view/comment access
    await this.findOne(userId, docId);

    return this.prisma.comment.create({
      data: {
        documentId: docId,
        userId,
        content,
        selection,
      },
      include: {
        user: {
          select: { id: true, displayName: true, avatar: true }
        }
      }
    });
  }

  async getComments(userId: string, docId: string) {
    await this.findOne(userId, docId);

    return this.prisma.comment.findMany({
      where: { documentId: docId },
      orderBy: { createdAt: 'asc' },
      include: {
        user: {
          select: { id: true, displayName: true, avatar: true }
        }
      }
    });
  }

  async resolveComment(userId: string, commentId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      include: { document: true }
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    // Only owner, commenter, or editors can resolve comments
    const hasAccess = comment.userId === userId || comment.document.userId === userId;
    if (!hasAccess) {
      throw new UnauthorizedException('Permission denied');
    }

    return this.prisma.comment.update({
      where: { id: commentId },
      data: { resolved: true }
    });
  }

  // 6. DOCUMENT IMPORTER ENGINE (Mammoth for DOCX)
  async importDocument(userId: string, fileBuffer: Buffer, originalName: string, mimeType: string) {
    let content = '';
    const title = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;

    if (mimeType.includes('officedocument.wordprocessingml') || originalName.endsWith('.docx')) {
      const result = await mammoth.convertToHtml({ buffer: fileBuffer });
      content = result.value;
    } else if (originalName.endsWith('.md') || mimeType.includes('markdown')) {
      const mdText = fileBuffer.toString('utf-8');
      // Simple parser (marked or similar on client) - backend stores raw markdown inside HTML template tags
      // or wraps in paragraph nodes for easy initial editing.
      content = mdText.split('\n').map(line => {
        if (line.startsWith('# ')) return `<h1>${line.substring(2)}</h1>`;
        if (line.startsWith('## ')) return `<h2>${line.substring(3)}</h2>`;
        if (line.startsWith('### ')) return `<h3>${line.substring(4)}</h3>`;
        if (line.trim() === '') return '<br/>';
        return `<p>${line}</p>`;
      }).join('\n');
    } else if (originalName.endsWith('.txt') || mimeType.includes('plain')) {
      content = fileBuffer.toString('utf-8').split('\n').map(l => `<p>${l}</p>`).join('');
    } else if (originalName.endsWith('.html') || mimeType.includes('html')) {
      content = fileBuffer.toString('utf-8');
    } else {
      throw new BadRequestException('Unsupported document file format for import');
    }

    return this.create(userId, title, content);
  }

  // Parse document content without storing it in the database
  async parseDocument(fileBuffer: Buffer, originalName: string, mimeType: string) {
    let content = '';
    const title = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;

    if (mimeType.includes('officedocument.wordprocessingml') || originalName.endsWith('.docx')) {
      const result = await mammoth.convertToHtml({ buffer: fileBuffer });
      content = result.value;
    } else if (originalName.endsWith('.md') || mimeType.includes('markdown')) {
      const mdText = fileBuffer.toString('utf-8');
      content = mdText.split('\n').map(line => {
        if (line.startsWith('# ')) return `<h1>${line.substring(2)}</h1>`;
        if (line.startsWith('## ')) return `<h2>${line.substring(3)}</h2>`;
        if (line.startsWith('### ')) return `<h3>${line.substring(4)}</h3>`;
        if (line.trim() === '') return '<br/>';
        return `<p>${line}</p>`;
      }).join('\n');
    } else if (originalName.endsWith('.txt') || mimeType.includes('plain')) {
      content = fileBuffer.toString('utf-8').split('\n').map(l => `<p>${l}</p>`).join('');
    } else if (originalName.endsWith('.html') || mimeType.includes('html')) {
      content = fileBuffer.toString('utf-8');
    } else {
      throw new BadRequestException('Unsupported document file format for parsing');
    }

    return { title, content };
  }
}
