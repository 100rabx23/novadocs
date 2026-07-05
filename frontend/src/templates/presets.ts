import type { DocumentTemplate } from '../types';

export const TEMPLATES: DocumentTemplate[] = [
  {
    id: 'blank',
    name: 'Blank Document',
    category: 'Blank',
    description: 'Start with a clean slate and custom formatting.',
    icon: 'FileText',
    content: ''
  },
  {
    id: 'resume-modern',
    name: 'Modern Resume',
    category: 'Resume',
    description: 'A clean, stylish resume layout for professional jobs.',
    icon: 'Briefcase',
    content: `
      <h1>JOHN SMITH</h1>
      <p style="text-align: center; color: #4b5563;">San Francisco, CA • john.smith@email.com • (555) 019-2834 • linkedin.com/in/johnsmith</p>
      <hr />
      <h2>Professional Summary</h2>
      <p>Innovative and detail-oriented Software Engineer with over 5 years of experience building scalable web applications. Proven expertise in React, TypeScript, Node.js, and cloud architectures. Passionate about writing clean, maintainable code and mentoring junior developers.</p>
      
      <h2>Work Experience</h2>
      <h3><strong>Senior Software Engineer</strong> | TechCorp Inc. <em>(2022 - Present)</em></h3>
      <ul>
        <li>Led the migration of a legacy monolithic dashboard to a modern React-based micro-frontend, reducing page load time by 45%.</li>
        <li>Architected and implemented a real-time analytics engine utilizing WebSockets and Redis, handling over 10M events daily.</li>
        <li>Mentored 4 junior engineers, leading to a 30% increase in team sprint velocity.</li>
      </ul>
      
      <h3><strong>Software Engineer</strong> | Innovate Web Solutions <em>(2020 - 2022)</em></h3>
      <ul>
        <li>Developed and maintained core React components used across 5 distinct client-facing applications.</li>
        <li>Collaborated with design teams to build a responsive design system, reducing UI bugs by 60%.</li>
        <li>Implemented end-to-end automated testing, improving overall test coverage from 40% to 85%.</li>
      </ul>

      <h2>Education</h2>
      <h3><strong>Bachelor of Science in Computer Science</strong> | Stanford University <em>(2016 - 2020)</em></h3>
      
      <h2>Skills</h2>
      <p><strong>Languages:</strong> TypeScript, JavaScript, Python, SQL, HTML/CSS</p>
      <p><strong>Frameworks & Tools:</strong> React, Node.js, Express, Next.js, Git, Docker, AWS</p>
    `
  },
  {
    id: 'resume-ats',
    name: 'ATS Resume',
    category: 'Resume',
    description: 'Optimized formatting for Applicant Tracking Systems.',
    icon: 'CheckSquare',
    content: `
      <h1>Jane Doe</h1>
      <p>Austin, TX | jane.doe@email.com | (555) 123-4567 | github.com/janedoe</p>
      <hr />
      <h2>SUMMARY</h2>
      <p>Results-driven Project Manager with 7+ years of experience leading cross-functional teams in agile software development. Specialized in risk management, budget optimization, and timeline execution. PMP Certified.</p>
      
      <h2>EXPERIENCE</h2>
      <h3><strong>Lead Project Manager</strong> | GlobalSystems <em>(2021 - Present)</em></h3>
      <ul>
        <li>Managed a portfolio of 6 high-priority cloud deployment projects with a combined budget of $2.5M.</li>
        <li>Redefined sprint planning processes, boosting on-time feature delivery from 78% to 94%.</li>
        <li>Standardized project status reports, improving stakeholder communication and project visibility.</li>
      </ul>
      
      <h3><strong>Agile Project Coordinator</strong> | DevFlow Ltd <em>(2019 - 2021)</em></h3>
      <ul>
        <li>Coordinated daily standups, sprint reviews, and retrospectives for 3 development teams.</li>
        <li>Created project roadmaps, tracking deliverables and dependencies using Jira and Confluence.</li>
        <li>Successfully delivered 12 major software releases on schedule and within budget constraints.</li>
      </ul>
      
      <h2>EDUCATION</h2>
      <h3><strong>Master of Science in Information Systems</strong> | University of Texas <em>(2017 - 2019)</em></h3>
      <h3><strong>Bachelor of Business Administration</strong> | Texas A&M University <em>(2013 - 2017)</em></h3>
      
      <h2>CERTIFICATIONS & SKILLS</h2>
      <p><strong>Certifications:</strong> Project Management Professional (PMP), Certified ScrumMaster (CSM)</p>
      <p><strong>Skills:</strong> Agile/Scrum, Jira, MS Project, Budgeting, Risk Mitigation, Team Leadership</p>
    `
  },
  {
    id: 'resume-creative',
    name: 'Creative Resume',
    category: 'Resume',
    description: 'A vibrant template featuring visual highlights and colors.',
    icon: 'Palette',
    content: `
      <h1 style="color: #8B5CF6;">ALEX RIVERA</h1>
      <p style="color: #4F46E5;"><strong>Lead UX/UI Designer</strong></p>
      <p>alex.design@email.com • +1 415 987 6543 • alexrivera.design</p>
      <hr />
      <h2 style="color: #8B5CF6;">My Passion</h2>
      <p>Crafting intuitive, accessible, and delightful digital experiences that solve complex user problems and drive business growth. 6+ years designing consumer web and mobile applications.</p>
      
      <h2 style="color: #8B5CF6;">Experience</h2>
      <h3><strong>Lead UX Designer</strong> | DesignStudio <em>(2022 - Present)</em></h3>
      <ul>
        <li>Designed a fintech mobile application that achieved 1M+ downloads within the first 6 months.</li>
        <li>Conducted 50+ user interviews to identify usability gaps, leading to a redesigned checkout flow.</li>
        <li>Created interactive design prototypes using Figma, streamlining front-end implementation times.</li>
      </ul>
      
      <h3><strong>Product Designer</strong> | GrowthApp Co. <em>(2020 - 2022)</em></h3>
      <ul>
        <li>Iterated UX designs for search and discoverability tools, resulting in a 25% increase in user retention.</li>
        <li>Facilitated cross-department design sprints and workshops to align marketing, product, and engineering.</li>
      </ul>

      <h2 style="color: #8B5CF6;">Core Capabilities</h2>
      <p>User Research • Wireframing • Interactive Prototyping • Design Systems • UI Typography • HTML/CSS</p>
    `
  },
  {
    id: 'invoice-business',
    name: 'Business Invoice',
    category: 'Invoice',
    description: 'Professional invoice with line item table formatting.',
    icon: 'Receipt',
    content: `
      <h1>INVOICE</h1>
      <p><strong>NovaDocs Business Solutions</strong><br />123 Innovation Way, Suite 400<br />San Francisco, CA 94107<br />billing@novadocs.com</p>
      <hr />
      
      <table>
        <thead>
          <tr>
            <th>Invoice Details</th>
            <th>Bill To</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <strong>Invoice #:</strong> NV-2026-001<br />
              <strong>Date:</strong> July 3, 2026<br />
              <strong>Due Date:</strong> August 3, 2026
            </td>
            <td>
              <strong>Acme Corporation</strong><br />
              Attn: Accounts Payable<br />
              456 Industrial Blvd<br />
              Austin, TX 78701
            </td>
          </tr>
        </tbody>
      </table>

      <h2>Services Rendered</h2>
      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th>Hours</th>
            <th>Rate</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Custom React Application Development</td>
            <td>80</td>
            <td>$125.00</td>
            <td>$10,000.00</td>
          </tr>
          <tr>
            <td>UI/UX Design Wireframing</td>
            <td>30</td>
            <td>$100.00</td>
            <td>$3,000.00</td>
          </tr>
          <tr>
            <td>API Integration and Database Setup</td>
            <td>25</td>
            <td>$120.00</td>
            <td>$3,000.00</td>
          </tr>
        </tbody>
      </table>

      <p style="text-align: right; font-size: 1.25rem;"><strong>Grand Total Due: $16,000.00</strong></p>
      
      <hr />
      <blockquote>Thank you for your business. Please remit payment via wire transfer within 30 days. Contact billing@novadocs.com for bank details.</blockquote>
    `
  },
  {
    id: 'invoice-agency',
    name: 'Agency Invoice',
    category: 'Invoice',
    description: 'Branded layout tailored for creative agency billing.',
    icon: 'Building',
    content: `
      <h1 style="color: #4F46E5;">Vivid Creative Agency</h1>
      <p>789 Studio Lane, Brooklyn, NY 11211 • accounts@vividcreative.co</p>
      <hr />
      <h2>INVOICE FOR SERVICES</h2>
      <p><strong>Client:</strong> Horizon Enterprises • Project: Q2 Brand Campaign Refresh</p>
      
      <table>
        <thead>
          <tr>
            <th>Line Item / Description</th>
            <th>Quantity</th>
            <th>Price</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Brand Identity & Logo Design Refresh</td>
            <td>1</td>
            <td>$5,000.00</td>
          </tr>
          <tr>
            <td>Social Media Campaign Assets (Figma Package)</td>
            <td>20</td>
            <td>$150.00</td>
          </tr>
          <tr>
            <td>Video Production & Post-Production Editing</td>
            <td>1</td>
            <td>$8,000.00</td>
          </tr>
        </tbody>
      </table>

      <p style="text-align: right;"><strong>Subtotal:</strong> $16,000.00<br /><strong>Sales Tax (8.875%):</strong> $1,420.00<br /><strong style="font-size: 1.25rem; color: #4F46E5;">Total Invoice Due: $17,420.00</strong></p>
      
      <p><em>Payment Terms: Net 15 days. Subject to 1.5% interest per month thereafter.</em></p>
    `
  },
  {
    id: 'invoice-freelancer',
    name: 'Freelancer Invoice',
    category: 'Invoice',
    description: 'Simple, direct layout for independent contractors.',
    icon: 'User',
    content: `
      <h1>Freelance Consultant Invoice</h1>
      <p><strong>Sarah Jenkins</strong> | Independent Developer | sarah@jenkinsdev.io</p>
      <hr />
      <p><strong>Bill To:</strong> AppStart LLC • <strong>Date:</strong> July 3, 2026 • <strong>Invoice ID:</strong> SJ-998</p>
      
      <table>
        <thead>
          <tr>
            <th>Description of Milestones / Tasks</th>
            <th>Amount Due</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Milestone 1: Backend Database Migration and Validation Tests</td>
            <td>$4,500.00</td>
          </tr>
          <tr>
            <td>Milestone 2: Multi-tenant user login and permissions dashboard</td>
            <td>$3,500.00</td>
          </tr>
        </tbody>
      </table>

      <p style="text-align: right; font-size: 1.2rem;"><strong>Total Due: $8,000.00</strong></p>
      
      <p>Payment via Stripe or direct deposit. Details inside invoice portal.</p>
    `
  },
  {
    id: 'report-business',
    name: 'Business Report',
    category: 'Report',
    description: 'Formally structured report layout with executive summaries.',
    icon: 'TrendingUp',
    content: `
      <h1>Q2 Strategic Performance Report</h1>
      <p style="color: #6b7280; font-size: 1.1rem;">Prepared by: Strategic Planning Committee<br />Date: July 3, 2026</p>
      <hr />
      
      <h2>1. Executive Summary</h2>
      <p>This report details the operational performance and strategic growth metrics achieved during the second quarter of the fiscal year. Through targeted marketing initiatives and product refinements, company revenue experienced an 18% quarter-over-quarter expansion, outperforming initial forecast expectations by 5.4%.</p>
      
      <h2>2. Key Growth Metrics</h2>
      <table>
        <thead>
          <tr>
            <th>Metric Category</th>
            <th>Q1 Performance</th>
            <th>Q2 Performance</th>
            <th>YoY Growth</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Active Daily Customers</td>
            <td>42,500</td>
            <td>51,200</td>
            <td>+32%</td>
          </tr>
          <tr>
            <td>Monthly Recurrent Revenue</td>
            <td>$850,000</td>
            <td>$1,020,000</td>
            <td>+24%</td>
          </tr>
          <tr>
            <td>Customer Retention Rate</td>
            <td>91.2%</td>
            <td>93.5%</td>
            <td>+2.3%</td>
          </tr>
        </tbody>
      </table>

      <h2>3. Operational Analysis</h2>
      <p>Core growth drivers included the deployment of our new enterprise features, which increased contract values in the B2B segment. Additionally, cost-optimization plans in infrastructure resulted in a 7% reduction in cloud operation costs.</p>
      
      <blockquote>Recommendation: Increase marketing allocation for the enterprise segment by 15% in Q3 to capitalize on high-conversion signals observed in June.</blockquote>
    `
  },
  {
    id: 'report-college',
    name: 'College Report',
    category: 'Report',
    description: 'Formatted following standard academic guidelines.',
    icon: 'GraduationCap',
    content: `
      <h1>The Impact of Microplastics on Coastal Marine Habitats</h1>
      <p style="text-align: center;"><strong>Author:</strong> Emily Watson<br />Department of Environmental Science, State University<br />Professor A. Vance | ENV-304</p>
      <hr />
      
      <h2>Abstract</h2>
      <p>This research paper examines the prevalence of microplastic contaminants in coastal ecosystems and their subsequent biological accumulation in marine organisms. Over a three-month collection cycle, sand and sediment specimens from local beaches were sifted, identifying an average concentration of 23 particles per cubic meter, emphasizing the critical need for regional filtration and policy changes.</p>
      
      <h2>Introduction</h2>
      <p>Microplastics (defined as plastic particles smaller than 5mm) present a severe environmental threat to global waterways. These particles stem from cosmetic products, synthetic fibers, and the degradation of larger plastic wastes. Due to their minute size, they are readily ingested by lower-tier marine organisms, posing bioaccumulation hazards across the trophic food web.</p>
      
      <h2>Methodology</h2>
      <p>Sediment samples were collected weekly across four designated quadrant zones. Samples were separated using dense saline flotation, filtered, and analyzed under optical microscopes to quantify plastic particles by size and polymer configuration.</p>
    `
  },
  {
    id: 'report-project',
    name: 'Project Report',
    category: 'Report',
    description: 'Designed for project delivery, roadmaps, and tasks.',
    icon: 'Layers',
    content: `
      <h1>NovaDocs Enterprise Integration Project Report</h1>
      <p><strong>Project Lead:</strong> David Miller, CTO Office • <strong>Status:</strong> Completed</p>
      <hr />
      
      <h2>Project Objectives</h2>
      <p>The primary target was to establish a fully integrated client document workspace supporting rich editing, local caching, template loading, and print-ready formats. The deliverables were scoped into three milestone phases.</p>
      
      <h2>Milestones & Completion Status</h2>
      <ul>
        <li><strong>Phase 1: Rich Editor Core</strong> — Integrated Tiptap core with formatting, links, checklists, images, and tables. <em>[Status: Complete]</em></li>
        <li><strong>Phase 2: Local Cache & Versioning</strong> — Configured local storage syncing, debounced save-states, and recovery dashboard. <em>[Status: Complete]</em></li>
        <li><strong>Phase 3: Export Engine</strong> — Implemented high-fidelity export routines for MS Word DOCX parsing. <em>[Status: Complete]</em></li>
      </ul>

      <h2>Key Findings & Future Enhancements</h2>
      <p>The interface yields excellent page performance using local browser caching. Future expansions should consider implementing multi-user collaboration via WebRTC for real-time document editing.</p>
    `
  }
];
