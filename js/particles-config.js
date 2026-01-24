tsParticles.load("tsparticles", {
  fullScreen: { enable: false },
  fpsLimit: 60,
  particles: {
    number: {
      value: 80,
      density: {
        enable: true,
        area: 800,
      },
    },
    color: {
      value: ["#22d3ee", "#9146FF", "#ff1493", "#ffd700", "#00ff00"],
    },
    shape: {
      type: "character",
      character: [
        {
          char: "♥",
          weight: "400",
          style: "normal",
          fill: true,
          font: "Verdana"
        },
        {
          char: "★",
          weight: "400",
          style: "normal",
          fill: true,
          font: "Verdana"
        },
        {
          char: "◆",
          weight: "400",
          style: "normal",
          fill: true,
          font: "Verdana"
        },
        {
          char: "✦",
          weight: "400",
          style: "normal",
          fill: true,
          font: "Verdana"
        }
      ]
    },
    opacity: {
      value: 0.6,
      random: true,
      animation: {
        enable: true,
        speed: 1,
        minimumValue: 0.2,
        sync: false,
      },
    },
    size: {
      value: { min: 8, max: 20 },
      random: true,
      animation: {
        enable: true,
        speed: 2,
        minimumValue: 5,
        sync: false,
      }
    },
    links: {
      enable: false,
    },
    move: {
      enable: true,
      speed: 2,
      direction: "top",
      random: true,
      straight: false,
      outModes: "out",
      gravity: {
        enable: true,
        acceleration: 5,
        maxSpeed: 8,
      }
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
        distance: 150,
        size: 25,
        duration: 2,
        opacity: 1,
        speed: 3,
      },
      push: {
        quantity: 6,
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
            value: 40,
          },
          size: {
            value: { min: 6, max: 14 },
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
    {
      maxWidth: 480,
      options: {
        particles: {
          number: {
            value: 20,
          },
          size: {
            value: { min: 5, max: 10 },
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
