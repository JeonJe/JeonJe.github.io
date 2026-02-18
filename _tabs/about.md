---
title: About
icon: fas fa-info-circle
order: 1
---

<link rel="stylesheet" href="/assets/css/about-timeline.css">

{{ site.data.about.intro }}

---

<div class="about-timeline-section">

<h2>{{ site.data.about.timeline.title }}</h2>

<div class="year-timeline">
{% for year in site.data.about.timeline.years %}
<div class="year-block">
  <div class="year-header">
    <span class="year-number">{{ year.year }}</span>
    <span class="year-theme">{{ year.theme }}</span>
  </div>
  <div class="year-story">{{ year.story }}</div>
  <div class="year-keywords">
    {% for keyword in year.keywords %}
    <span class="keyword">{{ keyword }}</span>
    {% endfor %}
  </div>

  {% if year.post_groups %}
    {% for group in year.post_groups %}
  <div class="post-group">
    <div class="group-label">{{ group.label }}</div>
    <div class="year-posts">
      {% for post in group.posts %}
      <a href="{{ post.href }}" class="year-post">
        <span class="post-title-row">
          <span class="post-month">{{ post.month }}</span>
          <span class="post-title">{{ post.title }}</span>
        </span>
        {% if post.summary %}
        <span class="post-summary">{{ post.summary }}</span>
        {% endif %}
      </a>
      {% endfor %}
    </div>
  </div>
    {% endfor %}
  {% else %}
  <div class="year-posts">
    {% for post in year.posts %}
    <a href="{{ post.href }}" class="year-post">
      <span class="post-title-row">
        <span class="post-month">{{ post.month }}</span>
        <span class="post-title">{{ post.title }}</span>
      </span>
      {% if post.summary %}
      <span class="post-summary">{{ post.summary }}</span>
      {% endif %}
    </a>
    {% endfor %}
  </div>
  {% endif %}
</div>
{% endfor %}
</div>

<h2>{{ site.data.about.writing_style.title }}</h2>
<p class="section-note">{{ site.data.about.writing_style.note }}</p>

<div class="writing-style-section">
<div class="style-cards">
  {% for card in site.data.about.writing_style.cards %}
  <div class="style-card">
    <div class="style-title">{{ card.title }}</div>
    <div class="style-desc">{{ card.description }}</div>
  </div>
  {% endfor %}
</div>
</div>

</div>
