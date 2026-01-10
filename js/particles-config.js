tsParticles.load("tsparticles", {
  fpsLimit: 60,
  particles: {
    number: {
      value: 60,
      density: {
        enable: true,
        area: 800,
      },
    },
    color: {
      value: ["#9146FF", "#64748b", "#00d2ff"],
    },
    shape: {
      type: ["circle", "image", "polygon"],
      options: {
        polygon: {
          sides: 5,
        },
        image: [
          {
            // Mini Twitch Glitch Logo (SVG Path equivalent)
            src: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0id2hpdGUiPjxwYXRoIGQ9Ik00MCAwSDYuN0wwIDYuN1YzMy4zSDEwVjQwTDE2LjcgMzMuM0gyNi43TDQwIDIwVjBaTTM2LjcgMTguM0wzMCAyNUgyMEwxNSAzMFYyNUg4LjNWMy4zSDM2LjdWMTguM1pNMzAgNi43VjE1SDI1VjYuN0gzMFpNMTguMyA2LjdWMTVIMTMuM1Y2LjdIMTguM1oiLz48L3N2Zz4=",
            width: 100,
            height: 100,
          },
          {
            // Mini Chat Bubble
            src: "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0iIzkxNDZGRiI+PHBhdGggZD0iTTIwIDJINGMtMS4xIDAtMiAuOS0yIDJ2MThsNC00aDE0Yy4xIDAgMi0uOSAyLTJWNGMwLTEuMS0uOS0yLTItMnoiLz48L3N2Zz4=",
            width: 100,
            height: 100,
          }
        ]
      },
    },
    opacity: {
      value: 0.4,
      random: true,
      animation: {
        enable: true,
        speed: 1,
        minimumValue: 0.1,
        sync: false,
      },
    },
    size: {
      value: { min: 2, max: 6 },
      random: true,
    },
    links: {
      enable: true,
      distance: 150,
      color: "#9146FF",
      opacity: 0.3,
      width: 1,
    },
    move: {
      enable: true,
      speed: 1.2,
      direction: "none",
      random: true,
      straight: false,
      outModes: "out",
    },
  },
  interactivity: {
    events: {
      onHover: {
        enable: true,
        mode: "bubble",
      },
      onClick: {
        enable: true,
        mode: "push",
      },
    },
    modes: {
      bubble: {
        distance: 200,
        size: 10,
        duration: 2,
        opacity: 0.8,
      },
      push: {
        quantity: 4,
      },
    },
  },
  detectRetina: true,
  responsive: [
    {
      maxWidth: 768,
      options: {
        particles: {
          number: {
            value: 30, // Reduced count
          },
          links: {
            enable: false, // Cleaner on small screens
          },
        },
        interactivity: {
          events: {
            onHover: {
              enable: false, // Avoid lag on mobile
            },
          },
        },
      },
    },
    {
      maxWidth: 480,
      options: {
        particles: {
          number: {
            value: 15, // Bare minimum for mobile
          },
        },
        interactivity: {
          events: {
            onHover: {
              enable: false,
            },
          },
        },
      },
    },
  ],
});
