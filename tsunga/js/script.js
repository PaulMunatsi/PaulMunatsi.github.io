// Security: Input sanitization function
function sanitizeInput(input) {
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
}

// Security: Validate email format
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Navigation
function navigate(section) {
    // Hide all sections
    const sections = document.querySelectorAll('section');
    sections.forEach(s => s.classList.remove('active'));
    
    // Show selected section
    document.getElementById(section).classList.add('active');
    
    // Update active nav link
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-section') === section) {
            link.classList.add('active');
        }
    });
    
    // Close mobile menu if open
    const nav = document.getElementById('mainNav');
    nav.classList.remove('active');
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Update page title for SEO
    const pageTitles = {
        'home': 'Tsunga Bamu Law International - Premier Law Firm in Zimbabwe',
        'about': 'About Us - Tsunga Bamu Law International',
        'services': 'Legal Services - Tsunga Bamu Law International',
        'team': 'Our Team - Tsunga Bamu Law International',
        'news': 'News & Insights - Tsunga Bamu Law International',
        'contact': 'Contact Us - Tsunga Bamu Law International'
    };
    document.title = pageTitles[section] || pageTitles['home'];
    
    // Update meta description
    const metaDescriptions = {
        'home': 'TBLI is an international law firm in Harare, Zimbabwe providing expert legal services in corporate law, litigation, human rights, and governance.',
        'about': 'Learn about Tsunga Bamu Law International, our mission, values, and commitment to excellence in legal practice across Africa.',
        'services': 'Comprehensive legal services including corporate law, litigation, human rights, governance advisory, compliance, and pro bono work.',
        'team': 'Meet our team of experienced legal professionals led by Managing Partner Arnold Tsunga.',
        'news': 'Latest news, insights, and updates from Tsunga Bamu Law International.',
        'contact': 'Contact Tsunga Bamu Law International for expert legal advice. Located in Harare, Zimbabwe.'
    };
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
        metaDesc.setAttribute('content', metaDescriptions[section] || metaDescriptions['home']);
    }
}

function toggleMenu() {
    const nav = document.getElementById('mainNav');
    nav.classList.toggle('active');
}

// Modal Data
const modalData = {
    news1: {
        title: 'TBLI Listed by Law Society of Zimbabwe',
        subtitle: 'January 2025',
        image: "background: linear-gradient(135deg, rgba(226, 165, 57, 0.3), rgba(21, 29, 65, 0.8)), url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 400%22%3E%3Crect fill=%22%23151D41%22 width=%22800%22 height=%22400%22/%3E%3Ctext x=%22400%22 y=%22200%22 font-family=%22Arial%22 font-size=%2236%22 fill=%22%23E2A539%22 text-anchor=%22middle%22%3ELaw Society Recognition%3C/text%3E%3C/svg%3E'); background-size: cover; background-position: center;",
        body: `
            <p>Tsunga Bamu Law International was officially listed among new law firms by the Law Society of Zimbabwe in 2025, marking a significant milestone in our establishment as a premier legal practice in the region.</p>
            
            <h3>A Historic Achievement</h3>
            <p>This recognition by the Law Society validates our commitment to upholding the highest standards of legal practice and professional ethics. The listing process involved rigorous evaluation of our firm's capabilities, professional credentials, and adherence to regulatory requirements.</p>
            
            <h3>What This Means for Our Clients</h3>
            <p>This official recognition ensures our clients that TBLI meets all regulatory requirements and professional standards set by Zimbabwe's legal governing body. It reinforces our ability to provide reliable, high-quality legal services across all our practice areas.</p>
            
            <h3>Our Commitment</h3>
            <p>As we celebrate this achievement, we remain committed to delivering exceptional legal services that meet international standards. We will continue to build lasting relationships with our clients based on trust, professionalism, and outstanding results.</p>
            
            <h3>Looking Forward</h3>
            <p>This listing is just the beginning. We are expanding our services, strengthening partnerships across the region, and positioning ourselves as a leading law firm not just in Zimbabwe, but throughout Africa.</p>
        `
    },
    news2: {
        title: 'Regional Partnerships Expansion',
        subtitle: 'February 2025',
        image: "background: linear-gradient(135deg, rgba(226, 165, 57, 0.3), rgba(21, 29, 65, 0.8)), url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 400%22%3E%3Crect fill=%22%23151D41%22 width=%22800%22 height=%22400%22/%3E%3Ctext x=%22400%22 y=%22200%22 font-family=%22Arial%22 font-size=%2236%22 fill=%22%23E2A539%22 text-anchor=%22middle%22%3ERegional Expansion%3C/text%3E%3C/svg%3E'); background-size: cover; background-position: center;",
        body: `
            <p>TBLI has significantly expanded its services and partnerships across the African region, strengthening our ability to serve clients throughout the continent with comprehensive legal solutions.</p>
            
            <h3>Strategic Partnerships</h3>
            <p>We have established strategic partnerships with leading law firms and legal organizations across Africa, enabling us to provide seamless cross-border legal services. These partnerships allow us to leverage local expertise while maintaining our high standards of service delivery.</p>
            
            <h3>Enhanced Service Capabilities</h3>
            <p>Through these regional partnerships, we can now offer:
            <ul>
                <li>Multi-jurisdictional transaction support</li>
                <li>Regional litigation coordination</li>
                <li>Cross-border compliance advisory</li>
                <li>Pan-African governance consulting</li>
            </ul>
            </p>
            
            <h3>Client Benefits</h3>
            <p>Our clients benefit from a truly regional perspective, local knowledge in multiple jurisdictions, and a single point of contact for complex multi-country matters. This expansion positions us to better serve multinational corporations, regional institutions, and development organizations operating across Africa.</p>
            
            <h3>Future Growth</h3>
            <p>We continue to identify and develop strategic partnerships that align with our values and enhance our service offerings. Our goal is to be the go-to legal partner for organizations doing business across the African continent.</p>
        `
    },
    news3: {
        title: 'Legal Commentary Publication Series',
        subtitle: 'March 2025',
        image: "background: linear-gradient(135deg, rgba(226, 165, 57, 0.3), rgba(21, 29, 65, 0.8)), url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 400%22%3E%3Crect fill=%22%23151D41%22 width=%22800%22 height=%22400%22/%3E%3Ctext x=%22400%22 y=%22200%22 font-family=%22Arial%22 font-size=%2236%22 fill=%22%23E2A539%22 text-anchor=%22middle%22%3EThought Leadership%3C/text%3E%3C/svg%3E'); background-size: cover; background-position: center;",
        body: `
            <p>We have launched our comprehensive legal commentary and client alerts series, providing timely insights on critical issues affecting business and governance across Africa.</p>
            
            <h3>Knowledge Sharing Initiative</h3>
            <p>Our publication series represents a commitment to thought leadership and knowledge sharing in the legal community. We publish regular analysis on:
            <ul>
                <li>Recent legal and regulatory developments</li>
                <li>Corporate governance trends</li>
                <li>Human rights and constitutional law updates</li>
                <li>Compliance and risk management best practices</li>
            </ul>
            </p>
            
            <h3>Expert Analysis</h3>
            <p>Each publication features in-depth analysis from our team of experienced lawyers, providing practical insights that help clients navigate complex legal landscapes. Our commentary goes beyond mere reporting to offer strategic guidance and actionable recommendations.</p>
            
            <h3>Accessible Format</h3>
            <p>We publish our legal commentary through multiple channels including email alerts, our website, and social media platforms. This ensures our clients and the broader business community have easy access to important legal updates when they need them.</p>
            
            <h3>Stay Informed</h3>
            <p>Subscribe to our legal updates to receive regular commentary on issues that matter to your business. Follow us on LinkedIn and X (Twitter) for real-time updates and insights from our legal team.</p>
        `
    },
    news4: {
        title: 'Expanding Pro Bono Services',
        subtitle: 'April 2025',
        image: "background: linear-gradient(135deg, rgba(226, 165, 57, 0.3), rgba(21, 29, 65, 0.8)), url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 400%22%3E%3Crect fill=%22%23151D41%22 width=%22800%22 height=%22400%22/%3E%3Ctext x=%22400%22 y=%22200%22 font-family=%22Arial%22 font-size=%2236%22 fill=%22%23E2A539%22 text-anchor=%22middle%22%3EPro Bono Initiative%3C/text%3E%3C/svg%3E'); background-size: cover; background-position: center;",
        body: `
            <p>TBLI has launched an expanded pro bono program focusing on public-interest litigation, legal aid for marginalized individuals, and policy research promoting good governance.</p>
            
            <h3>Our Pro Bono Commitment</h3>
            <p>Social responsibility is central to TBLI's mission. We believe that legal professionals have a duty to use their skills in service of justice and the public good. Our pro bono program dedicates significant firm resources to serving those who cannot afford legal representation.</p>
            
            <h3>Focus Areas</h3>
            <p>Our expanded pro bono program focuses on:
            <ul>
                <li>Representation in public-interest litigation</li>
                <li>Legal aid for marginalized individuals and communities</li>
                <li>Legal education and rights awareness programs</li>
                <li>Policy research promoting accountability and good governance</li>
            </ul>
            </p>
            
            <h3>Partnership Approach</h3>
            <p>We partner with civil society organizations, human rights groups, and development agencies to maximize our impact. These partnerships allow us to identify the most pressing legal needs and deliver assistance where it's needed most.</p>
            
            <h3>Get Involved</h3>
            <p>If you represent an organization working on justice and equality issues, or if you need pro bono legal assistance, contact us to discuss how we might help.</p>
        `
    },
    news5: {
        title: 'Knowledge Center Launch',
        subtitle: 'May 2025',
        image: "background: linear-gradient(135deg, rgba(226, 165, 57, 0.3), rgba(21, 29, 65, 0.8)), url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 400%22%3E%3Crect fill=%22%23151D41%22 width=%22800%22 height=%22400%22/%3E%3Ctext x=%22400%22 y=%22200%22 font-family=%22Arial%22 font-size=%2236%22 fill=%22%23E2A539%22 text-anchor=%22middle%22%3EKnowledge Center%3C/text%3E%3C/svg%3E'); background-size: cover; background-position: center;",
        body: `
            <p>Our new knowledge center provides clients and stakeholders with access to legal updates, analytical briefings, research papers, and commentary on critical governance and business issues.</p>
            
            <h3>Comprehensive Resources</h3>
            <p>The knowledge center offers:
            <ul>
                <li>Legal updates and analytical briefings</li>
                <li>Reports on governance and human-rights issues</li>
                <li>Commentary on corporate and compliance trends</li>
                <li>Research papers and newsletters</li>
                <li>Practice guides and legal checklists</li>
            </ul>
            </p>
            
            <h3>Supporting Informed Decisions</h3>
            <p>These materials support informed decision-making and facilitate collaboration with partners who value accountability and transparency. Whether you're navigating regulatory changes, planning corporate transactions, or addressing governance challenges, our knowledge center provides valuable guidance.</p>
            
            <h3>Regular Updates</h3>
            <p>We continuously update our knowledge center with new content reflecting the latest legal developments. Our team of lawyers and researchers work diligently to ensure the information is current, accurate, and actionable.</p>
            
            <h3>Access the Knowledge Center</h3>
            <p>Visit our website to access the full range of resources available through our knowledge center. Subscribe to receive automatic updates when new materials are published.</p>
        `
    },
    news6: {
        title: 'Career Opportunities at TBLI',
        subtitle: 'June 2025',
        image: "background: linear-gradient(135deg, rgba(226, 165, 57, 0.3), rgba(21, 29, 65, 0.8)), url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 400%22%3E%3Crect fill=%22%23151D41%22 width=%22800%22 height=%22400%22/%3E%3Ctext x=%22400%22 y=%22200%22 font-family=%22Arial%22 font-size=%2236%22 fill=%22%23E2A539%22 text-anchor=%22middle%22%3ECareer Opportunities%3C/text%3E%3C/svg%3E'); background-size: cover; background-position: center;",
        body: `
            <p>TBLI is recruiting lawyers, researchers, and interns who demonstrate strong analytical ability, ethical commitment, and dedication to service excellence.</p>
            
            <h3>Join Our Team</h3>
            <p>We are looking for talented legal professionals who share our values and commitment to excellence. Whether you're an experienced lawyer or just beginning your career, TBLI offers opportunities to work on challenging matters that make a real difference.</p>
            
            <h3>What We Offer</h3>
            <p>Our work environment emphasizes:
            <ul>
                <li>Mentorship from experienced legal professionals</li>
                <li>Collaboration across practice areas</li>
                <li>Continuous professional development</li>
                <li>Exposure to diverse and challenging legal work</li>
                <li>Competitive compensation and benefits</li>
            </ul>
            </p>
            
            <h3>Open Positions</h3>
            <p>We have current openings for:
            <ul>
                <li>Senior Associates (Corporate Law, Litigation)</li>
                <li>Associates (Various Practice Areas)</li>
                <li>Legal Researchers</li>
                <li>Articled Clerks</li>
                <li>Interns</li>
            </ul>
            </p>
            
            <h3>How to Apply</h3>
            <p>Submit your CV and a cover letter to info@tsungalawinc.africa with the subject "Career Application." Include your preferred area of practice or interest. We review applications on a rolling basis and contact qualified candidates for interviews.</p>
        `
    },
    team1: {
        title: 'Arnold Tsunga',
        subtitle: 'Managing Partner',
        image: "background: linear-gradient(135deg, rgba(226, 165, 57, 0.2), rgba(21, 29, 65, 0.9)), url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 400%22%3E%3Crect fill=%22%23151D41%22 width=%22800%22 height=%22400%22/%3E%3Ccircle cx=%22400%22 cy=%22200%22 r=%22100%22 fill=%22%23E2A539%22/%3E%3Cpath d=%22M 250 350 Q 400 250 550 350%22 fill=%22%23E2A539%22/%3E%3C/svg%3E'); background-size: cover; background-position: center;",
        body: `
            <p>Arnold Tsunga is the founding Managing Partner of Tsunga Bamu Law International. He is a seasoned lawyer with decades of experience in litigation, governance, and international human-rights work.</p>
            
            <h3>Experience and Expertise</h3>
            <p>Mr. Tsunga has held senior positions in regional and global human-rights institutions and brings a deep understanding of how legal systems function within wider political and economic frameworks. He provides leadership in strategic litigation, legal reform, and multi-jurisdictional projects.</p>
            
            <h3>Practice Focus</h3>
            <p>Mr. Tsunga's practice encompasses:
            <ul>
                <li>Corporate law and commercial transactions</li>
                <li>Public interest and human rights litigation</li>
                <li>Governance and rule of law advisory</li>
                <li>Justice sector reform</li>
                <li>Civic space protection</li>
            </ul>
            </p>
            
            <h3>Professional Background</h3>
            <p>Throughout his distinguished career, Mr. Tsunga has worked with governments, international organizations, NGOs, and private sector clients. His experience spans multiple jurisdictions and sectors, providing him with unique insights into complex legal and policy challenges.</p>
            
            <h3>Leadership Vision</h3>
            <p>Under Mr. Tsunga's leadership, TBLI has established itself as a firm that integrates commercial understanding with a commitment to rights-based governance. He emphasizes integrity in representation, precision in legal drafting, and accountability to both clients and the law.</p>
        `
    },
    team2: {
        title: 'Chipo Moyo',
        subtitle: 'Senior Associate - Corporate Transactions',
        image: "background: linear-gradient(135deg, rgba(226, 165, 57, 0.2), rgba(21, 29, 65, 0.9)), url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 400%22%3E%3Crect fill=%22%23151D41%22 width=%22800%22 height=%22400%22/%3E%3Ccircle cx=%22400%22 cy=%22200%22 r=%22100%22 fill=%22%23E2A539%22/%3E%3Cpath d=%22M 250 350 Q 400 250 550 350%22 fill=%22%23E2A539%22/%3E%3C/svg%3E'); background-size: cover; background-position: center;",
        body: `
            <p>Chipo Moyo is a Senior Associate specializing in corporate transactions, mergers and acquisitions, and commercial contract negotiations.</p>
            
            <h3>Expertise</h3>
            <p>Chipo has extensive experience advising local and international businesses on:
            <ul>
                <li>Company formations and restructuring</li>
                <li>Mergers and acquisitions</li>
                <li>Commercial contracts and negotiations</li>
                <li>Cross-border transactions</li>
                <li>Corporate compliance</li>
            </ul>
            </p>
            
            <h3>Professional Approach</h3>
            <p>Known for her commercial acumen and attention to detail, Chipo works closely with clients to understand their business objectives and structure transactions that achieve their goals while managing legal and regulatory risks.</p>
            
            <h3>Education and Qualifications</h3>
            <p>Chipo holds an LLB from the University of Zimbabwe and is admitted to practice in Zimbabwe. She regularly participates in professional development programs to stay current with corporate law developments.</p>
        `
    },
    team3: {
        title: 'Tadiwa Ndlovu',
        subtitle: 'Senior Associate - Litigation',
        image: "background: linear-gradient(135deg, rgba(226, 165, 57, 0.2), rgba(21, 29, 65, 0.9)), url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 400%22%3E%3Crect fill=%22%23151D41%22 width=%22800%22 height=%22400%22/%3E%3Ccircle cx=%22400%22 cy=%22200%22 r=%22100%22 fill=%22%23E2A539%22/%3E%3Cpath d=%22M 250 350 Q 400 250 550 350%22 fill=%22%23E2A539%22/%3E%3C/svg%3E'); background-size: cover; background-position: center;",
        body: `
            <p>Tadiwa Ndlovu is a Senior Associate with expertise in civil and commercial litigation. He has extensive courtroom experience across all judicial levels in Zimbabwe.</p>
            
            <h3>Litigation Practice</h3>
            <p>Tadiwa represents clients in:
            <ul>
                <li>Commercial disputes</li>
                <li>Civil litigation</li>
                <li>Contract disputes</li>
                <li>Debt recovery</li>
                <li>Appellate advocacy</li>
            </ul>
            </p>
            
            <h3>Strategic Approach</h3>
            <p>Tadiwa emphasizes early dispute evaluation and strategic planning. He works to achieve efficient resolution of matters through negotiation when possible, while being fully prepared to litigate vigorously when necessary.</p>
            
            <h3>Professional Values</h3>
            <p>Tadiwa is committed to providing responsive, client-focused service. He keeps clients informed throughout the litigation process and provides clear assessments of risks and opportunities at each stage of a matter.</p>
        `
    },
    team4: {
        title: 'Rumbidzai Kachote',
        subtitle: 'Associate - Human Rights',
        image: "background: linear-gradient(135deg, rgba(226, 165, 57, 0.2), rgba(21, 29, 65, 0.9)), url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 400%22%3E%3Crect fill=%22%23151D41%22 width=%22800%22 height=%22400%22/%3E%3Ccircle cx=%22400%22 cy=%22200%22 r=%22100%22 fill=%22%23E2A539%22/%3E%3Cpath d=%22M 250 350 Q 400 250 550 350%22 fill=%22%23E2A539%22/%3E%3C/svg%3E'); background-size: cover; background-position: center;",
        body: `
            <p>Rumbidzai Kachote is an Associate dedicated to constitutional and administrative law cases advancing fundamental freedoms and access to justice.</p>
            
            <h3>Human Rights Focus</h3>
            <p>Rumbidzai's practice focuses on:
            <ul>
                <li>Constitutional litigation</li>
                <li>Administrative law challenges</li>
                <li>Human rights advocacy</li>
                <li>Public interest cases</li>
            </ul>
            </p>
            
            <h3>Commitment to Justice</h3>
            <p>Rumbidzai is passionate about using the law to protect individual rights and advance social justice. She has been involved in several important constitutional cases and dedicates significant time to pro bono work.</p>
            
            <h3>Education</h3>
            <p>Rumbidzai holds an LLB from the University of Zimbabwe and has completed specialized training in human rights law. She is admitted to practice in Zimbabwe.</p>
        `
    },
    team5: {
        title: 'Farai Muponda',
        subtitle: 'Associate - Compliance',
        image: "background: linear-gradient(135deg, rgba(226, 165, 57, 0.2), rgba(21, 29, 65, 0.9)), url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 400%22%3E%3Crect fill=%22%23151D41%22 width=%22800%22 height=%22400%22/%3E%3Ccircle cx=%22400%22 cy=%22200%22 r=%22100%22 fill=%22%23E2A539%22/%3E%3Cpath d=%22M 250 350 Q 400 250 550 350%22 fill=%22%23E2A539%22/%3E%3C/svg%3E'); background-size: cover; background-position: center;",
        body: `
            <p>Farai Muponda is an Associate with expertise in regulatory compliance, corporate governance, and risk management strategies for businesses.</p>
            
            <h3>Compliance Practice</h3>
            <p>Farai helps clients navigate:
            <ul>
                <li>Corporate governance requirements</li>
                <li>Anti-corruption compliance</li>
                <li>Data protection and privacy</li>
                <li>Sector-specific licensing and regulation</li>
                <li>Compliance program development</li>
            </ul>
            </p>
            
            <h3>Practical Guidance</h3>
            <p>Farai provides practical, business-oriented compliance advice. He helps clients understand their obligations and implement systems to ensure ongoing compliance with applicable laws and regulations.</p>
            
            <h3>Professional Background</h3>
            <p>Farai has worked with businesses across multiple sectors and brings both legal expertise and understanding of business operations to his compliance advisory work.</p>
        `
    },
    team6: {
        title: 'Nyasha Mutasa',
        subtitle: 'Junior Associate - Research',
        image: "background: linear-gradient(135deg, rgba(226, 165, 57, 0.2), rgba(21, 29, 65, 0.9)), url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 400%22%3E%3Crect fill=%22%23151D41%22 width=%22800%22 height=%22400%22/%3E%3Ccircle cx=%22400%22 cy=%22200%22 r=%22100%22 fill=%22%23E2A539%22/%3E%3Cpath d=%22M 250 350 Q 400 250 550 350%22 fill=%22%23E2A539%22/%3E%3C/svg%3E'); background-size: cover; background-position: center;",
        body: `
            <p>Nyasha Mutasa is a Junior Associate who provides research-driven advisory support and analytical work across multiple practice areas.</p>
            
            <h3>Research Capabilities</h3>
            <p>Nyasha conducts legal research on complex matters, prepares memoranda and briefing notes, and supports senior lawyers in developing legal strategies. Her research spans corporate law, litigation, and public interest matters.</p>
            
            <h3>Analytical Skills</h3>
            <p>Known for thorough research and clear analysis, Nyasha helps the firm stay current with legal developments and provides the analytical foundation for client advice and litigation strategies.</p>
            
            <h3>Professional Development</h3>
            <p>As a junior member of the team, Nyasha benefits from mentorship by senior lawyers and exposure to diverse legal matters, building a strong foundation for her legal career.</p>
        `
    },
    team7: {
        title: 'Kudakwashe Chikwanha',
        subtitle: 'Junior Associate - Contracts',
        image: "background: linear-gradient(135deg, rgba(226, 165, 57, 0.2), rgba(21, 29, 65, 0.9)), url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 400%22%3E%3Crect fill=%22%23151D41%22 width=%22400%22 height=%22300%22/%3E%3Ccircle cx=%22400%22 cy=%22200%22 r=%22100%22 fill=%22%23E2A539%22/%3E%3Cpath d=%22M 250 350 Q 400 250 550 350%22 fill=%22%23E2A539%22/%3E%3C/svg%3E'); background-size: cover; background-position: center;",
        body: `
            <p>Kudakwashe Chikwanha is a Junior Associate who assists with contract drafting, review, and commercial agreement negotiations for diverse clients.</p>
            
            <h3>Contract Work</h3>
            <p>Kudakwashe works on:
            <ul>
                <li>Commercial contract drafting and review</li>
                <li>Service agreements</li>
                <li>Supply and distribution agreements</li>
                <li>Employment contracts</li>
                <li>Non-disclosure agreements</li>
            </ul>
            </p>
            
            <h3>Attention to Detail</h3>
            <p>Kudakwashe brings precision and attention to detail to all contract work. He ensures that agreements clearly reflect the parties' intentions while protecting clients' interests.</p>
            
            <h3>Learning and Growth</h3>
            <p>Working under the supervision of senior lawyers, Kudakwashe continues to develop his expertise in commercial transactions and contract law.</p>
        `
    },
    team8: {
        title: 'Tendai Makoni',
        subtitle: 'Legal Consultant - Governance',
        image: "background: linear-gradient(135deg, rgba(226, 165, 57, 0.2), rgba(21, 29, 65, 0.9)), url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 800 400%22%3E%3Crect fill=%22%23151D41%22 width=%22800%22 height=%22400%22/%3E%3Ccircle cx=%22400%22 cy=%22200%22 r=%22100%22 fill=%22%23E2A539%22/%3E%3Cpath d=%22M 250 350 Q 400 250 550 350%22 fill=%22%23E2A539%22/%3E%3C/svg%3E'); background-size: cover; background-position: center;",
        body: `
            <p>Tendai Makoni is a Legal Consultant who provides strategic advisory on governance frameworks, election law, and institutional reform projects.</p>
            
            <h3>Governance Expertise</h3>
            <p>Tendai advises on:
            <ul>
                <li>Corporate governance structures</li>
                <li>Election law and electoral processes</li>
                <li>Institutional reform and capacity building</li>
                <li>Rule of law initiatives</li>
                <li>Policy development</li>
            </ul>
            </p>
            
            <h3>International Experience</h3>
            <p>Tendai has worked with development agencies, election management bodies, and civil society organizations across Africa. His work promotes transparent legal frameworks and credible governance systems.</p>
            
            <h3>Collaborative Approach</h3>
            <p>Tendai works collaboratively with stakeholders to develop practical governance solutions that are contextually appropriate and sustainable. He brings both technical legal expertise and understanding of political and institutional dynamics.</p>
        `
    }
};

// Modal functionality
function openModal(id) {
    const data = modalData[id];
    if (data) {
        document.getElementById('modalTitle').textContent = data.title;
        document.getElementById('modalSubtitle').textContent = data.subtitle;
        document.getElementById('modalBody').innerHTML = data.body;
        
        // Set modal image if it exists
        const modalImage = document.getElementById('modalImage');
        if (data.image) {
            modalImage.style.cssText = data.image;
        } else {
            modalImage.style.display = 'none';
        }
        
        document.getElementById('modal').classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal() {
    document.getElementById('modal').classList.remove('active');
    document.body.style.overflow = 'auto';
}

// Close modal when clicking outside
document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('modal');
    
    modal.addEventListener('click', function(e) {
        if (e.target === this) {
            closeModal();
        }
    });
    
    // Close modal with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.classList.contains('active')) {
            closeModal();
        }
    });
    
    // Initialize - show home page
    navigate('home');
});

// Form submission with security
function handleSubmit(event) {
    event.preventDefault();
    
    // Get form values
    const nameInput = document.getElementById('name');
    const emailInput = document.getElementById('email');
    const subjectInput = document.getElementById('subject');
    const messageInput = document.getElementById('message');
    
    // Validate and sanitize inputs
    const name = sanitizeInput(nameInput.value.trim());
    const email = emailInput.value.trim();
    const subject = sanitizeInput(subjectInput.value.trim());
    const message = sanitizeInput(messageInput.value.trim());
    
    // Validation
    if (!name || name.length < 2) {
        alert('Please enter a valid name (at least 2 characters).');
        nameInput.focus();
        return false;
    }
    
    if (!isValidEmail(email)) {
        alert('Please enter a valid email address.');
        emailInput.focus();
        return false;
    }
    
    if (!subject || subject.length < 5) {
        alert('Please enter a subject (at least 5 characters).');
        subjectInput.focus();
        return false;
    }
    
    if (!message || message.length < 10) {
        alert('Please enter a message (at least 10 characters).');
        messageInput.focus();
        return false;
    }
    
    // Success message
    alert(`Thank you, ${name}! Your message has been received. Our team will get back to you shortly at ${email}.`);
    
    // Reset form
    event.target.reset();
    
    // In production, you would send this data to a secure backend endpoint
    // Example:
    // fetch('/api/contact', {
    //     method: 'POST',
    //     headers: {
    //         'Content-Type': 'application/json',
    //     },
    //     body: JSON.stringify({ name, email, subject, message })
    // });
    
    return false;
}
