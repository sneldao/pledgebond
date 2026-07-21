{
  "brand": {
    "name": "Pledgebond",
    "attributes": [
      "ritualistic",
      "tactile",
      "contractual",
      "high-stakes",
      "shareable payoff",
      "warm + archival (not fintech)"
    ],
    "north_star_metaphor": "A pledge is a sealed contract/vault under tension. Progress is physical tightening of a wax seal/vault, not a bar."
  },

  "color_palette_hex": {
    "parchment": {
      "parchment-50": "#FFFBF2",
      "parchment-100": "#FBF2E3",
      "parchment-200": "#F2E6D1",
      "parchment-300": "#E7D7BC",
      "parchment-400": "#D8C6A4",
      "parchment-500": "#C7B18A"
    },
    "ink": {
      "ink-900": "#121012",
      "ink-800": "#1C191C",
      "ink-700": "#2A252A",
      "ink-600": "#3A333A",
      "ink-500": "#4B424B"
    },
    "wax_burgundy": {
      "wax-700": "#4A0F1E",
      "wax-600": "#651427",
      "wax-500": "#7B1730",
      "wax-400": "#9A1F3D",
      "wax-300": "#B83A57"
    },
    "aged_gold": {
      "gold-700": "#7A5A1A",
      "gold-600": "#8E6A1F",
      "gold-500": "#A77D2A",
      "gold-400": "#C49A3A",
      "gold-300": "#E0C06A",
      "gold-200": "#F2E2A6"
    },
    "support": {
      "success": "#1F6B4E",
      "warning": "#B86B1E",
      "danger": "#8B1E2D",
      "info": "#2B4A66",
      "focus_ring": "#C49A3A"
    },
    "gradients_allowed_mild": {
      "hero_parchment_warm": "linear-gradient(180deg, #FFFBF2 0%, #FBF2E3 55%, #F2E6D1 100%)",
      "vault_glow_light": "radial-gradient(closest-side, rgba(242,226,166,0.55), rgba(242,226,166,0) 70%)"
    },
    "notes": [
      "No blue/purple scheme. Keep warmth: parchment + gold + burgundy + ink.",
      "Use gradients only as section background accents (<=20% viewport) and glow overlays, never on reading surfaces."
    ]
  },

  "typography": {
    "google_fonts": {
      "serif_headers": {
        "family": "Cormorant Garamond",
        "weights": ["500", "600", "700"],
        "usage": "H1/H2, bond titles, ritual labels (e.g., 'Pledge Bond', 'Seal Locked')"
      },
      "sans_ui": {
        "family": "DM Sans",
        "weights": ["400", "500", "600", "700"],
        "usage": "UI body, buttons, forms, helper text"
      }
    },
    "tailwind_scale": {
      "h1": "text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-[-0.02em]",
      "h2": "text-base md:text-lg font-medium text-ink-700",
      "h3": "text-xl font-semibold",
      "body": "text-sm md:text-base leading-6",
      "small": "text-xs leading-5"
    },
    "type_rules": [
      "Headers use serif; all UI controls use sans.",
      "Use slightly tighter tracking on serif headings; keep body tracking normal.",
      "Numbers (amounts, deadlines) use DM Sans 600 for clarity; avoid monospace unless in debug/admin."
    ]
  },

  "design_tokens_css": {
    "instructions": "Replace the default shadcn tokens in /app/frontend/src/index.css :root with these HSL tokens (keep structure). Also add custom tokens for textures/shadows/radii.",
    "css": ":root {\n  /* Core surfaces */\n  --background: 40 56% 96%; /* parchment-100 */\n  --foreground: 300 6% 7%; /* ink-900 */\n\n  --card: 40 56% 98%;\n  --card-foreground: 300 6% 7%;\n\n  --popover: 40 56% 98%;\n  --popover-foreground: 300 6% 7%;\n\n  /* Brand */\n  --primary: 346 68% 29%; /* wax-600 */\n  --primary-foreground: 40 56% 98%;\n\n  --secondary: 40 34% 90%; /* parchment-200 */\n  --secondary-foreground: 300 6% 12%;\n\n  --muted: 40 28% 92%;\n  --muted-foreground: 300 4% 35%;\n\n  --accent: 42 55% 50%; /* gold-400 */\n  --accent-foreground: 300 6% 10%;\n\n  --destructive: 350 64% 33%;\n  --destructive-foreground: 40 56% 98%;\n\n  --border: 40 22% 82%;\n  --input: 40 22% 82%;\n  --ring: 42 55% 50%;\n\n  --radius: 0.75rem;\n\n  /* Extra tokens */\n  --radius-sm: 0.5rem;\n  --radius-lg: 1rem;\n\n  --shadow-ink: 0 10px 30px rgba(18,16,18,0.12);\n  --shadow-wax: 0 14px 40px rgba(123,23,48,0.18);\n  --shadow-emboss: inset 0 1px 0 rgba(255,255,255,0.55), inset 0 -10px 18px rgba(18,16,18,0.18);\n\n  --noise-opacity: 0.06;\n  --paper-fiber-opacity: 0.10;\n\n  --ease-ritual: cubic-bezier(0.2, 0.9, 0.2, 1);\n  --ease-clunk: cubic-bezier(0.16, 1, 0.3, 1);\n  --ease-snap: cubic-bezier(0.34, 1.56, 0.64, 1);\n}\n"
  },

  "vault_wax_seal_component": {
    "goal": "Replace progress bars with a tactile seal/vault that thickens/tightens as pledges arrive; becomes locked with a clunk; strains under deadline; cracks and opens on release.",
    "recommended_tech": {
      "motion": "framer-motion",
      "confetti": "canvas-confetti",
      "audio": "howler",
      "svg": "Inline SVG + filters (turbulence/displacement) for wax edge + crack",
      "optional": "lottie-react for prebuilt wax seal micro-animations (only if consistent with brand)"
    },
    "layered_svg_structure": {
      "layers": [
        {
          "name": "parchment_backplate",
          "description": "A circular parchment medallion behind the seal with subtle fiber/noise; acts as contrast halo.",
          "implementation": "<circle> with radial gradient + feTurbulence noise mask"
        },
        {
          "name": "wax_body",
          "description": "Main wax blob with irregular edge; uses displacement map for organic perimeter.",
          "implementation": "<path> (blob) + filter: feTurbulence + feDisplacementMap"
        },
        {
          "name": "wax_gloss",
          "description": "Specular highlight crescent (top-left) to sell melted wax.",
          "implementation": "<path> with white fill at 10–18% opacity + blur"
        },
        {
          "name": "wax_ridges",
          "description": "Concentric ridges that compress as progress increases (tightening).",
          "implementation": "3–6 rings as paths; animate scaleY/opacity"
        },
        {
          "name": "gold_emboss_crest",
          "description": "Heraldic crest stamped into wax (not floating icon).",
          "implementation": "<path> with fill gold + inner shadow; or use mask to create deboss (preferred)"
        },
        {
          "name": "seal_band",
          "description": "Thin aged-gold ring around wax; thickens with progress (visual meter).",
          "implementation": "stroke-width animates from 2 → 10; add subtle dash jitter"
        },
        {
          "name": "countdown_ring",
          "description": "Ticking ring around seal during Active state; not a progress bar, but a time tension indicator.",
          "implementation": "SVG circle stroke-dashoffset animation + tick marks"
        },
        {
          "name": "crack_paths",
          "description": "Hidden until release; then animate stroke draw + split.",
          "implementation": "stroke-dasharray animation + clipPath split"
        }
      ],
      "textures": {
        "parchment_noise": "CSS pseudo-element overlay using repeating-radial-gradient + mix-blend-mode:multiply; opacity var(--noise-opacity)",
        "wax_grain": "SVG feTurbulence baseFrequency 0.9–1.2, numOctaves 2; subtle",
        "gold_foil": "Use provided gold texture image as background-image clipped to crest/ring (optional)"
      },
      "lighting_shadows": {
        "wax_shadow": "Drop shadow: 0 18px 40px rgba(18,16,18,0.22)",
        "wax_emboss": "Inset highlight + inset shadow (see --shadow-emboss)",
        "gold_glint": "Small animated gradient sweep on hover only (duration 900ms)"
      }
    },
    "how_seal_thickens_no_progress_bar": {
      "principle": "Progress is communicated by physical mass + compression: thicker gold ring, tighter ridges, slightly larger wax footprint, and increased 'tension' sound/animation.",
      "visual_mappings": {
        "pledge_ratio_0_to_1": [
          "gold ring strokeWidth: 2 + ratio*8",
          "wax body scale: 1 + ratio*0.06",
          "ridge spacing: compress by ratio (scaleY 1 - ratio*0.12)",
          "edge displacement amplitude: 6 - ratio*3 (tightens edge)",
          "ambient glow: opacity ratio*0.25 (subtle)"
        ]
      },
      "avoid": [
        "No numeric percent bars.",
        "No linear progress component in UI (do not use /ui/progress)."
      ]
    },
    "avatar_orbit_stack": {
      "behavior": "When a fundee pledges, their avatar bubble flies in from bottom edge, arcs toward the seal, then snaps into an orbit slot. Orbit becomes denser as more join.",
      "layout": "Use 8–18 orbit slots depending on count; overflow becomes a stacked 'cluster' at 4 o'clock with +N badge.",
      "implementation_hint": "Compute polar positions around seal; animate with framer-motion layout + spring; use /ui/avatar + /ui/badge"
    }
  },

  "motion_specs": {
    "global": {
      "principles": [
        "Everything feels physical: weight, friction, snap.",
        "Use springs for objects (avatars, seal), tweens for rings/ticks.",
        "Never use transition: all."
      ],
      "easing": {
        "ritual": "var(--ease-ritual)",
        "clunk": "var(--ease-clunk)",
        "snap": "var(--ease-snap)"
      }
    },
    "pledge_in_avatar_fly": {
      "duration_ms": 650,
      "easing": "ritual",
      "sequence": [
        "Spawn avatar at y=+80px, opacity 0",
        "Fly arc to orbit slot (x,y) with slight overshoot",
        "Settle into orbit with spring (stiffness 260, damping 18)",
        "Play sound: pledge-in (short wax 'tap')"
      ],
      "micro": {
        "hover": "Avatar bubble lifts 2px + subtle shadow",
        "press": "scale 0.96"
      }
    },
    "seal_lock_clunk_activation": {
      "duration_ms": 520,
      "easing": "clunk",
      "keyframes": {
        "scale": [1, 1.06, 0.98, 1],
        "rotate_deg": [0, -1.2, 0.6, 0],
        "shadow": "increase then settle"
      },
      "sound": "seal-lock (short metallic latch + wax thud)",
      "visual": "Gold ring snaps to a thicker stroke; ridge lines compress; small dust motes"
    },
    "vault_strain_active_state": {
      "shake": {
        "amplitude_px": 1.5,
        "frequency_hz": 2.2,
        "trigger": "Only when < 20% time remaining OR tasks behind pace",
        "implementation": "framer-motion animate x/y small random jitter; respect prefers-reduced-motion"
      },
      "countdown_ring": {
        "behavior": "Tick marks pulse every second; ring stroke subtly advances (time), but never presented as a 'progress bar'.",
        "pulse_ms": 220,
        "easing": "snap"
      },
      "sound": "optional faint tick (off by default; enable in settings)"
    },
    "release_sequence_shareable": {
      "total_duration_ms": 2600,
      "vertical_frame": "390x844 safe area; keep vault centered at y~280; payout pockets at bottom third",
      "steps": [
        {
          "name": "crack",
          "duration_ms": 520,
          "motion": "Crack strokes draw outward; wax darkens at fissures; tiny shake",
          "sound": "crack (dry snap)"
        },
        {
          "name": "door_swing",
          "duration_ms": 780,
          "motion": "Vault halves rotate open (Y-axis fake via scaleX + rotateZ); ease ritual",
          "sound": "hinge + whoosh"
        },
        {
          "name": "light_burst",
          "duration_ms": 520,
          "motion": "Radial glow expands then fades; dust motes rise",
          "sound": "triumph sting (short)"
        },
        {
          "name": "coin_confetti_stream",
          "duration_ms": 780,
          "motion": "Coins/confetti emit from center and curve into labeled pockets; use canvas-confetti with custom shapes",
          "sound": "coin cascade (short)"
        }
      ],
      "implementation_hint": "Use a single orchestrated Framer Motion timeline; keep layers in one container for clean screen recording."
    },
    "fail_state": {
      "duration_ms": 900,
      "motion": "Seal desaturates and fades; ring stops ticking; vault remains shut; parchment dims",
      "sound": "low muted thud",
      "copy": "Use solemn contract language: 'Conditions unmet. Bond remains sealed.'"
    }
  },

  "layout_patterns_by_screen": {
    "global_layout": {
      "mobile_first": "Max width 420px content column on mobile; on desktop center the column but keep text left-aligned; add side parchment margins.",
      "avoid_card_grid": [
        "Use document-like rows with separators (torn edges) instead of card tiles.",
        "Use ribbon headers and wax-stamp section markers.",
        "Use one primary anchor (seal) per screen; secondary info in stacked sections."
      ],
      "grid": {
        "container": "mx-auto w-full max-w-[420px] px-4",
        "section_spacing": "py-5",
        "stack_gap": "space-y-4"
      }
    },

    "1_landing_role_picker": {
      "structure": [
        "Top: parchment masthead with serif title + subhead",
        "Center: large interactive seal (idle breathing) with 3 role ribbons around it",
        "Bottom: name input + continue button"
      ],
      "components": ["/ui/button", "/ui/input", "/ui/dialog", "/ui/separator"],
      "details": {
        "role_buttons": "Use ribbon-like buttons (not pills): rectangular with notched ends; border ink; hover glint on gold edge.",
        "background": "Parchment texture + subtle vignette; no big gradients."
      }
    },

    "2_explore_feed": {
      "structure": [
        "Header: 'Open Bonds' with wax-stamp filter chip row",
        "List: vertical document rows; each row has mini seal thumbnail + title + deadline + status",
        "Floating CTA: 'Create Bond' as wax-stamped button"
      ],
      "components": ["/ui/badge", "/ui/button", "/ui/scroll-area", "/ui/sheet", "/ui/tabs"],
      "avoid_card_grid": "Use full-width rows with separators; mini seal acts as thumbnail; no tile grid."
    },

    "3_create_bond_wizard": {
      "structure": [
        "Wizard header: parchment stepper as numbered wax stamps (1–5)",
        "Body: one question per screen (mobile) with large inputs",
        "Footer: persistent action bar with Back/Next"
      ],
      "components": ["/ui/form", "/ui/input", "/ui/textarea", "/ui/calendar", "/ui/select", "/ui/slider", "/ui/sheet"],
      "details": {
        "stepper": "Use circular wax stamps with embossed numbers; active step glows gold.",
        "payout_split": "Use slider + labeled pockets preview (Cause A/B) rather than charts."
      }
    },

    "4_bond_dashboard": {
      "structure": [
        "Hero: main seal/vault centered with orbiting avatars",
        "Below: task ledger (table-like rows) + leaderboard",
        "Sticky bottom: primary actions (Join / Submit Proof)"
      ],
      "components": ["/ui/avatar", "/ui/badge", "/ui/button", "/ui/table", "/ui/tabs", "/ui/drawer"],
      "avoid_card_grid": "Use ledger table rows with ink separators; tasks feel like contract clauses."
    },

    "5_join_bond_flow": {
      "structure": [
        "Modal/drawer: pledge amount + confirmation",
        "Preview: your avatar flies into orbit on confirm"
      ],
      "components": ["/ui/drawer", "/ui/input", "/ui/button", "/ui/sonner"],
      "details": {
        "copy": "Use contract language: 'I pledge', 'Witness', 'Seal my mark'."
      }
    },

    "6_proof_submission": {
      "structure": [
        "Top: task clause header with wax stamp",
        "Body: upload area (parchment dropzone) + optional numeric log",
        "Bottom: submit proof button"
      ],
      "components": ["/ui/input", "/ui/textarea", "/ui/button", "/ui/alert", "/ui/progress (ONLY for upload transfer, not goal progress)"]
    },

    "7_release_screen": {
      "structure": [
        "Full-screen vertical stage: vault centered",
        "Bottom third: payout pockets (Cause A/B) with labels",
        "Top: minimal title + status"
      ],
      "components": ["/ui/button", "/ui/badge"],
      "details": {
        "shareability": "Keep background clean parchment; avoid busy UI; one CTA after animation: 'Share'."
      }
    },

    "8_share_panel": {
      "structure": [
        "Sheet: preview of 9:16 share card",
        "Buttons: Copy link, Download, Share",
        "Optional: toggle sound on/off"
      ],
      "components": ["/ui/sheet", "/ui/button", "/ui/switch", "/ui/sonner"],
      "details": {
        "share_card": "Render as a single DOM node for html-to-image capture; include brand footer + bond id."
      }
    }
  },

  "iconography": {
    "approach": "Engraved / stamped / heraldic icons (monoline with slight wedge terminals), used as emboss/deboss in wax or ink stamps. Avoid generic stock line icons.",
    "sources": {
      "heraldic_packs": "https://iconscout.com/icon-packs/heraldic",
      "guidance": "Convert SVGs to single-color ink or gold; apply inner shadow to feel stamped."
    },
    "usage_rules": [
      "Icons appear inside wax stamps, ribbon labels, or as small ink marks in lists.",
      "No colorful icon set; keep to ink/gold/wax only."
    ]
  },

  "states": {
    "loading": {
      "concept": "Ink blot forming into a seal outline; skeletons look like faint pencil guidelines on parchment.",
      "components": ["/ui/skeleton"],
      "motion": "Shimmer is subtle and warm (gold tint), not gray."
    },
    "empty": {
      "explore_feed": "A blank parchment notice with a faint wax stamp watermark: 'No open bonds. Draft the first pledge.'",
      "tasks": "A torn-paper placeholder: 'No clauses added yet.'"
    },
    "error": {
      "tone": "Legal/contract tone, calm and specific.",
      "visual": "Ink smudge + red wax warning stamp (not bright red banners).",
      "components": ["/ui/alert", "/ui/sonner"]
    }
  },

  "share_card_spec": {
    "dimensions": {
      "aspect": "9:16",
      "px": "1080x1920 (export)",
      "safe_area": "Keep key content within 960x1720 centered"
    },
    "layout": {
      "top": "Bond title (serif) + status stamp (Active/Released) + deadline",
      "middle": "Vault/seal hero (largest element) mid-upper",
      "bottom": "Two payout pockets with % labels + destination names",
      "footer": "Pledgebond wordmark + short URL + 'Recorded as demo ledger'"
    },
    "visual": {
      "background": "Parchment with subtle vignette",
      "accent": "Gold filigree corners (very light)",
      "avoid": "No gradients over text; no busy patterns behind labels"
    }
  },

  "images_and_assets": {
    "image_urls": [
      {
        "category": "texture",
        "description": "Gold foil texture for optional crest/ring clipping (use sparingly)",
        "url": "https://images.pexels.com/photos/7405670/pexels-photo-7405670.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
      },
      {
        "category": "texture",
        "description": "Crumpled gold fabric texture alternative (subtle, blurred)",
        "url": "https://images.pexels.com/photos/2248589/pexels-photo-2248589.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
      }
    ],
    "external_refs": [
      {
        "category": "wax_seal_animation_library",
        "description": "Lottie wax seal animations (use as reference or fallback micro-animations)",
        "url": "https://iconscout.com/lottie-animations/wax-seal?styles[]=line"
      },
      {
        "category": "wax_seal_mockup",
        "description": "Wax seal stamp mockup PSD for visual reference (not runtime asset)",
        "url": "https://cssauthor.com/mockup/free-wax-seal-stamp-mockup-psd/"
      },
      {
        "category": "parchment_textures",
        "description": "Parchment texture references (choose one and self-host later)",
        "url": "https://www.freecreatives.com/textures/parchment-texture.html"
      }
    ]
  },

  "component_path": {
    "shadcn_primary": [
      "/app/frontend/src/components/ui/button.jsx",
      "/app/frontend/src/components/ui/avatar.jsx",
      "/app/frontend/src/components/ui/badge.jsx",
      "/app/frontend/src/components/ui/drawer.jsx",
      "/app/frontend/src/components/ui/dialog.jsx",
      "/app/frontend/src/components/ui/sheet.jsx",
      "/app/frontend/src/components/ui/tabs.jsx",
      "/app/frontend/src/components/ui/table.jsx",
      "/app/frontend/src/components/ui/input.jsx",
      "/app/frontend/src/components/ui/textarea.jsx",
      "/app/frontend/src/components/ui/calendar.jsx",
      "/app/frontend/src/components/ui/alert.jsx",
      "/app/frontend/src/components/ui/separator.jsx",
      "/app/frontend/src/components/ui/skeleton.jsx",
      "/app/frontend/src/components/ui/sonner.jsx"
    ],
    "explicitly_avoid": [
      "/app/frontend/src/components/ui/progress.jsx (do not use for pledge/task progress; only for file upload transfer if needed)"
    ]
  },

  "libraries_to_add": {
    "framer_motion": {
      "install": "npm i framer-motion",
      "usage": "Seal/vault orchestration, avatar orbit, clunk/release sequences"
    },
    "howler": {
      "install": "npm i howler",
      "usage": "Distinct audio cues: pledge-in, seal-lock, release, fail"
    },
    "canvas_confetti": {
      "install": "npm i canvas-confetti",
      "usage": "Coin/confetti stream into payout pockets"
    },
    "html_to_image_optional": {
      "install": "npm i html-to-image",
      "usage": "Generate share card PNG from DOM node"
    }
  },

  "interaction_testing_requirements": {
    "data_testid_rule": "All interactive and key informational elements MUST include data-testid in kebab-case describing role.",
    "examples": [
      "data-testid=\"role-picker-funder-button\"",
      "data-testid=\"explore-create-bond-fab\"",
      "data-testid=\"bond-dashboard-submit-proof-button\"",
      "data-testid=\"join-bond-confirm-pledge-button\"",
      "data-testid=\"release-screen-share-button\"",
      "data-testid=\"bond-status-badge\"",
      "data-testid=\"payout-pocket-cause-a\""
    ]
  },

  "instructions_to_main_agent": [
    "Replace default shadcn look by overriding tokens in index.css and restyling Button/Badge/Inputs to feel stamped/inked (no generic blue).",
    "Do NOT use progress bars for pledge/task completion. The seal thickness/tightness is the meter.",
    "Make the seal/vault component the anchor on every core screen (Landing, Explore rows, Dashboard, Release).",
    "Avoid card grids: use ledger rows, torn separators, ribbon headers, wax stamps.",
    "Implement release animation as a single vertical stage optimized for screen recording (390x844).",
    "Audio cues must be distinct and short; provide a mute toggle in Share panel.",
    "Use named exports for components and default exports for pages (JS files, not TSX).",
    "Add data-testid to every interactive element and key info label."
  ],

  "GENERAL_UI_UX_DESIGN_GUIDELINES": "    - You must **not** apply universal transition. Eg: `transition: all`. This results in breaking transforms. Always add transitions for specific interactive elements like button, input excluding transforms\n    - You must **not** center align the app container, ie do not add `.App { text-align: center; }` in the css file. This disrupts the human natural reading flow of text\n   - NEVER: use AI assistant Emoji characters like`🤖🧠💭💡🔮🎯📚🎭🎬🎪🎉🎊🎁🎀🎂🍰🎈🎨🎰💰💵💳🏦💎🪙💸🤑📊📈📉💹🔢🏆🥇 etc for icons. Always use **FontAwesome cdn** or **lucid-react** library already installed in the package.json\n\n **GRADIENT RESTRICTION RULE**\nNEVER use dark/saturated gradient combos (e.g., purple/pink) on any UI element.  Prohibited gradients: blue-500 to purple 600, purple 500 to pink-500, green-500 to blue-500, red to pink etc\nNEVER use dark gradients for logo, testimonial, footer etc\nNEVER let gradients cover more than 20% of the viewport.\nNEVER apply gradients to text-heavy content or reading areas.\nNEVER use gradients on small UI elements (<100px width).\nNEVER stack multiple gradient layers in the same viewport.\n\n**ENFORCEMENT RULE:**\n    • Id gradient area exceeds 20% of viewport OR affects readability, **THEN** use solid colors\n\n**How and where to use:**\n   • Section backgrounds (not content backgrounds)\n   • Hero section header content. Eg: dark to light to dark color\n   • Decorative overlays and accent elements only\n   • Hero section with 2-3 mild color\n   • Gradients creation can be done for any angle say horizontal, vertical or diagonal\n\n- For AI chat, voice application, **do not use purple color. Use color like light green, ocean blue, peach orange etc**\n\n</Font Guidelines>\n\n- Every interaction needs micro-animations - hover states, transitions, parallax effects, and entrance animations. Static = dead. \n   \n- Use 2-3x more spacing than feels comfortable. Cramped designs look cheap.\n\n- Subtle grain textures, noise overlays, custom cursors, selection states, and loading animations: separates good from extraordinary.\n   \n- Before generating UI, infer the visual style from the problem statement (palette, contrast, mood, motion) and immediately instantiate it by setting global design tokens (primary, secondary/accent, background, foreground, ring, state colors), rather than relying on any library defaults. Don't make the background dark as a default step, always understand problem first and define colors accordingly\n    Eg: - if it implies playful/energetic, choose a colorful scheme\n           - if it implies monochrome/minimal, choose a black–white/neutral scheme\n\n**Component Reuse:**\n\t- Prioritize using pre-existing components from src/components/ui when applicable\n\t- Create new components that match the style and conventions of existing components when needed\n\t- Examine existing components to understand the project's component patterns before creating new ones\n\n**IMPORTANT**: Do not use HTML based component like dropdown, calendar, toast etc. You **MUST** always use `/app/frontend/src/components/ui/ ` only as a primary components as these are modern and stylish component\n\n**Best Practices:**\n\t- Use Shadcn/UI as the primary component library for consistency and accessibility\n\t- Import path: ./components/[component-name]\n\n**Export Conventions:**\n\t- Components MUST use named exports (export const ComponentName = ...)\n\t- Pages MUST use default exports (export default function PageName() {...})\n\n**Toasts:**\n  - Use `sonner` for toasts\"\n  - Sonner component are located in `/app/src/components/ui/sonner.tsx`\n\nUse 2–4 color gradients, subtle textures/noise overlays, or CSS-based noise to avoid flat visuals."
}
