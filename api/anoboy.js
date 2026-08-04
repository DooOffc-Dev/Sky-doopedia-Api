const cheerio = require('cheerio');

// ============================================
// KONFIGURASI SCRAPER
// ============================================
const BASE_URL = 'https://dracinema.com';
const API_KEY = 'xb3MdwdLrZrpaDXvrLLwfP==';

const DEFAULT_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (Chrome/120.0.0.0) Safari/537.36',
  'Referer': 'https://dracinema.com/',
  'X-API-Key': API_KEY,
  'Accept': 'application/json, text/plain, */*'
};

const HTML_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (Chrome/120.0.0.0) Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5'
};

let genreSlugToNameMap = {};

// ============================================
// FUNGSI HELPER SCRAPER
// ============================================
function slugify(text) {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

function cleanTitle(title) {
  if (!title) return '';
  return title
    .replace(/\s+Full\s+Episode\s+Subtitle\s+Indonesia\s+-\s+Dracinema/gi, '')
    .replace(/\s+Sub\s+Indo\s+-\s+Dracinema/gi, '')
    .replace(/\s+-\s+Dracinema/gi, '')
    .trim();
}

function parseMovieSlug(moviePath) {
  const cleanPath = moviePath.replace('/movie/', '').replace('/', '');
  const lastHyphen = cleanPath.lastIndexOf('-');
  if (lastHyphen !== -1) {
    return {
      slug: cleanPath.substring(0, lastHyphen),
      id: cleanPath.substring(lastHyphen + 1)
    };
  }
  return { slug: cleanPath, id: '' };
}

async function fetchPage(url, headers = HTML_HEADERS) {
  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}. Status code: ${res.status}`);
  }
  return await res.text();
}

async function fetchApi(url) {
  const res = await fetch(url, { headers: DEFAULT_HEADERS });
  if (!res.ok) {
    throw new Error(`API error ${url}. Status code: ${res.status}`);
  }
  return await res.json();
}

// ============================================
// FUNGSI SCRAPER
// ============================================
async function getHome() {
  const html = await fetchPage(BASE_URL);
  const $ = cheerio.load(html);
  
  const dramas = [];
  const genres = [];
  
  $('a[href^="/movie/"]').each((i, el) => {
    const href = $(el).attr('href');
    const img = $(el).find('img');
    const title = cleanTitle(img.attr('alt') || '');
    const cover = img.attr('src') || img.attr('data-src') || '';
    const { slug, id } = parseMovieSlug(href);
    if (id && !dramas.some(d => d.id === id)) {
      dramas.push({ title, cover, url: href, slug, id });
    }
  });

  $('a[href^="/genre/"]').each((i, el) => {
    const name = $(el).text().trim();
    const href = $(el).attr('href');
    const slug = href.replace('/genre/', '');
    if (slug && !genres.some(g => g.slug === slug)) {
      genres.push({ name, slug, url: href });
      genreSlugToNameMap[slug] = name;
    }
  });

  return { dramas, genres };
}

async function getCollections() {
  const url = `${BASE_URL}/collections`;
  const html = await fetchPage(url);
  const $ = cheerio.load(html);
  
  const genres = [];
  $('a[href^="/genre/"]').each((i, el) => {
    const name = $(el).text().trim();
    const href = $(el).attr('href');
    const slug = href.replace('/genre/', '');
    if (slug && !genres.some(g => g.slug === slug)) {
      genres.push({ name, slug, url: href });
      genreSlugToNameMap[slug] = name;
    }
  });
  
  return genres;
}

async function getAllMovies(page = 1) {
  const url = `${BASE_URL}/api/movie?page=${page}`;
  const data = await fetchApi(url);
  
  return data.map(item => {
    const originalName = item.bookName || '';
    const slug = item.replacedBookName || slugify(originalName);
    const id = item.originalBookId || item.bookId || '';
    return {
      id,
      name: originalName,
      cover: item.cover || '',
      introduction: item.introduction || '',
      genres: item.typeTwoNames || [],
      episodesCount: item.chapterCount || 0,
      url: `/movie/${slug}-${id}`,
      slug
    };
  });
}

async function getGenreMovies(genreSlug, page = 1) {
  if (Object.keys(genreSlugToNameMap).length === 0) {
    await getCollections().catch(() => {});
  }
  
  let genreName = genreSlugToNameMap[genreSlug];
  if (!genreName) {
    genreName = genreSlug
      .split('-')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }
  
  const url = `${BASE_URL}/api/movie?page=${page}&categories=${encodeURIComponent(genreName)}`;
  const data = await fetchApi(url);
  
  return data.map(item => {
    const originalName = item.bookName || '';
    const slug = item.replacedBookName || slugify(originalName);
    const id = item.originalBookId || item.bookId || '';
    return {
      id,
      name: originalName,
      cover: item.cover || '',
      introduction: item.introduction || '',
      genres: item.typeTwoNames || [],
      episodesCount: item.chapterCount || 0,
      url: `/movie/${slug}-${id}`,
      slug
    };
  });
}

async function searchMovies(keyword) {
  const url = `${BASE_URL}/api/search?keyword=${encodeURIComponent(keyword)}`;
  const response = await fetchApi(url);
  const data = response.data || [];
  
  return data.map(item => {
    const originalName = item.bookName || '';
    const slug = slugify(originalName);
    const id = item.originalBookId || item.id || '';
    return {
      id,
      name: originalName,
      cover: item.cover || '',
      introduction: item.introduction || '',
      episodesCount: item.chapterCount || 0,
      url: `/movie/${slug}-${id}`,
      slug
    };
  });
}

async function getMovieDetails(movieSlugOrPath) {
  const cleanPath = movieSlugOrPath.startsWith('/movie/') ? movieSlugOrPath : `/movie/${movieSlugOrPath}`;
  const url = `${BASE_URL}${cleanPath}`;
  const html = await fetchPage(url);
  const $ = cheerio.load(html);
  
  const title = cleanTitle($('h1').filter((i, el) => $(el).text().trim() !== 'Dracinema').first().text().trim());
  
  let synopsis = $('p[itemprop="description"]').text().trim();
  if (!synopsis) {
    const sinopsisHeading = $('h2').filter((i, el) => $(el).text().trim() === 'Sinopsis');
    if (sinopsisHeading.length) {
      let sibling = sinopsisHeading.next();
      while (sibling.length && sibling[0].name !== 'h2') {
        const text = sibling.text().trim();
        if (text && text.length > synopsis.length) {
          synopsis = text;
        }
        sibling = sibling.next();
      }
    }
  }
  
  const genres = [];
  $('a[href^="/genre/"]').each((i, el) => {
    const name = $(el).text().trim();
    const href = $(el).attr('href');
    const slug = href.replace('/genre/', '');
    if (slug && !genres.some(g => g.slug === slug)) {
      genres.push({ name, slug, url: href });
    }
  });
  
  const recommendations = [];
  $('h2').each((i, el) => {
    const headingText = $(el).text().trim();
    const exclude = ['Sinopsis', 'Daftar Episode', 'Pertanyaan Umum'];
    if (exclude.some(ex => headingText.includes(ex))) {
      return;
    }
    
    const row = {
      sectionTitle: headingText,
      movies: []
    };
    
    const parent = $(el).parent();
    parent.find('a[href^="/movie/"]').each((j, linkEl) => {
      const href = $(linkEl).attr('href');
      const img = $(linkEl).find('img');
      const movieTitle = cleanTitle(img.attr('alt') || '');
      const cover = img.attr('src') || img.attr('data-src') || '';
      const { slug, id } = parseMovieSlug(href);
      if (!row.movies.some(m => m.id === id)) {
        row.movies.push({
          title: movieTitle,
          cover,
          url: href,
          slug,
          id
        });
      }
    });
    
    if (row.movies.length > 0) {
      recommendations.push(row);
    }
  });
  
  const episodes = [];
  $('a[href*="/play/"]').each((i, el) => {
    const href = $(el).attr('href');
    const text = $(el).text().trim();
    const parts = href.split('/');
    const epsNumStr = parts[parts.length - 1];
    const epsNum = parseInt(epsNumStr, 10);
    
    if (!isNaN(epsNum)) {
      episodes.push({
        title: `Episode ${epsNum}`,
        url: href,
        number: epsNum
      });
    } else {
      episodes.push({
        title: text || 'Putar Sekarang',
        url: href,
        number: 1
      });
    }
  });
  
  episodes.sort((a, b) => a.number - b.number);
  const uniqueEpisodes = [];
  const seenEps = new Set();
  for (const ep of episodes) {
    if (!seenEps.has(ep.number)) {
      seenEps.add(ep.number);
      uniqueEpisodes.push(ep);
    }
  }

  const { slug, id } = parseMovieSlug(cleanPath);

  return {
    title,
    slug,
    id,
    synopsis,
    genres,
    episodes: uniqueEpisodes,
    recommendations
  };
}

async function getEpisodeStreaming(playPathOrUrl) {
  const cleanPath = playPathOrUrl.startsWith('/play/') ? playPathOrUrl : `/play/${playPathOrUrl}`;
  const url = `${BASE_URL}${cleanPath}`;
  const html = await fetchPage(url);
  
  const regex = /self\.__next_f\.push\(\[\d+,\s*"(.*?)"\]\)/g;
  let match;
  let mergedText = "";
  
  while ((match = regex.exec(html)) !== null) {
    let chunk = match[1];
    chunk = chunk
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, '\\')
      .replace(/\\\//g, '/');
    mergedText += chunk;
  }
  
  let videoUrls = [];
  const videoUrlsRegex = /"videoUrls"\s*:\s*(\[.*?\])/;
  const videoMatch = mergedText.match(videoUrlsRegex);
  
  if (videoMatch) {
    try {
      videoUrls = JSON.parse(videoMatch[1]);
    } catch (err) {
      const urlRegex = /"url"\s*:\s*"([^"]+)"/g;
      let urlMatch;
      while ((urlMatch = urlRegex.exec(videoMatch[1])) !== null) {
        let streamUrl = urlMatch[1].replace(/\\u([0-9a-fA-F]{4})/g, (g, m) => String.fromCharCode(parseInt(m, 16)));
        videoUrls.push({
          quality: 720,
          url: streamUrl,
          cdn: null
        });
      }
    }
  } else {
    const directUrlRegex = /https?:\/\/[^\s"']+\.(?:m3u8|mp4)[^\s"']*/g;
    const directMatches = html.match(directUrlRegex) || [];
    videoUrls = [...new Set(directMatches)].map(u => ({
      quality: 720,
      url: u,
      cdn: null
    }));
  }

  const $ = cheerio.load(html);
  const navigationEpisodes = [];
  $('a[href*="/play/"]').each((i, el) => {
    const href = $(el).attr('href');
    const text = $(el).text().trim();
    const parts = href.split('/');
    const epsNum = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(epsNum)) {
      if (!navigationEpisodes.some(ep => ep.number === epsNum)) {
        navigationEpisodes.push({
          title: `Episode ${epsNum}`,
          url: href,
          number: epsNum
        });
      }
    }
  });
  navigationEpisodes.sort((a, b) => a.number - b.number);

  const title = cleanTitle($('title').text().trim());

  return {
    title,
    videoSources: videoUrls,
    availableEpisodes: navigationEpisodes
  };
}

// ============================================
// ENDPOINT API
// ============================================
const CREATOR = 't.me/@Xsky_doopedia';

module.exports = [
  {
    name: "Dracinema Home",
    description: "Get homepage data (popular dramas & genres)",
    category: "Dracinema Scraper",
    path: "/api/dracinema/home",
    method: "GET",
    parameters: {
      apikey: { type: "string", required: true, example: "123" }
    },
    async run(req, res) {
      try {
        const { apikey } = req.query;
        if (!global.apikey.includes(apikey)) {
          return res.status(403).json({ 
            status: false, 
            error: "API Key invalid! Bego!",
            creator: CREATOR 
          });
        }
        const result = await getHome();
        res.json({ status: true, data: result, creator: CREATOR });
      } catch (err) {
        res.status(500).json({ status: false, error: err.message, creator: CREATOR });
      }
    }
  },
  {
    name: "Dracinema Collections",
    description: "Get all genre/category lists",
    category: "Dracinema Scraper",
    path: "/api/dracinema/collections",
    method: "GET",
    parameters: {
      apikey: { type: "string", required: true, example: "123" }
    },
    async run(req, res) {
      try {
        const { apikey } = req.query;
        if (!global.apikey.includes(apikey)) {
          return res.status(403).json({ status: false, error: "API Key invalid!", creator: CREATOR });
        }
        const result = await getCollections();
        res.json({ status: true, data: result, creator: CREATOR });
      } catch (err) {
        res.status(500).json({ status: false, error: err.message, creator: CREATOR });
      }
    }
  },
  {
    name: "Dracinema All Movies",
    description: "Get all movies with pagination",
    category: "Dracinema Scraper",
    path: "/api/dracinema/movies",
    method: "GET",
    parameters: {
      apikey: { type: "string", required: true, example: "123" },
      page: { type: "number", required: false, example: 1 }
    },
    async run(req, res) {
      try {
        const { apikey, page = 1 } = req.query;
        if (!global.apikey.includes(apikey)) {
          return res.status(403).json({ status: false, error: "API Key invalid!", creator: CREATOR });
        }
        const result = await getAllMovies(parseInt(page));
        res.json({ status: true, data: result, creator: CREATOR });
      } catch (err) {
        res.status(500).json({ status: false, error: err.message, creator: CREATOR });
      }
    }
  },
  {
    name: "Dracinema Genre Movies",
    description: "Get movies by genre slug (e.g., romantis, action)",
    category: "Dracinema Scraper",
    path: "/api/dracinema/genre",
    method: "GET",
    parameters: {
      apikey: { type: "string", required: true, example: "123" },
      slug: { type: "string", required: true, example: "romantis" },
      page: { type: "number", required: false, example: 1 }
    },
    async run(req, res) {
      try {
        const { apikey, slug, page = 1 } = req.query;
        if (!global.apikey.includes(apikey)) {
          return res.status(403).json({ status: false, error: "API Key invalid!", creator: CREATOR });
        }
        if (!slug) {
          return res.status(400).json({ status: false, error: "Genre slug required!", creator: CREATOR });
        }
        const result = await getGenreMovies(slug, parseInt(page));
        res.json({ status: true, data: result, creator: CREATOR });
      } catch (err) {
        res.status(500).json({ status: false, error: err.message, creator: CREATOR });
      }
    }
  },
  {
    name: "Dracinema Search",
    description: "Search movies by keyword",
    category: "Dracinema Scraper",
    path: "/api/dracinema/search",
    method: "GET",
    parameters: {
      apikey: { type: "string", required: true, example: "123" },
      q: { type: "string", required: true, example: "cinta" }
    },
    async run(req, res) {
      try {
        const { apikey, q } = req.query;
        if (!global.apikey.includes(apikey)) {
          return res.status(403).json({ status: false, error: "API Key invalid!", creator: CREATOR });
        }
        if (!q) {
          return res.status(400).json({ status: false, error: "Search query 'q' required!", creator: CREATOR });
        }
        const result = await searchMovies(q);
        res.json({ status: true, data: result, creator: CREATOR });
      } catch (err) {
        res.status(500).json({ status: false, error: err.message, creator: CREATOR });
      }
    }
  },
  {
    name: "Dracinema Detail",
    description: "Get movie detail with synopsis, genres, episodes, and recommendations",
    category: "Dracinema Scraper",
    path: "/api/dracinema/detail",
    method: "GET",
    parameters: {
      apikey: { type: "string", required: true, example: "123" },
      slug: { type: "string", required: true, example: "mahkota-cahaya-untuk-istri-apollo-ns_2064962492755087362" }
    },
    async run(req, res) {
      try {
        const { apikey, slug } = req.query;
        if (!global.apikey.includes(apikey)) {
          return res.status(403).json({ status: false, error: "API Key invalid!", creator: CREATOR });
        }
        if (!slug) {
          return res.status(400).json({ status: false, error: "Movie slug required!", creator: CREATOR });
        }
        const result = await getMovieDetails(slug);
        res.json({ status: true, data: result, creator: CREATOR });
      } catch (err) {
        res.status(500).json({ status: false, error: err.message, creator: CREATOR });
      }
    }
  },
  {
    name: "Dracinema Play Episode",
    description: "Get streaming video sources and available episodes",
    category: "Dracinema Scraper",
    path: "/api/dracinema/play",
    method: "GET",
    parameters: {
      apikey: { type: "string", required: true, example: "123" },
      path: { type: "string", required: true, example: "/play/mahkota-cahaya-untuk-istri-apollo-ns_2064962492755087362/1" }
    },
    async run(req, res) {
      try {
        const { apikey, path } = req.query;
        if (!global.apikey.includes(apikey)) {
          return res.status(403).json({ status: false, error: "API Key invalid!", creator: CREATOR });
        }
        if (!path) {
          return res.status(400).json({ status: false, error: "Play path required!", creator: CREATOR });
        }
        const result = await getEpisodeStreaming(path);
        res.json({ status: true, data: result, creator: CREATOR });
      } catch (err) {
        res.status(500).json({ status: false, error: err.message, creator: CREATOR });
      }
    }
  }
];
