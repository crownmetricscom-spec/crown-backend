function normalizeTitle(title) {

return title
.toLowerCase()
.replace(/[^\w\s]/g, "")
.replace(/\s+/g, " ")
.trim();

}



function detectDuplicateVideos(videos) {

const titleMap = {};

const duplicateIds = [];

for (const video of videos) {

const normalized =
normalizeTitle(video.title);

if (!titleMap[normalized]) {

titleMap[normalized] = [];

}

titleMap[normalized].push(video.id);

}



for (const key in titleMap) {

if (titleMap[key].length > 1) {

duplicateIds.push(
...titleMap[key]
);

}

}



return duplicateIds;

}



module.exports = {

detectDuplicateVideos

};
