(function () {
  var NAV = [
    {
      section: "Getting Started",
      items: [
        { href: "index.html", label: "Overview" }
      ]
    },
    {
      section: "Core",
      items: [
        { href: "engine.html",     label: "Engine" },
        { href: "interfaces.html", label: "Interfaces" },
        { href: "scene.html",      label: "Scene" }
      ]
    },
    {
      section: "Systems",
      items: [
        { href: "input.html",    label: "Input" },
        { href: "camera.html",   label: "Camera" },
        { href: "physics.html",  label: "Physics" },
        { href: "animator.html", label: "Animator" }
      ]
    },
    {
      section: "Assets & Audio",
      items: [
        { href: "assets.html", label: "AssetLoader" },
        { href: "audio.html",  label: "AudioManager" },
        { href: "sprite.html", label: "Sprite" }
      ]
    }
  ];

  // Build sidebar nav
  var sidebar = document.getElementById("sidebar");
  if (sidebar) {
    var current = location.pathname.split("/").pop() || "index.html";
    var html = "<nav><ul>";
    for (var i = 0; i < NAV.length; i++) {
      var group = NAV[i];
      html += '<li class="nav-section">' + group.section + "</li>";
      for (var j = 0; j < group.items.length; j++) {
        var item = group.items[j];
        var active = item.href === current ? ' class="active"' : "";
        html += "<li><a href=\"" + item.href + "\"" + active + ">" + item.label + "</a></li>";
      }
    }
    html += "</ul></nav>";
    sidebar.innerHTML = html;
  }

  // Accordion toggle
  document.querySelectorAll(".accordion-header").forEach(function (btn) {
    btn.addEventListener("click", function () {
      btn.closest(".accordion").classList.toggle("open");
    });
  });

  // All accordions open by default
  document.querySelectorAll(".accordion").forEach(function (acc) {
    acc.classList.add("open");
  });
})();
