/** @type {import('stylelint').Config} */
export default  {
  extends: [
    "stylelint-config-standard",
    "stylelint-config-tailwindcss",
  ],
  plugins: ["stylelint-order"],
  rules: {
    "at-rule-no-unknown": [true, {
      ignoreAtRules: [
        "tailwind", "apply", "layer", "screen", "responsive",
        "config", "theme", "plugin", "custom-variant", "utility", "import",
      ],
    }],

    "selector-class-pattern": [
      "^(?:react-flow__.*|[a-z][a-z0-9]*(?:-[a-z0-9]+)*(?:__(?:[a-z0-9]+(?:-[a-z0-9]+)*)?)?(?:--[a-z0-9-]+)?)$",
      { resolveNestedSelectors: true }
    ],

    "order/properties-order": [
      [
        { groupName: "position", properties: ["position","inset","top","right","bottom","left","z-index"] },
        { groupName: "display", properties: ["display","float","clear","box-sizing","overflow","overscroll-behavior"] },
        { groupName: "flex/grid", properties: ["flex","flex-grow","flex-shrink","flex-basis","flex-direction","flex-wrap","grid","grid-template-columns","grid-template-rows","gap","place-items","align-items","justify-content"] },
        { groupName: "size", properties: ["width","min-width","max-width","height","min-height","max-height"] },
        { groupName: "spacing", properties: ["margin","margin-*","padding","padding-*"] },
        { groupName: "typography", properties: ["font","font-*","line-height","letter-spacing","text-*","color"] },
        { groupName: "visual", properties: ["background","background-*","border","border-*","border-radius","box-shadow","opacity"] },
        { groupName: "effects", properties: ["transition","animation","cursor"] },
      ],
      { unspecified: "bottomAlphabetical" },
    ],
    "declaration-block-no-redundant-longhand-properties": null,
  },
  ignoreFiles: ["dist/**", "node_modules/**"],
};