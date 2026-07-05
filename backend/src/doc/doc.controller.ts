import { 
  Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, 
  UseInterceptors, UploadedFile, Query, HttpCode, HttpStatus
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocService } from './doc.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('documents')
export class DocController {
  constructor(private readonly docService: DocService) {}

  // 1. FOLDERS ENDPOINTS
  @Post('folders')
  @UseGuards(JwtAuthGuard)
  createFolder(
    @Request() req: any,
    @Body('name') name: string,
    @Body('parentId') parentId?: string,
  ) {
    return this.docService.createFolder(req.user.id, name, parentId);
  }

  @Get('folders')
  @UseGuards(JwtAuthGuard)
  findFolders(@Request() req: any) {
    return this.docService.findFolders(req.user.id);
  }

  @Patch('folders/:folderId')
  @UseGuards(JwtAuthGuard)
  updateFolder(
    @Request() req: any,
    @Param('folderId') folderId: string,
    @Body('name') name?: string,
    @Body('parentId') parentId?: string | null,
  ) {
    return this.docService.updateFolder(req.user.id, folderId, name, parentId);
  }

  @Delete('folders/:folderId')
  @UseGuards(JwtAuthGuard)
  removeFolder(
    @Request() req: any,
    @Param('folderId') folderId: string,
  ) {
    return this.docService.removeFolder(req.user.id, folderId);
  }

  // 2. DOCUMENT IMPORT/UPLOAD ENDPOINTS
  @Post('import')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async importFile(
    @Request() req: any,
    @UploadedFile() file: any,
  ) {
    return this.docService.importDocument(
      req.user.id,
      file.buffer,
      file.originalname,
      file.mimetype
    );
  }

  @Post('parse')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('file'))
  async parseFile(
    @UploadedFile() file: any,
  ) {
    return this.docService.parseDocument(
      file.buffer,
      file.originalname,
      file.mimetype
    );
  }

  // 3. CORE DOCUMENTS ENDPOINTS
  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Request() req: any,
    @Body('title') title: string,
    @Body('content') content: string,
    @Body('template') template?: string,
    @Body('folderId') folderId?: string,
  ) {
    return this.docService.create(req.user.id, title, content, template, folderId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@Request() req: any) {
    return this.docService.findAll(req.user.id);
  }

  @Get('public/:token')
  getPublicDocument(
    @Param('token') token: string,
    @Query('password') password?: string,
  ) {
    return this.docService.getPublicDocument(token, password);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.docService.findOne(req.user.id, id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() updateData: { 
      title?: string; 
      content?: string; 
      favorite?: boolean; 
      pinned?: boolean;
      archived?: boolean;
      trash?: boolean;
      folderId?: string | null;
    },
  ) {
    return this.docService.update(req.user.id, id, updateData);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Request() req: any, @Param('id') id: string) {
    return this.docService.remove(req.user.id, id);
  }

  // 4. SHARING ENDPOINTS
  @Post(':id/shares')
  @UseGuards(JwtAuthGuard)
  share(
    @Request() req: any,
    @Param('id') id: string,
    @Body() shareData: {
      email?: string;
      sharedWithId?: string;
      role: 'viewer' | 'commenter' | 'editor';
      isPublic?: boolean;
      password?: string;
      expiresInDays?: number;
    }
  ) {
    return this.docService.shareDocument(req.user.id, id, shareData);
  }

  @Get(':id/shares')
  @UseGuards(JwtAuthGuard)
  getShares(
    @Request() req: any,
    @Param('id') id: string
  ) {
    return this.docService.getShares(req.user.id, id);
  }

  @Delete(':id/shares/:shareId')
  @UseGuards(JwtAuthGuard)
  removeShare(
    @Request() req: any,
    @Param('id') id: string,
    @Param('shareId') shareId: string,
  ) {
    return this.docService.removeShare(req.user.id, id, shareId);
  }

  // 5. DOCUMENT SNAPSHOTS (VERSIONS) ENDPOINTS
  @Post(':id/versions')
  @UseGuards(JwtAuthGuard)
  createVersion(
    @Request() req: any,
    @Param('id') id: string,
    @Body('content') content: string,
    @Body('title') title: string,
  ) {
    return this.docService.createVersionSnapshot(req.user.id, id, content, title);
  }

  @Get(':id/versions')
  @UseGuards(JwtAuthGuard)
  getVersions(
    @Request() req: any,
    @Param('id') id: string,
  ) {
    return this.docService.getVersions(req.user.id, id);
  }

  @Post(':id/versions/:versionId/restore')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  restoreVersion(
    @Request() req: any,
    @Param('id') id: string,
    @Param('versionId') versionId: string,
  ) {
    return this.docService.restoreVersion(req.user.id, id, versionId);
  }

  // 6. COMMENTS ENDPOINTS
  @Post(':id/comments')
  @UseGuards(JwtAuthGuard)
  addComment(
    @Request() req: any,
    @Param('id') id: string,
    @Body('content') content: string,
    @Body('selection') selection?: string,
  ) {
    return this.docService.addComment(req.user.id, id, content, selection);
  }

  @Get(':id/comments')
  @UseGuards(JwtAuthGuard)
  getComments(
    @Request() req: any,
    @Param('id') id: string,
  ) {
    return this.docService.getComments(req.user.id, id);
  }

  @Patch('comments/:commentId/resolve')
  @UseGuards(JwtAuthGuard)
  resolveComment(
    @Request() req: any,
    @Param('commentId') commentId: string,
  ) {
    return this.docService.resolveComment(req.user.id, commentId);
  }
}
