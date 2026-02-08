export default function sitemap() {
    return [
        {
            url: 'https://grayglyph.netlify.app/',
            lastModified: new Date(),
            priority: 1.0,
        },
        {
            url: 'https://grayglyph.netlify.app/editor',
            lastModified: new Date(),
            priority: 0.9,
        },
    ];
}