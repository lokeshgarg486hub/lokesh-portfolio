// =====================================================
// CONFIG — environment-aware (same logic as dynamic.js)
// =====================================================
const API_BASE_URL = (['localhost', '127.0.0.1'].includes(window.location.hostname))
    ? 'http://localhost:8000/api'
    : 'https://lokesh-portfolio-api.vercel.app/api';

const TOKEN_KEY = 'admin_jwt_token';

// =====================================================
// AUTHENTICATION LOGIC
// =====================================================
function checkAuth() {
    const token = localStorage.getItem(TOKEN_KEY);
    const loginView = document.getElementById('login-view');
    const dashView = document.getElementById('dashboard-view');
    if (token) {
        loginView.style.display = 'none';
        dashView.style.display = 'block';
        loadAllData();
    } else {
        loginView.style.display = 'flex';
        dashView.style.display = 'none';
    }
}

document.getElementById('login-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errEl = document.getElementById('login-error');
    if (errEl) errEl.style.display = 'none';
    const formData = new URLSearchParams(new FormData(e.target));
    try {
        const res = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            body: formData,
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        if (res.ok) {
            const data = await res.json();
            localStorage.setItem(TOKEN_KEY, data.access_token);
            checkAuth();
        } else {
            if (errEl) errEl.style.display = 'block';
        }
    } catch {
        if (errEl) errEl.style.display = 'block';
    }
});

document.getElementById('logout-btn')?.addEventListener('click', () => {
    localStorage.removeItem(TOKEN_KEY);
    checkAuth();
});

// =====================================================
// PROTECTED FETCH WRAPPER
// =====================================================
async function api(endpoint, options = {}) {
    const token = localStorage.getItem(TOKEN_KEY);
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
    };

    if (options.body instanceof FormData) delete headers['Content-Type'];

    const res = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });
    if (res.status === 401) {
        localStorage.removeItem(TOKEN_KEY);
        checkAuth();
        throw new Error('Unauthorized');
    }
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `HTTP ${res.status}`);
    }
    if (res.status === 204 || options.method === 'DELETE') {
        return res.text().then(t => t ? JSON.parse(t) : {});
    }
    return res.json();
}

// =====================================================
// TAB NAVIGATION
// =====================================================
function showTab(name) {
    document.querySelectorAll('.tab-section').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.sidebar .nav-link').forEach(el => el.classList.remove('active'));
    document.getElementById(`tab-${name}`)?.classList.add('active');
    document.querySelectorAll('.sidebar .nav-link').forEach(el => {
        if (el.getAttribute('onclick')?.includes(`'${name}'`)) el.classList.add('active');
    });
    if (name === 'analytics') loadAnalytics();
    if (name === 'custom-domain') loadSiteSettings();
}

// =====================================================
// MODAL SYSTEM & SCHEMAS
// =====================================================
let _currentCollection = null;
let _currentEditId = null;
let _domainList = [];
let currentWorkspaceDomain = null;

const SCHEMAS = {
    blog: {
        label: 'Blog Post',
        endpoint: '/blogs',
        fields: [
            { name: 'title',           label: 'Article Title',            type: 'text',     required: true },
            { name: 'slug',            label: 'URL Slug (auto-generated if empty)', type: 'text' },
            { name: 'category',        label: 'Category / Domain',        type: 'select',   options: ['AI & ML', 'Web Dev', 'Cloud & Systems', 'Data Science', 'Cyber Security'], required: true },
            { name: 'summary',         label: 'Short Excerpt / Summary',  type: 'textarea', required: true },
            { name: 'content',         label: 'Full Article Content (Markdown/HTML)', type: 'textarea', required: true },
            { name: 'cover_image_url', label: 'Cover Image',              type: 'file' },
            { name: 'read_time',       label: 'Estimated Read Time',      type: 'text' },
            { name: 'tags',            label: 'Tags (comma-separated)',   type: 'text' },
            { name: 'published',       label: 'Publish immediately (Live)', type: 'checkbox' }
        ]
    },
    project: {
        label: 'Project',
        endpoint: '/projects',
        fields: [
            { name: 'title',         label: 'Title',                  type: 'text',     required: true },
            { name: 'domain',        label: 'Domain',                 type: 'domain',   required: true },
            { name: 'description',   label: 'Description',            type: 'textarea', required: true },
            { name: 'details',       label: 'Architecture / Process Summary', type: 'text' },
            { name: 'tech_stack',    label: 'Tech Stack (comma-sep)', type: 'text' },
            { name: 'github_link',   label: 'GitHub URL',             type: 'text' },
            { name: 'demo_link',     label: 'Live Demo URL',          type: 'text' },
            { name: 'featured',      label: 'Featured on homepage',   type: 'checkbox' },
            { name: 'thumbnail_url', label: 'Thumbnail Image',        type: 'file' }
        ]
    },
    certificate: {
        label: 'Certificate',
        endpoint: '/certificates',
        fields: [
            { name: 'title',     label: 'Title',   type: 'text',   required: true },
            { name: 'issuer',    label: 'Issuer',  type: 'text',   required: true },
            { name: 'date',      label: 'Date',    type: 'text',   required: true },
            { name: 'domain',    label: 'Domain',  type: 'domain', required: true },
            { name: 'image_url', label: 'Image',   type: 'file' }
        ]
    },
    internship: {
        label: 'Internship',
        endpoint: '/internships',
        fields: [
            { name: 'company',         label: 'Company',      type: 'text',     required: true },
            { name: 'role',            label: 'Role',         type: 'text',     required: true },
            { name: 'duration',        label: 'Duration',     type: 'text',     required: true },
            { name: 'domain',          label: 'Domain',       type: 'domain',   required: true },
            { name: 'description',     label: 'Description',  type: 'textarea' },
            { name: 'certificate_url', label: 'Certificate',  type: 'file' }
        ]
    },
    domain: {
        label: 'Domain',
        endpoint: '/domains',
        fields: [
            { name: 'title',       label: 'Title',       type: 'text',     required: true },
            { name: 'description', label: 'Description', type: 'textarea', required: true },
            { name: 'icon_class',  label: 'Icon Class',  type: 'text',     required: true }
        ]
    },
    social: {
        label: 'Social Link',
        endpoint: '/social-links',
        fields: [
            { name: 'platform_name', label: 'Platform',  type: 'text', required: true },
            { name: 'url',           label: 'URL',        type: 'text', required: true },
            { name: 'icon_class',    label: 'Icon Class', type: 'text', required: true }
        ]
    },
    testimonial: {
        label: 'Testimonial',
        endpoint: '/testimonials',
        fields: [
            { name: 'author_name',      label: 'Author Name',      type: 'text',     required: true },
            { name: 'author_role',      label: 'Author Role/Title', type: 'text' },
            { name: 'quote',            label: 'Quote',            type: 'textarea', required: true },
            { name: 'author_photo_url', label: 'Author Photo',     type: 'file' }
        ]
    },
    skill: {
        label: 'Skill',
        endpoint: '/skills',
        fields: [
            { name: 'name',        label: 'Skill Name',   type: 'text',   required: true },
            { name: 'domain',      label: 'Domain (category)', type: 'domain', required: true },
            { name: 'proficiency', label: 'Proficiency',  type: 'select', options: ['Beginner','Intermediate','Advanced','Expert'], required: true },
            { name: 'icon_class',  label: 'Icon Class',   type: 'text' }
        ]
    },
    education: {
        label: 'Education',
        endpoint: '/education',
        fields: [
            { name: 'institution',    label: 'Institution',      type: 'text',     required: true },
            { name: 'degree',         label: 'Degree',           type: 'text',     required: true },
            { name: 'field_of_study', label: 'Field of Study',   type: 'text' },
            { name: 'start_date',     label: 'Start Date',       type: 'text' },
            { name: 'end_date',       label: 'End Date',         type: 'text' },
            { name: 'gpa',            label: 'GPA (optional)',   type: 'text' },
            { name: 'description',    label: 'Description',      type: 'textarea' },
            { name: 'highlights',     label: 'Highlights (comma-separated)', type: 'text' }
        ]
    }
};

function openAddModal(collection, existingData = null, prefilledDomain = null) {
    _currentCollection = collection;
    _currentEditId = existingData?.id || null;
    const schema = SCHEMAS[collection];
    if (!schema) return;
    
    document.getElementById('modal-title').textContent = existingData ? `Edit ${schema.label}` : `Add ${schema.label}`;

    const fieldsHtml = schema.fields.map(f => {
        let input = '';
        let val = existingData?.[f.name] ?? '';

        if ((f.name === 'tech_stack' || f.name === 'highlights' || f.name === 'tags') && Array.isArray(val)) val = val.join(', ');

        if (f.type === 'domain') {
            const domainVal = prefilledDomain || val;
            const options = _domainList.map(d =>
                `<option value="${d.title}" ${d.title === domainVal ? 'selected' : ''}>${d.title}</option>`
            ).join('');
            const isReadonly = prefilledDomain ? 'disabled' : '';
            input = `<select name="${f.name}" class="form-select" ${f.required ? 'required' : ''} ${isReadonly}><option value="">-- Select Domain --</option>${options}</select>`;
            if (prefilledDomain) {
                input += `<input type="hidden" name="${f.name}" value="${prefilledDomain}">`;
            }
        } else if (f.type === 'select') {
            const options = (f.options || []).map(o =>
                `<option value="${o}" ${o === val ? 'selected' : ''}>${o}</option>`
            ).join('');
            input = `<select name="${f.name}" class="form-select" ${f.required ? 'required' : ''}>${options}</select>`;
        } else if (f.type === 'textarea') {
            input = `<textarea name="${f.name}" class="form-control" rows="4" ${f.required ? 'required' : ''}>${val}</textarea>`;
        } else if (f.type === 'checkbox') {
            const checked = (existingData && existingData[f.name] !== false) ? 'checked' : (existingData ? '' : 'checked');
            input = `
                <div class="form-check mt-2">
                    <input type="checkbox" name="${f.name}" id="field-${f.name}" class="form-check-input" ${checked}>
                    <label class="form-check-label" for="field-${f.name}">${f.label}</label>
                </div>`;
        } else if (f.type === 'file') {
            input = `
                <input type="file" name="${f.name}_file" class="form-control mb-1" accept="image/*">
                <input type="text" name="${f.name}" class="form-control" placeholder="Or paste image URL directly" value="${val}">
            `;
        } else {
            input = `<input type="text" name="${f.name}" class="form-control" value="${val}" ${f.required ? 'required' : ''}>`;
        }
        return `<div class="mb-3"><label class="form-label fw-semibold">${f.label}${f.required ? ' *' : ''}</label>${input}</div>`;
    }).join('');

    document.getElementById('modal-fields').innerHTML = fieldsHtml;
    document.getElementById('form-modal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('form-modal').style.display = 'none';
    _currentCollection = null;
    _currentEditId = null;
}

document.getElementById('modal-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const schema = SCHEMAS[_currentCollection];
    const formEl = e.target;
    const submitBtn = formEl.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving...';

    try {
        const payload = {};
        for (const f of schema.fields) {
            if (f.type === 'file') {
                const fileInput = formEl.querySelector(`[name="${f.name}_file"]`);
                const urlInput = formEl.querySelector(`[name="${f.name}"]`);
                if (fileInput?.files?.length) {
                    const fd = new FormData();
                    fd.append('file', fileInput.files[0]);
                    const uploadRes = await api('/upload', { method: 'POST', body: fd, headers: {} });
                    payload[f.name] = uploadRes.url;
                } else {
                    payload[f.name] = urlInput?.value || '';
                }
            } else if (f.type === 'checkbox') {
                const checkbox = formEl.querySelector(`[name="${f.name}"]`);
                payload[f.name] = checkbox?.checked || false;
            } else if (['tech_stack', 'highlights', 'tags'].includes(f.name)) {
                const input = formEl.querySelector(`[name="${f.name}"]`);
                payload[f.name] = (input?.value || '').split(',').map(s => s.trim()).filter(Boolean);
            } else {
                const input = formEl.querySelector(`[name="${f.name}"]`);
                payload[f.name] = input?.value || '';
            }
        }

        if (_currentEditId) {
            await api(`${schema.endpoint}/${_currentEditId}`, { method: 'PUT', body: JSON.stringify(payload) });
        } else {
            await api(schema.endpoint, { method: 'POST', body: JSON.stringify(payload) });
        }

        const updatedCollection = _currentCollection;
        closeModal();
        reloadCollection(updatedCollection);
    } catch (err) {
        alert(`Error: ${err.message}`);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Save';
    }
});

// =====================================================
// CUSTOM DOMAIN / SITE SETTINGS
// =====================================================
async function loadSiteSettings() {
    try {
        const settings = await fetch(`${API_BASE_URL}/site-settings`).then(r => r.json());
        if (settings) {
            if (document.getElementById('ds-domain')) document.getElementById('ds-domain').value = settings.custom_domain || '';
            if (document.getElementById('ds-canonical')) document.getElementById('ds-canonical').value = settings.canonical_url || '';
            if (document.getElementById('ds-title')) document.getElementById('ds-title').value = settings.site_title || '';
            if (document.getElementById('ds-seo')) document.getElementById('ds-seo').value = settings.seo_description || '';
        }
    } catch (e) {
        console.error("Failed to load site settings", e);
    }
}

document.getElementById('domain-settings-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Saving...';
    try {
        const payload = {
            custom_domain: document.getElementById('ds-domain').value,
            site_title: document.getElementById('ds-title').value,
            canonical_url: document.getElementById('ds-canonical').value,
            cname_target: document.getElementById('ds-cname')?.value || 'cname.vercel-dns.com',
            seo_description: document.getElementById('ds-seo').value
        };
        await api('/site-settings', { method: 'PUT', body: JSON.stringify(payload) });
        const msg = document.getElementById('domain-save-msg');
        if (msg) {
            msg.style.display = 'inline';
            setTimeout(() => msg.style.display = 'none', 3000);
        }
    } catch (err) {
        alert(`Save failed: ${err.message}`);
    } finally {
        btn.disabled = false;
        btn.textContent = 'Save Domain Settings';
    }
});

// =====================================================
// DELETE ITEM
// =====================================================
async function deleteItem(collection, id) {
    if (!confirm('Are you sure you want to delete this item? This cannot be undone.')) return;
    try {
        await api(`${SCHEMAS[collection].endpoint}/${id}`, { method: 'DELETE' });
        reloadCollection(collection);
    } catch (err) {
        alert(`Delete failed: ${err.message}`);
    }
}

// =====================================================
// RENDER HELPERS
// =====================================================
function actionBtns(collection, item) {
    return `
        <button class="btn btn-xs btn-sm btn-outline-primary me-1" onclick='openAddModal("${collection}", ${JSON.stringify(item).replace(/'/g, "&#39;")})'>
            <i class="ri-edit-line"></i> Edit
        </button>
        <button class="btn btn-xs btn-sm btn-outline-danger" onclick='deleteItem("${collection}", "${item.id}")'>
            <i class="ri-delete-bin-line"></i>
        </button>
    `;
}

function renderTable(tbodyId, rows) {
    const el = document.getElementById(tbodyId);
    if (el) el.innerHTML = rows.length
        ? rows.join('')
        : `<tr><td colspan="10" class="text-center text-muted py-3">No items yet. Click "Add" to create one.</td></tr>`;
}

// =====================================================
// LOAD ALL DATA
// =====================================================
async function loadAllData() {
    try {
        const [blogs, projects, certs, internships, domains, social, messages, profile, testimonials, skills, education] = await Promise.all([
            api('/blogs'),
            api('/projects'),
            api('/certificates'),
            api('/internships'),
            api('/domains'),
            api('/social-links'),
            api('/messages'),
            fetch(`${API_BASE_URL}/profile`).then(r => r.json()),
            api('/testimonials'),
            api('/skills'),
            api('/education')
        ]);

        _domainList = domains;
        renderBlogs(blogs);
        renderProjects(projects);
        renderCertificates(certs);
        renderInternships(internships);
        renderDomains(domains);
        renderSocial(social);
        renderMessages(messages);
        renderProfile(profile);
        renderTestimonials(testimonials);
        renderSkills(skills);
        renderEducation(education);
        loadSiteSettings();

    } catch (err) {
        console.error('[admin.js] loadAllData failed:', err);
    }
}

// =====================================================
// TARGETED RELOADS
// =====================================================
async function reloadCollection(collection) {
    try {
        if (collection === 'blog') renderBlogs(await api('/blogs'));
        else if (collection === 'project') renderProjects(await api('/projects'));
        else if (collection === 'certificate') renderCertificates(await api('/certificates'));
        else if (collection === 'internship') renderInternships(await api('/internships'));
        else if (collection === 'domain') {
            _domainList = await api('/domains');
            renderDomains(_domainList);
        }
        else if (collection === 'social') renderSocial(await api('/social-links'));
        else if (collection === 'testimonial') renderTestimonials(await api('/testimonials'));
        else if (collection === 'skill') renderSkills(await api('/skills'));
        else if (collection === 'education') renderEducation(await api('/education'));
    } catch (err) {
        console.error(`Failed to reload ${collection}`, err);
    }
}

// =====================================================
// RENDER FUNCTIONS
// =====================================================
function renderBlogs(blogs) {
    renderTable('list-blogs', blogs.map(b => `
        <tr>
            <td>
                <strong>${b.title}</strong>
                <div style="font-size:12px;color:var(--admin-text);">${b.slug ? '/' + b.slug : ''}</div>
            </td>
            <td><span class="badge bg-secondary">${b.category || 'Tech'}</span></td>
            <td>${b.read_time || '5 min read'}</td>
            <td>${b.views_count || 0}</td>
            <td>
                ${b.published 
                    ? '<span class="badge-status active">Live</span>' 
                    : '<span class="badge-status draft">Draft</span>'}
            </td>
            <td>${actionBtns('blog', b)}</td>
        </tr>
    `));
}

function renderProjects(projects) {
    renderTable('list-projects', projects.map(p => `
        <tr>
            <td>${p.title}</td>
            <td><span class="badge bg-secondary">${p.domain}</span></td>
            <td>${p.featured ? '<span class="badge bg-success">⭐ Featured</span>' : '—'}</td>
            <td>
                ${p.github_link ? `<a href="${p.github_link}" target="_blank" class="me-1"><i class="ri-github-line"></i></a>` : ''}
                ${p.demo_link ? `<a href="${p.demo_link}" target="_blank"><i class="ri-external-link-line"></i></a>` : '—'}
            </td>
            <td>${actionBtns('project', p)}</td>
        </tr>
    `));
}

function renderCertificates(certs) {
    renderTable('list-certificates', certs.map(c => `
        <tr>
            <td>${c.title}</td>
            <td>${c.issuer}</td>
            <td>${c.date}</td>
            <td><span class="badge bg-secondary">${c.domain}</span></td>
            <td>${actionBtns('certificate', c)}</td>
        </tr>
    `));
}

function renderInternships(internships) {
    renderTable('list-internships', internships.map(i => `
        <tr>
            <td>${i.role}</td>
            <td>${i.company}</td>
            <td>${i.duration}</td>
            <td><span class="badge bg-secondary">${i.domain}</span></td>
            <td>${actionBtns('internship', i)}</td>
        </tr>
    `));
}

function renderDomains(domains) {
    renderTable('list-domains', domains.map(d => `
        <tr>
            <td>${d.title}</td>
            <td>${(d.description||'').substring(0, 60)}...</td>
            <td><code>${d.icon_class}</code></td>
            <td>${actionBtns('domain', d)}</td>
        </tr>
    `));
}

function renderSocial(social) {
    renderTable('list-social', social.map(s => `
        <tr>
            <td>${s.platform_name}</td>
            <td><a href="${s.url}" target="_blank">${s.url.substring(0, 40)}...</a></td>
            <td><code>${s.icon_class}</code></td>
            <td>${actionBtns('social', s)}</td>
        </tr>
    `));
}

function renderMessages(messages) {
    renderTable('list-messages', messages.map(m => `
        <tr>
            <td>${m.name}</td>
            <td>${m.email}</td>
            <td>${m.subject || '—'}</td>
            <td>${(m.message || '').substring(0, 60)}${m.message?.length > 60 ? '…' : ''}</td>
            <td>${m.date_sent ? new Date(m.date_sent).toLocaleDateString() : '—'}</td>
            <td>
                ${m.replied
                    ? '<span class="badge bg-success">Replied</span>'
                    : `<button class="btn btn-xs btn-sm btn-outline-primary" onclick='openReplyModal("${m.id}", "${m.email}", "${m.name.replace(/"/g, '&quot;')}")'>Reply</button>`
                }
            </td>
        </tr>
    `));
}

function renderTestimonials(testimonials) {
    renderTable('list-testimonials', testimonials.map(t => `
        <tr>
            <td>${t.author_name}</td>
            <td>${t.author_role || '—'}</td>
            <td>${(t.quote || '').substring(0, 60)}…</td>
            <td>${actionBtns('testimonial', t)}</td>
        </tr>
    `));
}

function renderSkills(skills) {
    renderTable('list-skills', skills.map(s => `
        <tr>
            <td>${s.name}</td>
            <td><span class="badge bg-secondary">${s.proficiency}</span></td>
            <td>${s.domain || '—'}</td>
            <td>${actionBtns('skill', s)}</td>
        </tr>
    `));
}

function renderEducation(education) {
    renderTable('list-education', education.map(e => `
        <tr>
            <td>${e.institution}</td>
            <td>${e.degree}${e.field_of_study ? ' — ' + e.field_of_study : ''}</td>
            <td>${e.start_date || ''}${e.end_date ? ' – ' + e.end_date : ''}</td>
            <td>${e.gpa || '—'}</td>
            <td>${actionBtns('education', e)}</td>
        </tr>
    `));
}

function renderProfile(profile) {
    if (!profile) return;
    if (document.getElementById('p-name')) document.getElementById('p-name').value = profile.name || '';
    if (document.getElementById('p-tagline')) document.getElementById('p-tagline').value = profile.tagline || '';
    if (document.getElementById('p-location')) document.getElementById('p-location').value = profile.location || '';
    if (document.getElementById('p-bio')) document.getElementById('p-bio').value = profile.bio || '';
    if (document.getElementById('p-photo')) document.getElementById('p-photo').value = profile.profile_photo_url || '';
    if (document.getElementById('p-resume')) document.getElementById('p-resume').value = profile.resume_url || '';
    
    const freelanceCheck = document.getElementById('p-freelance');
    if (freelanceCheck) {
        freelanceCheck.checked = profile.available_for_freelance || false;
    }
}

// Profile save
document.getElementById('profile-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Saving...';
    }

    let photoUrl = document.getElementById('p-photo').value;
    const fileInput = document.getElementById('p-photo-file');
    
    try {
        if (fileInput?.files?.length) {
            const fd = new FormData();
            fd.append('file', fileInput.files[0]);
            const uploadRes = await api('/upload', { method: 'POST', body: fd, headers: {} });
            photoUrl = uploadRes.url;
            document.getElementById('p-photo').value = photoUrl;
        }

        const payload = {
            name: document.getElementById('p-name').value,
            tagline: document.getElementById('p-tagline').value,
            location: document.getElementById('p-location').value,
            bio: document.getElementById('p-bio').value,
            profile_photo_url: photoUrl,
            resume_url: document.getElementById('p-resume').value,
            available_for_freelance: document.getElementById('p-freelance')?.checked || false
        };

        await api('/profile', { method: 'PUT', body: JSON.stringify(payload) });
        const msg = document.getElementById('profile-save-msg');
        if (msg) {
            msg.style.display = 'inline';
            setTimeout(() => msg.style.display = 'none', 3000);
        }
    } catch (err) {
        alert(`Save failed: ${err.message}`);
    } finally {
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Save Profile';
        }
    }
});

// =====================================================
// REPLY MODAL
// =====================================================
let _replyMessageId = null;

function openReplyModal(id, email, name) {
    _replyMessageId = id;
    document.getElementById('reply-to').value = email;
    document.getElementById('reply-subject').value = `Re: Message from ${name}`;
    document.getElementById('reply-body').value = '';
    document.getElementById('reply-status').textContent = '';
    document.getElementById('reply-modal').style.display = 'flex';
}

function closeReplyModal() {
    document.getElementById('reply-modal').style.display = 'none';
    _replyMessageId = null;
}

document.getElementById('reply-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const statusEl = document.getElementById('reply-status');
    btn.disabled = true;
    btn.textContent = 'Sending...';
    if (statusEl) statusEl.textContent = '';

    try {
        const res = await api(`/messages/${_replyMessageId}/reply`, {
            method: 'POST',
            body: JSON.stringify({
                subject: document.getElementById('reply-subject').value,
                body: document.getElementById('reply-body').value
            })
        });
        if (statusEl) {
            statusEl.style.color = '#28a745';
            statusEl.textContent = `✅ Sent!`;
        }
        setTimeout(() => {
            closeReplyModal();
            api('/messages').then(renderMessages);
        }, 1500);
    } catch (err) {
        if (statusEl) {
            statusEl.style.color = '#dc3545';
            statusEl.textContent = `❌ Error: ${err.message}`;
        }
    } finally {
        btn.disabled = false;
        btn.textContent = 'Send Reply';
    }
});

// =====================================================
// ANALYTICS
// =====================================================
let _chartPageViews = null;
let _chartCvDownloads = null;

async function loadAnalytics() {
    try {
        const summary = await api('/analytics/summary?days=30');
        const labels = summary.map(d => d.date);
        const pageViews = summary.map(d => d.page_view);
        const cvDownloads = summary.map(d => d.cv_download);

        const today = new Date().toISOString().slice(0, 10);
        const todayData = summary.find(d => d.date === today) || { page_view: 0, cv_download: 0 };
        if (document.getElementById('analytics-today-views')) document.getElementById('analytics-today-views').textContent = todayData.page_view;
        if (document.getElementById('analytics-today-cv')) document.getElementById('analytics-today-cv').textContent = todayData.cv_download;

        const ctxPV = document.getElementById('chart-page-views')?.getContext('2d');
        if (ctxPV) {
            if (_chartPageViews) _chartPageViews.destroy();
            _chartPageViews = new Chart(ctxPV, {
                type: 'line',
                data: {
                    labels,
                    datasets: [{
                        label: 'Page Views',
                        data: pageViews,
                        borderColor: '#eb5d3a',
                        backgroundColor: 'rgba(235,93,58,0.1)',
                        fill: true,
                        tension: 0.3,
                        pointRadius: 3
                    }]
                },
                options: {
                    responsive: true,
                    plugins: { legend: { labels: { color: '#ccc' } } },
                    scales: {
                        x: { ticks: { color: '#aaa' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                        y: { ticks: { color: '#aaa', stepSize: 1 }, grid: { color: 'rgba(255,255,255,0.05)' } }
                    }
                }
            });
        }

        const ctxCV = document.getElementById('chart-cv-downloads')?.getContext('2d');
        if (ctxCV) {
            if (_chartCvDownloads) _chartCvDownloads.destroy();
            _chartCvDownloads = new Chart(ctxCV, {
                type: 'bar',
                data: {
                    labels,
                    datasets: [{
                        label: 'CV Downloads',
                        data: cvDownloads,
                        backgroundColor: 'rgba(235,93,58,0.6)',
                        borderColor: '#eb5d3a',
                        borderWidth: 1,
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    plugins: { legend: { labels: { color: '#ccc' } } },
                    scales: {
                        x: { ticks: { color: '#aaa' }, grid: { color: 'rgba(255,255,255,0.05)' } },
                        y: { ticks: { color: '#aaa', stepSize: 1 }, grid: { color: 'rgba(255,255,255,0.05)' } }
                    }
                }
            });
        }
    } catch (err) {
        console.error('[admin.js] loadAnalytics failed:', err);
    }
}

// =====================================================
// INIT
// =====================================================
document.addEventListener('DOMContentLoaded', checkAuth);
