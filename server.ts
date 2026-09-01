import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database("ats_optimizer.db");
const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-for-dev";

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    oauth_provider TEXT,
    subscription_tier TEXT DEFAULT 'free',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME
  );

  CREATE TABLE IF NOT EXISTS ats_assessments (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    resume_text TEXT,
    job_description TEXT,
    ats_score_before REAL,
    ats_score_after REAL,
    match_level TEXT,
    resume_health REAL DEFAULT 0,
    interview_prob_before REAL DEFAULT 0,
    interview_prob_after REAL DEFAULT 0,
    formatting_score REAL DEFAULT 0,
    quantified_achievements_score REAL DEFAULT 0,
    grammar_tone_score REAL DEFAULT 0,
    salary_readiness_score REAL DEFAULT 0,
    salary_band_estimate TEXT,
    career_gap_risk TEXT,
    culture_fit_score REAL DEFAULT 0,
    multi_role_conflict TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS ats_recommendations (
    id TEXT PRIMARY KEY,
    assessment_id TEXT,
    type TEXT, -- add/remove/rewrite
    content TEXT,
    impact_score REAL,
    FOREIGN KEY(assessment_id) REFERENCES ats_assessments(id)
  );

  CREATE TABLE IF NOT EXISTS resume_versions (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    resume_json TEXT,
    ats_score REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS risk_assessments (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    industry TEXT,
    role TEXT,
    skills TEXT,
    experience INTEGER,
    company_status TEXT,
    total_score REAL,
    level TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS linkedin_imports (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    file_path TEXT,
    file_name TEXT,
    file_size INTEGER,
    status TEXT DEFAULT 'queued',
    progress INTEGER DEFAULT 0,
    source TEXT DEFAULT 'pdf',
    error_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS linkedin_profiles (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    import_id TEXT,
    headline TEXT,
    about TEXT,
    location TEXT,
    current_title TEXT,
    current_company TEXT,
    experiences TEXT,
    education TEXT,
    skills TEXT,
    certifications TEXT,
    projects TEXT,
    raw_text TEXT,
    source TEXT DEFAULT 'linkedin',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id),
    FOREIGN KEY(import_id) REFERENCES linkedin_imports(id)
  );

  CREATE TABLE IF NOT EXISTS linkedin_audits (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    import_id TEXT,
    profile_id TEXT,
    total_score INTEGER,
    headline_score INTEGER,
    about_score INTEGER,
    experience_score INTEGER,
    skills_score INTEGER,
    keywords_score INTEGER,
    completeness_score INTEGER,
    strengths TEXT,
    weaknesses TEXT,
    recommendations TEXT,
    rewrites TEXT,
    consistency_score INTEGER,
    consistency_issues TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

// Self-healing migrations for rich ATS scan columns
const atsAssessmentsColumns = [
  "add_lines", "remove_lines", "rewrite_lines", "missing_skills",
  "missing_keywords", "hard_skills", "soft_skills", "keyword_decay",
  "hiring_manager_profile", "impact_prediction"
];
for (const col of atsAssessmentsColumns) {
  try {
    db.exec(`ALTER TABLE ats_assessments ADD COLUMN ${col} TEXT;`);
  } catch (err) {
    // Ignore error if column already exists
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '15mb' }));

  // Auth Middleware
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  };

  // Auth Endpoints
  app.post("/api/auth/register", async (req, res) => {
    const { name, email, password } = req.body;
    try {
      const existingUser = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
      if (existingUser) return res.status(400).json({ error: "Email already exists" });

      const hashedPassword = await bcrypt.hash(password, 10);
      const id = crypto.randomUUID();
      
      db.prepare(`
        INSERT INTO users (id, name, email, password_hash)
        VALUES (?, ?, ?, ?)
      `).run(id, name, email, hashedPassword);

      const token = jwt.sign({ id, email, name, subscription_tier: 'free' }, JWT_SECRET, { expiresIn: '30d' });
      res.json({ token, user: { id, name, email, subscription_tier: 'free' } });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    try {
      const user: any = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
      if (!user) return res.status(400).json({ error: "Invalid credentials" });

      const validPassword = await bcrypt.compare(password, user.password_hash);
      if (!validPassword) return res.status(400).json({ error: "Invalid credentials" });

      db.prepare("UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?").run(user.id);

      const token = jwt.sign({ id: user.id, email: user.email, name: user.name, subscription_tier: user.subscription_tier }, JWT_SECRET, { expiresIn: '30d' });
      res.json({ token, user: { id: user.id, name: user.name, email: user.email, subscription_tier: user.subscription_tier } });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/auth/me", authenticateToken, (req: any, res) => {
    try {
      const user: any = db.prepare("SELECT id, name, email, subscription_tier FROM users WHERE id = ?").get(req.user.id);
      res.json({ user });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // API Endpoints
  app.post("/api/ats/analyze", authenticateToken, (req: any, res) => {
    const { 
      id, resume_text, job_description, score_before, score_after, match_level, 
      recommendations, resume_health, interview_prob_before, interview_prob_after,
      formatting_score, quantified_achievements_score, grammar_tone_score,
      salary_readiness_score, salary_band_estimate, career_gap_risk,
      culture_fit_score, multi_role_conflict,
      // Rich scan details:
      add_lines, remove_lines, rewrite_lines, missing_skills, missing_keywords,
      hard_skills, soft_skills, keyword_decay, hiring_manager_profile, impact_prediction
    } = req.body;
    const userId = req.user.id;
    
    try {
      const insertAssessment = db.prepare(`
        INSERT INTO ats_assessments (
          id, user_id, resume_text, job_description, ats_score_before, ats_score_after, 
          match_level, resume_health, interview_prob_before, interview_prob_after,
          formatting_score, quantified_achievements_score, grammar_tone_score,
          salary_readiness_score, salary_band_estimate, career_gap_risk,
          culture_fit_score, multi_role_conflict,
          add_lines, remove_lines, rewrite_lines, missing_skills, missing_keywords,
          hard_skills, soft_skills, keyword_decay, hiring_manager_profile, impact_prediction
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      insertAssessment.run(
        id, userId, resume_text, job_description, score_before, score_after, 
        match_level, resume_health || 0, interview_prob_before || 0, interview_prob_after || 0,
        formatting_score || 0, quantified_achievements_score || 0, grammar_tone_score || 0,
        salary_readiness_score || 0, salary_band_estimate || '', career_gap_risk || '',
        culture_fit_score || 0, multi_role_conflict || '',
        JSON.stringify(add_lines || []),
        JSON.stringify(remove_lines || []),
        JSON.stringify(rewrite_lines || []),
        JSON.stringify(missing_skills || []),
        JSON.stringify(missing_keywords || []),
        JSON.stringify(hard_skills || []),
        JSON.stringify(soft_skills || []),
        JSON.stringify(keyword_decay || []),
        JSON.stringify(hiring_manager_profile || []),
        JSON.stringify(impact_prediction || null)
      );

      const insertRecommendation = db.prepare(`
        INSERT INTO ats_recommendations (id, assessment_id, type, content, impact_score)
        VALUES (?, ?, ?, ?, ?)
      `);

      for (const rec of recommendations) {
        insertRecommendation.run(rec.id, id, rec.type, rec.content, rec.impact_score || 0);
      }

      res.json({ status: "success", id });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/ats/history", authenticateToken, (req: any, res) => {
    try {
      const history = db.prepare("SELECT * FROM ats_assessments WHERE user_id = ? ORDER BY created_at DESC").all(req.user.id);
      const parsedHistory = history.map((item: any) => {
        return {
          ...item,
          add_lines: item.add_lines ? JSON.parse(item.add_lines) : [],
          remove_lines: item.remove_lines ? JSON.parse(item.remove_lines) : [],
          rewrite_lines: item.rewrite_lines ? JSON.parse(item.rewrite_lines) : [],
          missing_skills: item.missing_skills ? JSON.parse(item.missing_skills) : [],
          missing_keywords: item.missing_keywords ? JSON.parse(item.missing_keywords) : [],
          hard_skills: item.hard_skills ? JSON.parse(item.hard_skills) : [],
          soft_skills: item.soft_skills ? JSON.parse(item.soft_skills) : [],
          keyword_decay: item.keyword_decay ? JSON.parse(item.keyword_decay) : [],
          hiring_manager_profile: item.hiring_manager_profile ? JSON.parse(item.hiring_manager_profile) : [],
          impact_prediction: item.impact_prediction ? JSON.parse(item.impact_prediction) : null
        };
      });
      res.json(parsedHistory);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/resume/version", authenticateToken, (req: any, res) => {
    const { resume_json, ats_score } = req.body;
    const id = crypto.randomUUID();
    try {
      db.prepare(`
        INSERT INTO resume_versions (id, user_id, resume_json, ats_score)
        VALUES (?, ?, ?, ?)
      `).run(id, req.user.id, JSON.stringify(resume_json), ats_score);
      res.json({ success: true, id });
    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/risk/save", authenticateToken, (req: any, res) => {
    const { id, industry, role, skills, experience, companyStatus, totalScore, level } = req.body;
    try {
      db.prepare(`
        INSERT INTO risk_assessments (id, user_id, industry, role, skills, experience, company_status, total_score, level)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, req.user.id, industry, role, JSON.stringify(skills || []), experience, companyStatus, totalScore, level);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/auth/upgrade", authenticateToken, (req: any, res) => {
    const { tier } = req.body;
    if (!['free', 'pro', 'career_pro'].includes(tier)) {
      return res.status(400).json({ error: "Invalid subscription tier" });
    }
    try {
      db.prepare("UPDATE users SET subscription_tier = ? WHERE id = ?").run(tier, req.user.id);
      
      const user: any = db.prepare("SELECT id, name, email, subscription_tier FROM users WHERE id = ?").get(req.user.id);
      const token = jwt.sign({ id: user.id, email: user.email, name: user.name, subscription_tier: user.subscription_tier }, JWT_SECRET, { expiresIn: '30d' });
      
      res.json({ success: true, token, user });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/dashboard", authenticateToken, (req: any, res) => {
    try {
      const latestAssessment: any = db.prepare("SELECT * FROM ats_assessments WHERE user_id = ? ORDER BY created_at DESC LIMIT 1").get(req.user.id);
      const latestRisk: any = db.prepare("SELECT * FROM risk_assessments WHERE user_id = ? ORDER BY created_at DESC LIMIT 1").get(req.user.id);
      
      let role = "Backend Engineer";
      let topSkill = "Kubernetes";
      let skillsList: string[] = ["Kubernetes", "Docker", "Go", "Python", "Cloud"];

      if (latestRisk) {
        role = latestRisk.role;
        try {
          const parsedSkills = JSON.parse(latestRisk.skills);
          if (parsedSkills && parsedSkills.length > 0) {
            skillsList = parsedSkills;
            topSkill = parsedSkills[0];
          }
        } catch (e) {}
      } else {
        const latestResume: any = db.prepare("SELECT * FROM resume_versions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1").get(req.user.id);
        if (latestResume) {
          try {
            const resumeJson = JSON.parse(latestResume.resume_json);
            if (resumeJson.personal?.jobTitle) {
              role = resumeJson.personal.jobTitle;
            } else if (resumeJson.work?.[0]?.title) {
              role = resumeJson.work[0].title;
            }
            if (resumeJson.skills && resumeJson.skills.length > 0) {
              skillsList = resumeJson.skills;
              topSkill = resumeJson.skills[0];
            }
          } catch (e) {}
        }
      }

      const roleHash = Math.abs(role.split("").reduce((acc, char) => (acc << 5) - acc + char.charCodeAt(0), 0));
      const demandChangeNum = (roleHash % 15) - 3; // range from -3% to +11%
      const demandChange = (demandChangeNum >= 0 ? "+" : "") + demandChangeNum + "%";

      const trends = skillsList.slice(1, 4).map(skill => {
        const skillHash = Math.abs(skill.split("").reduce((acc, char) => (acc << 5) - acc + char.charCodeAt(0), 0));
        const change = (skillHash % 16) - 5; // -5% to +10%
        return {
          name: skill,
          change: (change >= 0 ? "+" : "") + change + "%"
        };
      });

      let percentile = 31;
      if (latestAssessment) {
        const baseScore = latestAssessment.ats_score_after || 50;
        percentile = Math.max(1, Math.min(95, Math.round(100 - baseScore)));
      } else if (latestRisk) {
        percentile = Math.max(1, Math.min(95, Math.round(latestRisk.total_score)));
      }

      res.json({
        latestAssessment: latestAssessment || null,
        latestRisk: latestRisk || null,
        weeklyTrends: {
          role,
          demandChange,
          topSkill,
          skillTrend: (roleHash % 2 === 0) ? "upward" : "stable",
          relatedTrends: trends.length > 0 ? trends : [
            { name: "Docker", change: "-3%" },
            { name: "Git", change: "+4%" }
          ]
        },
        benchmarking: {
          percentile,
          group: `${role}s`
        }
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/linkedin/upload", authenticateToken, (req: any, res) => {
    const { fileBase64, fileName, source } = req.body;
    const importId = crypto.randomUUID();
    
    try {
      db.prepare(`
        INSERT INTO linkedin_imports (id, user_id, file_path, file_name, file_size, status, source)
        VALUES (?, ?, ?, ?, ?, 'queued', ?)
      `).run(importId, req.user.id, 'base64', fileName, fileBase64.length, source || 'pdf');

      res.json({ success: true, importId });

      // Run async processing
      setTimeout(async () => {
        try {
          // Update status to extracting
          db.prepare("UPDATE linkedin_imports SET status = 'extracting', progress = 25 WHERE id = ?").run(importId);
          
          // Import dynamic module since we created a new file for the AI logic
          const { extractLinkedInProfile, generateLinkedInAudit } = await import('./src/lib/gemini_linkedin.js');
          
          // 1. Extract Profile
          const isPdf = source !== 'paste';
          const profileData = await extractLinkedInProfile(fileBase64, isPdf);
          
          const profileId = crypto.randomUUID();
          db.prepare(`
            INSERT INTO linkedin_profiles (
              id, user_id, import_id, headline, about, location, current_title, current_company,
              experiences, education, skills, certifications, projects, raw_text, source
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            profileId, req.user.id, importId, profileData.headline, profileData.about, profileData.location,
            profileData.current_title, profileData.current_company,
            JSON.stringify(profileData.experiences || []), JSON.stringify(profileData.education || []),
            JSON.stringify(profileData.skills || []), JSON.stringify(profileData.certifications || []),
            JSON.stringify(profileData.projects || []),
            isPdf ? 'Extracted from PDF' : fileBase64,
            isPdf ? 'pdf' : 'paste'
          );

          // Update status to analyzing
          db.prepare("UPDATE linkedin_imports SET status = 'analyzing', progress = 60 WHERE id = ?").run(importId);

          // 2. Audit Profile
          const auditData = await generateLinkedInAudit(profileData);
          const auditId = crypto.randomUUID();
          db.prepare(`
            INSERT INTO linkedin_audits (
              id, user_id, import_id, profile_id, total_score, headline_score, about_score,
              experience_score, skills_score, keywords_score, completeness_score,
              strengths, weaknesses, recommendations, rewrites
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            auditId, req.user.id, importId, profileId, auditData.total_score, auditData.headline_score,
            auditData.about_score, auditData.experience_score, auditData.skills_score,
            auditData.keywords_score, auditData.completeness_score,
            JSON.stringify(auditData.strengths || []), JSON.stringify(auditData.weaknesses || []),
            JSON.stringify(auditData.recommendations || []), JSON.stringify(auditData.rewrites || [])
          );

          // Update status to completed
          db.prepare("UPDATE linkedin_imports SET status = 'completed', progress = 100 WHERE id = ?").run(importId);

        } catch (error: any) {
          console.error('LinkedIn Processing Error:', error);
          db.prepare("UPDATE linkedin_imports SET status = 'failed', error_message = ? WHERE id = ?")
            .run(error.message || 'Unknown error', importId);
        }
      }, 0);

    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/linkedin/import/:id/status", authenticateToken, (req: any, res) => {
    try {
      const importRecord = db.prepare("SELECT * FROM linkedin_imports WHERE id = ? AND user_id = ?").get(req.params.id, req.user.id);
      if (!importRecord) return res.status(404).json({ error: "Not found" });
      res.json(importRecord);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/linkedin/profile", authenticateToken, (req: any, res) => {
    try {
      const profile = db.prepare("SELECT * FROM linkedin_profiles WHERE user_id = ? ORDER BY created_at DESC LIMIT 1").get(req.user.id);
      if (!profile) return res.json(null);
      
      // Parse JSON arrays
      ['experiences', 'education', 'skills', 'certifications', 'projects'].forEach(key => {
        if (profile[key]) profile[key] = JSON.parse(profile[key]);
      });
      res.json(profile);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/linkedin/audit", authenticateToken, (req: any, res) => {
    try {
      const audit = db.prepare("SELECT * FROM linkedin_audits WHERE user_id = ? ORDER BY created_at DESC LIMIT 1").get(req.user.id);
      if (!audit) return res.json(null);
      
      // Parse JSON arrays
      ['strengths', 'weaknesses', 'recommendations', 'rewrites'].forEach(key => {
        if (audit[key]) audit[key] = JSON.parse(audit[key]);
      });
      res.json(audit);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.delete("/api/linkedin/profile", authenticateToken, (req: any, res) => {
    try {
      // Simple cascade delete manually since we didn't use ON DELETE CASCADE
      db.prepare("DELETE FROM linkedin_audits WHERE user_id = ?").run(req.user.id);
      db.prepare("DELETE FROM linkedin_profiles WHERE user_id = ?").run(req.user.id);
      db.prepare("DELETE FROM linkedin_imports WHERE user_id = ?").run(req.user.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
