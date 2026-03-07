const fs = require('fs');
const https = require('https');

async function processScreens() {
    const rawData = fs.readFileSync('/Users/kent/.gemini/antigravity/brain/86b98348-c93d-4a6d-a69a-43b83db31cad/.system_generated/steps/31/output.txt', 'utf8');
    const data = JSON.parse(rawData);

    console.log(`Found ${data.screens.length} screens`);

    // Create a simplified index
    const index = data.screens.map((screen, i) => {
        return {
            id: screen.name.split('/').pop(),
            originalTitle: screen.title,
            width: screen.width,
            height: screen.height,
            screenshotUrl: screen.screenshot?.downloadUrl,
            htmlUrl: screen.htmlCode?.downloadUrl,
            index: i
        };
    });

    fs.writeFileSync('./stitch_screens/index.json', JSON.stringify(index, null, 2));
    console.log('Successfully created index.json');
}

processScreens().catch(console.error);
