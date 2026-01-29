(function() {
  function drawQuarterStrips() {
    var postsDataEl = document.getElementById('posts-data');
    var tagUrlsEl = document.getElementById('tag-urls');
    var container = document.getElementById('quarter-strips');

    if (!postsDataEl || !tagUrlsEl || !container) {
      return;
    }

    var posts = JSON.parse(postsDataEl.textContent);
    var tagUrls = JSON.parse(tagUrlsEl.textContent);

    // Group posts by quarter
    var quarterData = {};
    posts.forEach(function(post) {
      var key = post.year + '-Q' + post.quarter;
      if (!quarterData[key]) {
        quarterData[key] = { tags: {}, postCount: 0 };
      }
      quarterData[key].postCount++;
      post.tags.forEach(function(tag) {
        if (!quarterData[key].tags[tag]) {
          quarterData[key].tags[tag] = 0;
        }
        quarterData[key].tags[tag]++;
      });
    });

    // Sort quarters (newest first)
    var sortedQuarters = Object.keys(quarterData).sort().reverse();

    var colors = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#3b82f6', '#14b8a6', '#ef4444', '#84cc16'];

    var html = '';
    sortedQuarters.forEach(function(quarter) {
      var data = quarterData[quarter];
      // Sort tags by count in this quarter
      var sortedTags = Object.entries(data.tags)
        .sort(function(a, b) { return b[1] - a[1]; })
        .slice(0, 8); // Top 8 tags per quarter

      var parts = quarter.split('-');
      var year = parts[0];
      var q = parts[1];

      var tagsHtml = sortedTags.map(function(item, i) {
        var tag = item[0];
        var count = item[1];
        return '<a href="' + (tagUrls[tag] || '#') + '" class="quarter-tag" style="--tag-color: ' + colors[i % colors.length] + '">' +
          '<span class="tag-dot"></span>' +
          '<span class="tag-text">' + tag + '</span>' +
          '<span class="tag-num">' + count + '</span>' +
          '</a>';
      }).join('');

      html += '<div class="quarter-strip">' +
        '<div class="quarter-header">' +
        '<span class="quarter-label">' + year + ' ' + q + '</span>' +
        '<span class="quarter-count">' + data.postCount + ' posts</span>' +
        '</div>' +
        '<div class="quarter-tags">' + tagsHtml + '</div>' +
        '</div>';
    });

    container.innerHTML = html;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', drawQuarterStrips);
  } else {
    drawQuarterStrips();
  }
})();
