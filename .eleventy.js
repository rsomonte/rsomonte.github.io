module.exports = function (eleventyConfig) {
    // Add a collection for posts sorted by date (newest first)
    eleventyConfig.addCollection("posts", function (collectionApi) {
        return collectionApi.getFilteredByGlob("content/posts/*.md").sort((a, b) => { //this is the path of the posts, if changed web breaks
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

    // This basically lets me use styles.css in my HTML files
    eleventyConfig.addPassthroughCopy("styles.css");
    // This copies the favicon to the output folder
    eleventyConfig.addPassthroughCopy("favicon.ico");
    
    // Enable excerpts
    eleventyConfig.setFrontMatterParsingOptions({
        excerpt: true,
        excerpt_separator: "<!-- excerpt -->",
    });   

    eleventyConfig.addCollection("tools", function(collectionApi) {
        return collectionApi.getFilteredByGlob("content/tools/*");
    });

    return {
        dir: {
            input: "content", // Root directory
            includes: "../_includes", // Includes directory
            output: "docs", // Output directory
        },
        
    };

};