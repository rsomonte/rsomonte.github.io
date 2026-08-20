module.exports = async function (eleventyConfig) {
    // Fetch GitHub guides list at build time (fails build if network or server error occurs)
    const listRes = await fetch("https://github.com/stars/rsomonte/lists/guides", {
        headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" }
    });

    if (!listRes.ok) {
        throw new Error(`Failed to fetch GitHub guides list from https://github.com/stars/rsomonte/lists/guides (HTTP status ${listRes.status})`);
    }

    const listHtml = await listRes.text();
    const matches = [...listHtml.matchAll(/href="\/(rsomonte\/[a-zA-Z0-9_\-]+)"/g)];
    const repoList = Array.from(new Set(matches.map(m => m[1])));

    if (repoList.length === 0) {
        throw new Error("No repositories found in GitHub guides list https://github.com/stars/rsomonte/lists/guides");
    }

    // Fetch raw README.md for each repo and register as an Eleventy Virtual Template
    for (const repo of repoList) {
        let readmeText = null;
        let lastStatus = null;

        for (const branch of ["main", "master"]) {
            const readmeRes = await fetch(`https://raw.githubusercontent.com/${repo}/${branch}/README.md`);
            if (readmeRes.ok) {
                readmeText = await readmeRes.text();
                break;
            }
            lastStatus = readmeRes.status;
        }

        if (!readmeText) {
            throw new Error(`Failed to fetch README.md for repository ${repo} (HTTP status ${lastStatus})`);
        }

        const repoName = repo.split("/")[1];
        const slug = repoName.replace(/_/g, "-");

        // Extract title dynamically: check for H1 heading `# ...` or format repo name
        let title = repoName.replace(/_/g, " ").replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
        const h1Match = readmeText.match(/^#\s+(.+)$/m);
        if (h1Match) {
            title = h1Match[1].trim();
        }

        // Add virtual Markdown template to content/guides/
        // Eleventy processes this natively as a Markdown file with built-in Markdown rendering
        eleventyConfig.addTemplate(`guides/${slug}.md`, readmeText, {
            layout: "guideslayout.liquid",
            tags: ["guide"],
            title: title,
            repo: `https://github.com/${repo}`,
            repo_name: repo
        });
    }

    // Collection for guides
    eleventyConfig.addCollection("guides", function (collectionApi) {
        return collectionApi.getFilteredByTag("guide");
    });

    // Add a collection for posts sorted by date (newest first)
    eleventyConfig.addCollection("posts", function (collectionApi) {
        return collectionApi.getFilteredByGlob("content/posts/*.md").sort((a, b) => {
            return b.date - a.date;
        });
    });

    // Generate collections for all tags
    eleventyConfig.addCollection("tagList", function (collectionApi) {
        let tagSet = new Set();
        collectionApi.getAll().forEach((item) => {
            if ("tags" in item.data) {
                let tags = item.data.tags;
                tags = Array.isArray(tags) ? tags : [tags];
                tags.forEach((tag) => tagSet.add(tag));
            }
        });
        return [...tagSet];
    });

    eleventyConfig.addPassthroughCopy("styles.css");
    eleventyConfig.addPassthroughCopy("favicon.ico");
    eleventyConfig.addPassthroughCopy({
        "content/tools/room.js": "tools/roomcanvas/room.js"
    });
    eleventyConfig.addPassthroughCopy({
        "content/pkg": "pkg"
    });

    eleventyConfig.setFrontMatterParsingOptions({
        excerpt: true,
        excerpt_separator: "<!-- excerpt -->",
    });

    eleventyConfig.addCollection("tools", function (collectionApi) {
        return collectionApi.getFilteredByGlob("content/tools/*");
    });

    return {
        dir: {
            input: "content",
            includes: "../_includes",
            output: "docs",
        },
    };
};