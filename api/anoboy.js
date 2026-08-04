const AnoboyScraper = require('../scraper/anoboy'); // Sesuaikan path scraper lu
const scraper = new AnoboyScraper();

module.exports = [
  // ============================================
  // 1. HOME - Beranda Anoboy
  // ============================================
  {
    name: "Anoboy Home",
    description: "Get latest anime list from homepage",
    category: "Anoboy Scraper",
    path: "/api/anoboy/home",
    method: "GET",
    parameters: {
      apikey: { type: "string", required: true, example: "123" },
      page: { type: "number", required: false, example: 1 }
    },
    async run(req, res) {
      try {
        const { apikey, page = 1 } = req.query;
        if (!global.apikey.includes(apikey)) {
          return res.status(403).json({ error: "API Key invalid! Bego!" });
        }
        const result = await scraper.home(parseInt(page));
        res.json({ status: true, ...result });
      } catch (err) {
        res.status(500).json({ status: false, error: err.message });
      }
    }
  },

  // ============================================
  // 2. TERBARU - Anime Terbaru
  // ============================================
  {
    name: "Anoboy Terbaru",
    description: "Get latest updated anime",
    category: "Anoboy Scraper",
    path: "/api/anoboy/terbaru",
    method: "GET",
    parameters: {
      apikey: { type: "string", required: true, example: "123" },
      page: { type: "number", required: false, example: 1 }
    },
    async run(req, res) {
      try {
        const { apikey, page = 1 } = req.query;
        if (!global.apikey.includes(apikey)) {
          return res.status(403).json({ error: "API Key invalid!" });
        }
        const result = await scraper.terbaru(parseInt(page));
        res.json({ status: true, ...result });
      } catch (err) {
        res.status(500).json({ status: false, error: err.message });
      }
    }
  },

  // ============================================
  // 3. ONGOING - Anime Ongoing
  // ============================================
  {
    name: "Anoboy Ongoing",
    description: "Get currently airing anime list",
    category: "Anoboy Scraper",
    path: "/api/anoboy/ongoing",
    method: "GET",
    parameters: {
      apikey: { type: "string", required: true, example: "123" },
      page: { type: "number", required: false, example: 1 }
    },
    async run(req, res) {
      try {
        const { apikey, page = 1 } = req.query;
        if (!global.apikey.includes(apikey)) {
          return res.status(403).json({ error: "API Key invalid!" });
        }
        const result = await scraper.ongoing(parseInt(page));
        res.json({ status: true, ...result });
      } catch (err) {
        res.status(500).json({ status: false, error: err.message });
      }
    }
  },

  // ============================================
  // 4. COMPLETE - Anime Complete
  // ============================================
  {
    name: "Anoboy Complete",
    description: "Get completed anime list",
    category: "Anoboy Scraper",
    path: "/api/anoboy/complete",
    method: "GET",
    parameters: {
      apikey: { type: "string", required: true, example: "123" },
      page: { type: "number", required: false, example: 1 }
    },
    async run(req, res) {
      try {
        const { apikey, page = 1 } = req.query;
        if (!global.apikey.includes(apikey)) {
          return res.status(403).json({ error: "API Key invalid!" });
        }
        const result = await scraper.complete(parseInt(page));
        res.json({ status: true, ...result });
      } catch (err) {
        res.status(500).json({ status: false, error: err.message });
      }
    }
  },

  // ============================================
  // 5. EPISODES - Daftar Episode
  // ============================================
  {
    name: "Anoboy Episodes",
    description: "Get episode list",
    category: "Anoboy Scraper",
    path: "/api/anoboy/episodes",
    method: "GET",
    parameters: {
      apikey: { type: "string", required: true, example: "123" },
      page: { type: "number", required: false, example: 1 }
    },
    async run(req, res) {
      try {
        const { apikey, page = 1 } = req.query;
        if (!global.apikey.includes(apikey)) {
          return res.status(403).json({ error: "API Key invalid!" });
        }
        const result = await scraper.episodes(parseInt(page));
        res.json({ status: true, ...result });
      } catch (err) {
        res.status(500).json({ status: false, error: err.message });
      }
    }
  },

  // ============================================
  // 6. JADWAL RILIS - Schedule
  // ============================================
  {
    name: "Anoboy Jadwal Rilis",
    description: "Get anime release schedule by day",
    category: "Anoboy Scraper",
    path: "/api/anoboy/jadwal",
    method: "GET",
    parameters: {
      apikey: { type: "string", required: true, example: "123" }
    },
    async run(req, res) {
      try {
        const { apikey } = req.query;
        if (!global.apikey.includes(apikey)) {
          return res.status(403).json({ error: "API Key invalid!" });
        }
        const result = await scraper.jadwalRilis();
        res.json({ status: true, ...result });
      } catch (err) {
        res.status(500).json({ status: false, error: err.message });
      }
    }
  },

  // ============================================
  // 7. SEARCH - Cari Anime
  // ============================================
  {
    name: "Anoboy Search",
    description: "Search anime by title",
    category: "Anoboy Scraper",
    path: "/api/anoboy/search",
    method: "GET",
    parameters: {
      apikey: { type: "string", required: true, example: "123" },
      q: { type: "string", required: true, example: "haibara-kun" },
      page: { type: "number", required: false, example: 1 }
    },
    async run(req, res) {
      try {
        const { apikey, q, page = 1 } = req.query;
        if (!global.apikey.includes(apikey)) {
          return res.status(403).json({ error: "API Key invalid!" });
        }
        if (!q) {
          return res.status(400).json({ status: false, error: "Query parameter 'q' required!" });
        }
        const result = await scraper.search(q, parseInt(page));
        res.json({ status: true, ...result });
      } catch (err) {
        res.status(500).json({ status: false, error: err.message });
      }
    }
  },

  // ============================================
  // 8. DETAIL - Detail Anime
  // ============================================
  {
    name: "Anoboy Detail",
    description: "Get anime detail by slug",
    category: "Anoboy Scraper",
    path: "/api/anoboy/detail",
    method: "GET",
    parameters: {
      apikey: { type: "string", required: true, example: "123" },
      slug: { type: "string", required: true, example: "2026-04-haibara-kun-no-tsuyokute-seishun-new-game" }
    },
    async run(req, res) {
      try {
        const { apikey, slug } = req.query;
        if (!global.apikey.includes(apikey)) {
          return res.status(403).json({ error: "API Key invalid!" });
        }
        if (!slug) {
          return res.status(400).json({ status: false, error: "Slug parameter required!" });
        }
        const result = await scraper.detail(slug);
        res.json({ status: true, ...result });
      } catch (err) {
        res.status(500).json({ status: false, error: err.message });
      }
    }
  },

  // ============================================
  // 9. EPISODE - Detail Episode + Streaming
  // ============================================
  {
    name: "Anoboy Episode",
    description: "Get episode detail with streaming links",
    category: "Anoboy Scraper",
    path: "/api/anoboy/episode",
    method: "GET",
    parameters: {
      apikey: { type: "string", required: true, example: "123" },
      slug: { type: "string", required: true, example: "2026-04-haibara-kun-no-tsuyokute-seishun-new-game" },
      episode: { type: "number", required: true, example: 1 }
    },
    async run(req, res) {
      try {
        const { apikey, slug, episode } = req.query;
        if (!global.apikey.includes(apikey)) {
          return res.status(403).json({ error: "API Key invalid!" });
        }
        if (!slug || !episode) {
          return res.status(400).json({ status: false, error: "Slug and episode parameters required!" });
        }
        const result = await scraper.episode(slug, parseInt(episode));
        res.json({ status: true, ...result });
      } catch (err) {
        res.status(500).json({ status: false, error: err.message });
      }
    }
  },

  // ============================================
  // 10. ALL - Semua Data Sekaligus
  // ============================================
  {
    name: "Anoboy All",
    description: "Get all data at once (heavy request!)",
    category: "Anoboy Scraper",
    path: "/api/anoboy/all",
    method: "GET",
    parameters: {
      apikey: { type: "string", required: true, example: "123" }
    },
    async run(req, res) {
      try {
        const { apikey } = req.query;
        if (!global.apikey.includes(apikey)) {
          return res.status(403).json({ error: "API Key invalid!" });
        }
        const result = await scraper.all();
        res.json({ status: true, ...result });
      } catch (err) {
        res.status(500).json({ status: false, error: err.message });
      }
    }
  }
];
