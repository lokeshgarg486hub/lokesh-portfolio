import requests
import time

BASE_URL = "http://localhost:8000/api"

def run_tests():
    print("--- Phase 6 Verification ---")
    
    # 1. Login to get token
    res = requests.post(f"{BASE_URL}/auth/login", data={"username": "admin", "password": "secret"})
    if res.status_code != 200:
        print("Login failed, did you change password or not seed admin?", res.text)
        return
    token = res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("âœ… Logged in successfully")

    # 2. Add Testimonial
    t_data = {
        "author_name": "John Doe",
        "author_role": "CEO",
        "quote": "Lokesh is an amazing developer!",
        "author_photo_url": ""
    }
    t_res = requests.post(f"{BASE_URL}/testimonials", json=t_data, headers=headers)
    print("Testimonial Add:", t_res.status_code)
    t_id = t_res.json().get("id")
    
    # Verify GET
    t_get = requests.get(f"{BASE_URL}/testimonials")
    if any(t["id"] == t_id for t in t_get.json()):
        print("âœ… Testimonial appears in GET /api/testimonials")
    else:
        print("âŒ Testimonial missing")

    # 3. Add Project with tech_stack, github, demo, featured
    p_data = {
        "title": "Data Pipeline Dashboard",
        "domain": "Data Science",
        "description": "Real-time dashboard",
        "tech_stack": ["Python", "React", "MongoDB"],
        "github_link": "https://github.com/test",
        "demo_link": "https://demo.com",
        "featured": True
    }
    p_res = requests.post(f"{BASE_URL}/projects", json=p_data, headers=headers)
    print("Project Add:", p_res.status_code)
    
    # Verify Featured filter
    p_feat = requests.get(f"{BASE_URL}/projects?featured=true")
    if p_data["title"] in [p["title"] for p in p_feat.json()]:
        print("âœ… Featured project filter works")
    else:
        print("âŒ Featured project missing")

    # 4. Add Skill & Education
    s_res = requests.post(f"{BASE_URL}/skills", json={"name": "Python", "proficiency": "Expert"}, headers=headers)
    e_res = requests.post(f"{BASE_URL}/education", json={"institution": "MIT", "degree": "BSc Computer Science"}, headers=headers)
    if s_res.status_code == 200 and e_res.status_code == 200:
        print("âœ… Skill and Education added successfully")
    else:
        print("âŒ Skill/Education add failed")

    # 5. Track CV Download and Page View
    requests.post(f"{BASE_URL}/analytics/track", json={"event_type": "page_view", "page": "index.html"})
    requests.post(f"{BASE_URL}/analytics/track", json={"event_type": "cv_download", "page": "index.html"})
    
    # Verify Analytics Summary
    a_res = requests.get(f"{BASE_URL}/analytics/summary?days=30", headers=headers)
    summary = a_res.json()
    if summary and summary[-1].get("page_view", 0) > 0 and summary[-1].get("cv_download", 0) > 0:
        print("âœ… Analytics events recorded and summarized successfully")
    else:
        print("âŒ Analytics summary missing data:", summary)

    # 6. Submit Contact Form and Reply (without real credentials, we expect a 500 complaining about resend package or missing key)
    m_data = {"name": "Alice", "email": "alice@example.com", "subject": "Hello", "message": "Hire me"}
    m_res = requests.post(f"{BASE_URL}/messages", json=m_data)
    m_id = m_res.json().get("id")
    
    reply_data = {"subject": "Re: Hello", "body": "Thank you for reaching out!"}
    r_res = requests.post(f"{BASE_URL}/messages/{m_id}/reply", json=reply_data, headers=headers)
    if r_res.status_code == 500 and ("API_KEY" in r_res.text or "resend" in r_res.text):
         print("âœ… Reply endpoint correctly scaffolded and fails safely on missing Resend credentials")
    elif r_res.status_code == 200:
         print("âœ… Reply sent (credentials worked)")
    else:
         print("âŒ Reply endpoint returned unexpected status:", r_res.status_code, r_res.text)

    print("--- Verification Complete ---")

if __name__ == "__main__":
    run_tests()
