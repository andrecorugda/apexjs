// Pure-JS globals a bare engine (QuickJS) lacks. On-device these come from the
// engine/WebView or a polyfill package; here we inject minimal versions.
(function(){
  function b64ToU8(b64){var C='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';b64=String(b64).replace(/=+$/,'');var out=[],bits=0,val=0;for(var i=0;i<b64.length;i++){var idx=C.indexOf(b64[i]);if(idx<0)continue;val=(val<<6)|idx;bits+=6;if(bits>=8){bits-=8;out.push((val>>bits)&255);}}return new Uint8Array(out);}
  if(typeof globalThis.TextEncoder==='undefined')globalThis.TextEncoder=class{encode(s){s=String(s);var b=[];for(var i=0;i<s.length;i++){var c=s.charCodeAt(i);if(c<128)b.push(c);else if(c<2048)b.push(192|c>>6,128|c&63);else b.push(224|c>>12,128|c>>6&63,128|c&63);}return new Uint8Array(b);}};
  if(typeof globalThis.TextDecoder==='undefined')globalThis.TextDecoder=class{decode(u){var a=u instanceof Uint8Array?u:new Uint8Array(u||[]),s='';for(var i=0;i<a.length;){var c=a[i++];if(c>=240){c=(c&7)<<18|(a[i++]&63)<<12|(a[i++]&63)<<6|a[i++]&63;}else if(c>=224){c=(c&15)<<12|(a[i++]&63)<<6|a[i++]&63;}else if(c>=192){c=(c&31)<<6|a[i++]&63;}s+=String.fromCodePoint(c);}return s;}};
  if(typeof globalThis.Buffer==='undefined')globalThis.Buffer={from:function(d,enc){if(enc==='base64')return b64ToU8(d);if(typeof d==='string')return new globalThis.TextEncoder().encode(d);return new Uint8Array(d);},isBuffer:function(){return false;}};
  if(typeof globalThis.URL==='undefined')globalThis.URL=class{constructor(u){this.href=String(u);var m=/^([a-z]+:)?(\/\/[^/?#]*)?([^?#]*)(\?[^#]*)?(#.*)?$/i.exec(this.href)||[];this.protocol=m[1]||'';this.host=(m[2]||'').replace(/^\/\//,'');this.pathname=m[3]||'/';this.search=m[4]||'';this.hash=m[5]||'';this.searchParams={get(){return null;},has(){return false;}};}};
})();
(function(){ if(typeof globalThis.process==='undefined')globalThis.process={env:{},argv:[],platform:'',version:'v0',versions:{},cwd:function(){return '/';},nextTick:function(f){Promise.resolve().then(f);},stdout:{write:function(){}},stderr:{write:function(){}}}; })();

var APEX = (() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
    get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
  }) : x)(function(x) {
    if (typeof require !== "undefined") return require.apply(this, arguments);
    throw Error('Dynamic require of "' + x + '" is not supported');
  });
  var __commonJS = (cb, mod) => function __require2() {
    try {
      return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
    } catch (e) {
      throw mod = 0, e;
    }
  };
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key2 of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key2) && key2 !== except)
          __defProp(to, key2, { get: () => from[key2], enumerable: !(desc = __getOwnPropDesc(from, key2)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

  // ../node_modules/.pnpm/boolbase@1.0.0/node_modules/boolbase/index.js
  var require_boolbase = __commonJS({
    "../node_modules/.pnpm/boolbase@1.0.0/node_modules/boolbase/index.js"(exports, module) {
      module.exports = {
        trueFunc: function trueFunc() {
          return true;
        },
        falseFunc: function falseFunc() {
          return false;
        }
      };
    }
  });

  // ../node_modules/.pnpm/cssom@0.5.0/node_modules/cssom/lib/StyleSheet.js
  var require_StyleSheet = __commonJS({
    "../node_modules/.pnpm/cssom@0.5.0/node_modules/cssom/lib/StyleSheet.js"(exports) {
      var CSSOM = {};
      CSSOM.StyleSheet = function StyleSheet() {
        this.parentStyleSheet = null;
      };
      exports.StyleSheet = CSSOM.StyleSheet;
    }
  });

  // ../node_modules/.pnpm/cssom@0.5.0/node_modules/cssom/lib/CSSRule.js
  var require_CSSRule = __commonJS({
    "../node_modules/.pnpm/cssom@0.5.0/node_modules/cssom/lib/CSSRule.js"(exports) {
      var CSSOM = {};
      CSSOM.CSSRule = function CSSRule() {
        this.parentRule = null;
        this.parentStyleSheet = null;
      };
      CSSOM.CSSRule.UNKNOWN_RULE = 0;
      CSSOM.CSSRule.STYLE_RULE = 1;
      CSSOM.CSSRule.CHARSET_RULE = 2;
      CSSOM.CSSRule.IMPORT_RULE = 3;
      CSSOM.CSSRule.MEDIA_RULE = 4;
      CSSOM.CSSRule.FONT_FACE_RULE = 5;
      CSSOM.CSSRule.PAGE_RULE = 6;
      CSSOM.CSSRule.KEYFRAMES_RULE = 7;
      CSSOM.CSSRule.KEYFRAME_RULE = 8;
      CSSOM.CSSRule.MARGIN_RULE = 9;
      CSSOM.CSSRule.NAMESPACE_RULE = 10;
      CSSOM.CSSRule.COUNTER_STYLE_RULE = 11;
      CSSOM.CSSRule.SUPPORTS_RULE = 12;
      CSSOM.CSSRule.DOCUMENT_RULE = 13;
      CSSOM.CSSRule.FONT_FEATURE_VALUES_RULE = 14;
      CSSOM.CSSRule.VIEWPORT_RULE = 15;
      CSSOM.CSSRule.REGION_STYLE_RULE = 16;
      CSSOM.CSSRule.prototype = {
        constructor: CSSOM.CSSRule
        //FIXME
      };
      exports.CSSRule = CSSOM.CSSRule;
    }
  });

  // ../node_modules/.pnpm/cssom@0.5.0/node_modules/cssom/lib/CSSStyleRule.js
  var require_CSSStyleRule = __commonJS({
    "../node_modules/.pnpm/cssom@0.5.0/node_modules/cssom/lib/CSSStyleRule.js"(exports) {
      var CSSOM = {
        CSSStyleDeclaration: require_CSSStyleDeclaration().CSSStyleDeclaration,
        CSSRule: require_CSSRule().CSSRule
      };
      CSSOM.CSSStyleRule = function CSSStyleRule() {
        CSSOM.CSSRule.call(this);
        this.selectorText = "";
        this.style = new CSSOM.CSSStyleDeclaration();
        this.style.parentRule = this;
      };
      CSSOM.CSSStyleRule.prototype = new CSSOM.CSSRule();
      CSSOM.CSSStyleRule.prototype.constructor = CSSOM.CSSStyleRule;
      CSSOM.CSSStyleRule.prototype.type = 1;
      Object.defineProperty(CSSOM.CSSStyleRule.prototype, "cssText", {
        get: function() {
          var text;
          if (this.selectorText) {
            text = this.selectorText + " {" + this.style.cssText + "}";
          } else {
            text = "";
          }
          return text;
        },
        set: function(cssText) {
          var rule2 = CSSOM.CSSStyleRule.parse(cssText);
          this.style = rule2.style;
          this.selectorText = rule2.selectorText;
        }
      });
      CSSOM.CSSStyleRule.parse = function(ruleText) {
        var i = 0;
        var state = "selector";
        var index;
        var j = i;
        var buffer = "";
        var SIGNIFICANT_WHITESPACE = {
          "selector": true,
          "value": true
        };
        var styleRule = new CSSOM.CSSStyleRule();
        var name, priority = "";
        for (var character; character = ruleText.charAt(i); i++) {
          switch (character) {
            case " ":
            case "	":
            case "\r":
            case "\n":
            case "\f":
              if (SIGNIFICANT_WHITESPACE[state]) {
                switch (ruleText.charAt(i - 1)) {
                  case " ":
                  case "	":
                  case "\r":
                  case "\n":
                  case "\f":
                    break;
                  default:
                    buffer += " ";
                    break;
                }
              }
              break;
            // String
            case '"':
              j = i + 1;
              index = ruleText.indexOf('"', j) + 1;
              if (!index) {
                throw '" is missing';
              }
              buffer += ruleText.slice(i, index);
              i = index - 1;
              break;
            case "'":
              j = i + 1;
              index = ruleText.indexOf("'", j) + 1;
              if (!index) {
                throw "' is missing";
              }
              buffer += ruleText.slice(i, index);
              i = index - 1;
              break;
            // Comment
            case "/":
              if (ruleText.charAt(i + 1) === "*") {
                i += 2;
                index = ruleText.indexOf("*/", i);
                if (index === -1) {
                  throw new SyntaxError("Missing */");
                } else {
                  i = index + 1;
                }
              } else {
                buffer += character;
              }
              break;
            case "{":
              if (state === "selector") {
                styleRule.selectorText = buffer.trim();
                buffer = "";
                state = "name";
              }
              break;
            case ":":
              if (state === "name") {
                name = buffer.trim();
                buffer = "";
                state = "value";
              } else {
                buffer += character;
              }
              break;
            case "!":
              if (state === "value" && ruleText.indexOf("!important", i) === i) {
                priority = "important";
                i += "important".length;
              } else {
                buffer += character;
              }
              break;
            case ";":
              if (state === "value") {
                styleRule.style.setProperty(name, buffer.trim(), priority);
                priority = "";
                buffer = "";
                state = "name";
              } else {
                buffer += character;
              }
              break;
            case "}":
              if (state === "value") {
                styleRule.style.setProperty(name, buffer.trim(), priority);
                priority = "";
                buffer = "";
              } else if (state === "name") {
                break;
              } else {
                buffer += character;
              }
              state = "selector";
              break;
            default:
              buffer += character;
              break;
          }
        }
        return styleRule;
      };
      exports.CSSStyleRule = CSSOM.CSSStyleRule;
    }
  });

  // ../node_modules/.pnpm/cssom@0.5.0/node_modules/cssom/lib/CSSStyleSheet.js
  var require_CSSStyleSheet = __commonJS({
    "../node_modules/.pnpm/cssom@0.5.0/node_modules/cssom/lib/CSSStyleSheet.js"(exports) {
      var CSSOM = {
        StyleSheet: require_StyleSheet().StyleSheet,
        CSSStyleRule: require_CSSStyleRule().CSSStyleRule
      };
      CSSOM.CSSStyleSheet = function CSSStyleSheet() {
        CSSOM.StyleSheet.call(this);
        this.cssRules = [];
      };
      CSSOM.CSSStyleSheet.prototype = new CSSOM.StyleSheet();
      CSSOM.CSSStyleSheet.prototype.constructor = CSSOM.CSSStyleSheet;
      CSSOM.CSSStyleSheet.prototype.insertRule = function(rule2, index) {
        if (index < 0 || index > this.cssRules.length) {
          throw new RangeError("INDEX_SIZE_ERR");
        }
        var cssRule = CSSOM.parse(rule2).cssRules[0];
        cssRule.parentStyleSheet = this;
        this.cssRules.splice(index, 0, cssRule);
        return index;
      };
      CSSOM.CSSStyleSheet.prototype.deleteRule = function(index) {
        if (index < 0 || index >= this.cssRules.length) {
          throw new RangeError("INDEX_SIZE_ERR");
        }
        this.cssRules.splice(index, 1);
      };
      CSSOM.CSSStyleSheet.prototype.toString = function() {
        var result = "";
        var rules = this.cssRules;
        for (var i = 0; i < rules.length; i++) {
          result += rules[i].cssText + "\n";
        }
        return result;
      };
      exports.CSSStyleSheet = CSSOM.CSSStyleSheet;
      CSSOM.parse = require_parse().parse;
    }
  });

  // ../node_modules/.pnpm/cssom@0.5.0/node_modules/cssom/lib/MediaList.js
  var require_MediaList = __commonJS({
    "../node_modules/.pnpm/cssom@0.5.0/node_modules/cssom/lib/MediaList.js"(exports) {
      var CSSOM = {};
      CSSOM.MediaList = function MediaList() {
        this.length = 0;
      };
      CSSOM.MediaList.prototype = {
        constructor: CSSOM.MediaList,
        /**
         * @return {string}
         */
        get mediaText() {
          return Array.prototype.join.call(this, ", ");
        },
        /**
         * @param {string} value
         */
        set mediaText(value) {
          var values = value.split(",");
          var length = this.length = values.length;
          for (var i = 0; i < length; i++) {
            this[i] = values[i].trim();
          }
        },
        /**
         * @param {string} medium
         */
        appendMedium: function(medium) {
          if (Array.prototype.indexOf.call(this, medium) === -1) {
            this[this.length] = medium;
            this.length++;
          }
        },
        /**
         * @param {string} medium
         */
        deleteMedium: function(medium) {
          var index = Array.prototype.indexOf.call(this, medium);
          if (index !== -1) {
            Array.prototype.splice.call(this, index, 1);
          }
        }
      };
      exports.MediaList = CSSOM.MediaList;
    }
  });

  // ../node_modules/.pnpm/cssom@0.5.0/node_modules/cssom/lib/CSSImportRule.js
  var require_CSSImportRule = __commonJS({
    "../node_modules/.pnpm/cssom@0.5.0/node_modules/cssom/lib/CSSImportRule.js"(exports) {
      var CSSOM = {
        CSSRule: require_CSSRule().CSSRule,
        CSSStyleSheet: require_CSSStyleSheet().CSSStyleSheet,
        MediaList: require_MediaList().MediaList
      };
      CSSOM.CSSImportRule = function CSSImportRule() {
        CSSOM.CSSRule.call(this);
        this.href = "";
        this.media = new CSSOM.MediaList();
        this.styleSheet = new CSSOM.CSSStyleSheet();
      };
      CSSOM.CSSImportRule.prototype = new CSSOM.CSSRule();
      CSSOM.CSSImportRule.prototype.constructor = CSSOM.CSSImportRule;
      CSSOM.CSSImportRule.prototype.type = 3;
      Object.defineProperty(CSSOM.CSSImportRule.prototype, "cssText", {
        get: function() {
          var mediaText = this.media.mediaText;
          return "@import url(" + this.href + ")" + (mediaText ? " " + mediaText : "") + ";";
        },
        set: function(cssText) {
          var i = 0;
          var state = "";
          var buffer = "";
          var index;
          for (var character; character = cssText.charAt(i); i++) {
            switch (character) {
              case " ":
              case "	":
              case "\r":
              case "\n":
              case "\f":
                if (state === "after-import") {
                  state = "url";
                } else {
                  buffer += character;
                }
                break;
              case "@":
                if (!state && cssText.indexOf("@import", i) === i) {
                  state = "after-import";
                  i += "import".length;
                  buffer = "";
                }
                break;
              case "u":
                if (state === "url" && cssText.indexOf("url(", i) === i) {
                  index = cssText.indexOf(")", i + 1);
                  if (index === -1) {
                    throw i + ': ")" not found';
                  }
                  i += "url(".length;
                  var url = cssText.slice(i, index);
                  if (url[0] === url[url.length - 1]) {
                    if (url[0] === '"' || url[0] === "'") {
                      url = url.slice(1, -1);
                    }
                  }
                  this.href = url;
                  i = index;
                  state = "media";
                }
                break;
              case '"':
                if (state === "url") {
                  index = cssText.indexOf('"', i + 1);
                  if (!index) {
                    throw i + `: '"' not found`;
                  }
                  this.href = cssText.slice(i + 1, index);
                  i = index;
                  state = "media";
                }
                break;
              case "'":
                if (state === "url") {
                  index = cssText.indexOf("'", i + 1);
                  if (!index) {
                    throw i + `: "'" not found`;
                  }
                  this.href = cssText.slice(i + 1, index);
                  i = index;
                  state = "media";
                }
                break;
              case ";":
                if (state === "media") {
                  if (buffer) {
                    this.media.mediaText = buffer.trim();
                  }
                }
                break;
              default:
                if (state === "media") {
                  buffer += character;
                }
                break;
            }
          }
        }
      });
      exports.CSSImportRule = CSSOM.CSSImportRule;
    }
  });

  // ../node_modules/.pnpm/cssom@0.5.0/node_modules/cssom/lib/CSSGroupingRule.js
  var require_CSSGroupingRule = __commonJS({
    "../node_modules/.pnpm/cssom@0.5.0/node_modules/cssom/lib/CSSGroupingRule.js"(exports) {
      var CSSOM = {
        CSSRule: require_CSSRule().CSSRule
      };
      CSSOM.CSSGroupingRule = function CSSGroupingRule() {
        CSSOM.CSSRule.call(this);
        this.cssRules = [];
      };
      CSSOM.CSSGroupingRule.prototype = new CSSOM.CSSRule();
      CSSOM.CSSGroupingRule.prototype.constructor = CSSOM.CSSGroupingRule;
      CSSOM.CSSGroupingRule.prototype.insertRule = function insertRule(rule2, index) {
        if (index < 0 || index > this.cssRules.length) {
          throw new RangeError("INDEX_SIZE_ERR");
        }
        var cssRule = CSSOM.parse(rule2).cssRules[0];
        cssRule.parentRule = this;
        this.cssRules.splice(index, 0, cssRule);
        return index;
      };
      CSSOM.CSSGroupingRule.prototype.deleteRule = function deleteRule(index) {
        if (index < 0 || index >= this.cssRules.length) {
          throw new RangeError("INDEX_SIZE_ERR");
        }
        this.cssRules.splice(index, 1)[0].parentRule = null;
      };
      exports.CSSGroupingRule = CSSOM.CSSGroupingRule;
    }
  });

  // ../node_modules/.pnpm/cssom@0.5.0/node_modules/cssom/lib/CSSConditionRule.js
  var require_CSSConditionRule = __commonJS({
    "../node_modules/.pnpm/cssom@0.5.0/node_modules/cssom/lib/CSSConditionRule.js"(exports) {
      var CSSOM = {
        CSSRule: require_CSSRule().CSSRule,
        CSSGroupingRule: require_CSSGroupingRule().CSSGroupingRule
      };
      CSSOM.CSSConditionRule = function CSSConditionRule() {
        CSSOM.CSSGroupingRule.call(this);
        this.cssRules = [];
      };
      CSSOM.CSSConditionRule.prototype = new CSSOM.CSSGroupingRule();
      CSSOM.CSSConditionRule.prototype.constructor = CSSOM.CSSConditionRule;
      CSSOM.CSSConditionRule.prototype.conditionText = "";
      CSSOM.CSSConditionRule.prototype.cssText = "";
      exports.CSSConditionRule = CSSOM.CSSConditionRule;
    }
  });

  // ../node_modules/.pnpm/cssom@0.5.0/node_modules/cssom/lib/CSSMediaRule.js
  var require_CSSMediaRule = __commonJS({
    "../node_modules/.pnpm/cssom@0.5.0/node_modules/cssom/lib/CSSMediaRule.js"(exports) {
      var CSSOM = {
        CSSRule: require_CSSRule().CSSRule,
        CSSGroupingRule: require_CSSGroupingRule().CSSGroupingRule,
        CSSConditionRule: require_CSSConditionRule().CSSConditionRule,
        MediaList: require_MediaList().MediaList
      };
      CSSOM.CSSMediaRule = function CSSMediaRule() {
        CSSOM.CSSConditionRule.call(this);
        this.media = new CSSOM.MediaList();
      };
      CSSOM.CSSMediaRule.prototype = new CSSOM.CSSConditionRule();
      CSSOM.CSSMediaRule.prototype.constructor = CSSOM.CSSMediaRule;
      CSSOM.CSSMediaRule.prototype.type = 4;
      Object.defineProperties(CSSOM.CSSMediaRule.prototype, {
        "conditionText": {
          get: function() {
            return this.media.mediaText;
          },
          set: function(value) {
            this.media.mediaText = value;
          },
          configurable: true,
          enumerable: true
        },
        "cssText": {
          get: function() {
            var cssTexts = [];
            for (var i = 0, length = this.cssRules.length; i < length; i++) {
              cssTexts.push(this.cssRules[i].cssText);
            }
            return "@media " + this.media.mediaText + " {" + cssTexts.join("") + "}";
          },
          configurable: true,
          enumerable: true
        }
      });
      exports.CSSMediaRule = CSSOM.CSSMediaRule;
    }
  });

  // ../node_modules/.pnpm/cssom@0.5.0/node_modules/cssom/lib/CSSSupportsRule.js
  var require_CSSSupportsRule = __commonJS({
    "../node_modules/.pnpm/cssom@0.5.0/node_modules/cssom/lib/CSSSupportsRule.js"(exports) {
      var CSSOM = {
        CSSRule: require_CSSRule().CSSRule,
        CSSGroupingRule: require_CSSGroupingRule().CSSGroupingRule,
        CSSConditionRule: require_CSSConditionRule().CSSConditionRule
      };
      CSSOM.CSSSupportsRule = function CSSSupportsRule() {
        CSSOM.CSSConditionRule.call(this);
      };
      CSSOM.CSSSupportsRule.prototype = new CSSOM.CSSConditionRule();
      CSSOM.CSSSupportsRule.prototype.constructor = CSSOM.CSSSupportsRule;
      CSSOM.CSSSupportsRule.prototype.type = 12;
      Object.defineProperty(CSSOM.CSSSupportsRule.prototype, "cssText", {
        get: function() {
          var cssTexts = [];
          for (var i = 0, length = this.cssRules.length; i < length; i++) {
            cssTexts.push(this.cssRules[i].cssText);
          }
          return "@supports " + this.conditionText + " {" + cssTexts.join("") + "}";
        }
      });
      exports.CSSSupportsRule = CSSOM.CSSSupportsRule;
    }
  });

  // ../node_modules/.pnpm/cssom@0.5.0/node_modules/cssom/lib/CSSFontFaceRule.js
  var require_CSSFontFaceRule = __commonJS({
    "../node_modules/.pnpm/cssom@0.5.0/node_modules/cssom/lib/CSSFontFaceRule.js"(exports) {
      var CSSOM = {
        CSSStyleDeclaration: require_CSSStyleDeclaration().CSSStyleDeclaration,
        CSSRule: require_CSSRule().CSSRule
      };
      CSSOM.CSSFontFaceRule = function CSSFontFaceRule() {
        CSSOM.CSSRule.call(this);
        this.style = new CSSOM.CSSStyleDeclaration();
        this.style.parentRule = this;
      };
      CSSOM.CSSFontFaceRule.prototype = new CSSOM.CSSRule();
      CSSOM.CSSFontFaceRule.prototype.constructor = CSSOM.CSSFontFaceRule;
      CSSOM.CSSFontFaceRule.prototype.type = 5;
      Object.defineProperty(CSSOM.CSSFontFaceRule.prototype, "cssText", {
        get: function() {
          return "@font-face {" + this.style.cssText + "}";
        }
      });
      exports.CSSFontFaceRule = CSSOM.CSSFontFaceRule;
    }
  });

  // ../node_modules/.pnpm/cssom@0.5.0/node_modules/cssom/lib/CSSHostRule.js
  var require_CSSHostRule = __commonJS({
    "../node_modules/.pnpm/cssom@0.5.0/node_modules/cssom/lib/CSSHostRule.js"(exports) {
      var CSSOM = {
        CSSRule: require_CSSRule().CSSRule
      };
      CSSOM.CSSHostRule = function CSSHostRule() {
        CSSOM.CSSRule.call(this);
        this.cssRules = [];
      };
      CSSOM.CSSHostRule.prototype = new CSSOM.CSSRule();
      CSSOM.CSSHostRule.prototype.constructor = CSSOM.CSSHostRule;
      CSSOM.CSSHostRule.prototype.type = 1001;
      Object.defineProperty(CSSOM.CSSHostRule.prototype, "cssText", {
        get: function() {
          var cssTexts = [];
          for (var i = 0, length = this.cssRules.length; i < length; i++) {
            cssTexts.push(this.cssRules[i].cssText);
          }
          return "@host {" + cssTexts.join("") + "}";
        }
      });
      exports.CSSHostRule = CSSOM.CSSHostRule;
    }
  });

  // ../node_modules/.pnpm/cssom@0.5.0/node_modules/cssom/lib/CSSKeyframeRule.js
  var require_CSSKeyframeRule = __commonJS({
    "../node_modules/.pnpm/cssom@0.5.0/node_modules/cssom/lib/CSSKeyframeRule.js"(exports) {
      var CSSOM = {
        CSSRule: require_CSSRule().CSSRule,
        CSSStyleDeclaration: require_CSSStyleDeclaration().CSSStyleDeclaration
      };
      CSSOM.CSSKeyframeRule = function CSSKeyframeRule() {
        CSSOM.CSSRule.call(this);
        this.keyText = "";
        this.style = new CSSOM.CSSStyleDeclaration();
        this.style.parentRule = this;
      };
      CSSOM.CSSKeyframeRule.prototype = new CSSOM.CSSRule();
      CSSOM.CSSKeyframeRule.prototype.constructor = CSSOM.CSSKeyframeRule;
      CSSOM.CSSKeyframeRule.prototype.type = 8;
      Object.defineProperty(CSSOM.CSSKeyframeRule.prototype, "cssText", {
        get: function() {
          return this.keyText + " {" + this.style.cssText + "} ";
        }
      });
      exports.CSSKeyframeRule = CSSOM.CSSKeyframeRule;
    }
  });

  // ../node_modules/.pnpm/cssom@0.5.0/node_modules/cssom/lib/CSSKeyframesRule.js
  var require_CSSKeyframesRule = __commonJS({
    "../node_modules/.pnpm/cssom@0.5.0/node_modules/cssom/lib/CSSKeyframesRule.js"(exports) {
      var CSSOM = {
        CSSRule: require_CSSRule().CSSRule
      };
      CSSOM.CSSKeyframesRule = function CSSKeyframesRule() {
        CSSOM.CSSRule.call(this);
        this.name = "";
        this.cssRules = [];
      };
      CSSOM.CSSKeyframesRule.prototype = new CSSOM.CSSRule();
      CSSOM.CSSKeyframesRule.prototype.constructor = CSSOM.CSSKeyframesRule;
      CSSOM.CSSKeyframesRule.prototype.type = 7;
      Object.defineProperty(CSSOM.CSSKeyframesRule.prototype, "cssText", {
        get: function() {
          var cssTexts = [];
          for (var i = 0, length = this.cssRules.length; i < length; i++) {
            cssTexts.push("  " + this.cssRules[i].cssText);
          }
          return "@" + (this._vendorPrefix || "") + "keyframes " + this.name + " { \n" + cssTexts.join("\n") + "\n}";
        }
      });
      exports.CSSKeyframesRule = CSSOM.CSSKeyframesRule;
    }
  });

  // ../node_modules/.pnpm/cssom@0.5.0/node_modules/cssom/lib/CSSValue.js
  var require_CSSValue = __commonJS({
    "../node_modules/.pnpm/cssom@0.5.0/node_modules/cssom/lib/CSSValue.js"(exports) {
      var CSSOM = {};
      CSSOM.CSSValue = function CSSValue() {
      };
      CSSOM.CSSValue.prototype = {
        constructor: CSSOM.CSSValue,
        // @see: http://www.w3.org/TR/DOM-Level-2-Style/css.html#CSS-CSSValue
        set cssText(text) {
          var name = this._getConstructorName();
          throw new Error('DOMException: property "cssText" of "' + name + '" is readonly and can not be replaced with "' + text + '"!');
        },
        get cssText() {
          var name = this._getConstructorName();
          throw new Error('getter "cssText" of "' + name + '" is not implemented!');
        },
        _getConstructorName: function() {
          var s = this.constructor.toString(), c = s.match(/function\s([^\(]+)/), name = c[1];
          return name;
        }
      };
      exports.CSSValue = CSSOM.CSSValue;
    }
  });

  // ../node_modules/.pnpm/cssom@0.5.0/node_modules/cssom/lib/CSSValueExpression.js
  var require_CSSValueExpression = __commonJS({
    "../node_modules/.pnpm/cssom@0.5.0/node_modules/cssom/lib/CSSValueExpression.js"(exports) {
      var CSSOM = {
        CSSValue: require_CSSValue().CSSValue
      };
      CSSOM.CSSValueExpression = function CSSValueExpression(token, idx) {
        this._token = token;
        this._idx = idx;
      };
      CSSOM.CSSValueExpression.prototype = new CSSOM.CSSValue();
      CSSOM.CSSValueExpression.prototype.constructor = CSSOM.CSSValueExpression;
      CSSOM.CSSValueExpression.prototype.parse = function() {
        var token = this._token, idx = this._idx;
        var character = "", expression = "", error = "", info, paren = [];
        for (; ; ++idx) {
          character = token.charAt(idx);
          if (character === "") {
            error = "css expression error: unfinished expression!";
            break;
          }
          switch (character) {
            case "(":
              paren.push(character);
              expression += character;
              break;
            case ")":
              paren.pop(character);
              expression += character;
              break;
            case "/":
              if (info = this._parseJSComment(token, idx)) {
                if (info.error) {
                  error = "css expression error: unfinished comment in expression!";
                } else {
                  idx = info.idx;
                }
              } else if (info = this._parseJSRexExp(token, idx)) {
                idx = info.idx;
                expression += info.text;
              } else {
                expression += character;
              }
              break;
            case "'":
            case '"':
              info = this._parseJSString(token, idx, character);
              if (info) {
                idx = info.idx;
                expression += info.text;
              } else {
                expression += character;
              }
              break;
            default:
              expression += character;
              break;
          }
          if (error) {
            break;
          }
          if (paren.length === 0) {
            break;
          }
        }
        var ret;
        if (error) {
          ret = {
            error
          };
        } else {
          ret = {
            idx,
            expression
          };
        }
        return ret;
      };
      CSSOM.CSSValueExpression.prototype._parseJSComment = function(token, idx) {
        var nextChar = token.charAt(idx + 1), text;
        if (nextChar === "/" || nextChar === "*") {
          var startIdx = idx, endIdx, commentEndChar;
          if (nextChar === "/") {
            commentEndChar = "\n";
          } else if (nextChar === "*") {
            commentEndChar = "*/";
          }
          endIdx = token.indexOf(commentEndChar, startIdx + 1 + 1);
          if (endIdx !== -1) {
            endIdx = endIdx + commentEndChar.length - 1;
            text = token.substring(idx, endIdx + 1);
            return {
              idx: endIdx,
              text
            };
          } else {
            var error = "css expression error: unfinished comment in expression!";
            return {
              error
            };
          }
        } else {
          return false;
        }
      };
      CSSOM.CSSValueExpression.prototype._parseJSString = function(token, idx, sep) {
        var endIdx = this._findMatchedIdx(token, idx, sep), text;
        if (endIdx === -1) {
          return false;
        } else {
          text = token.substring(idx, endIdx + sep.length);
          return {
            idx: endIdx,
            text
          };
        }
      };
      CSSOM.CSSValueExpression.prototype._parseJSRexExp = function(token, idx) {
        var before2 = token.substring(0, idx).replace(/\s+$/, ""), legalRegx = [
          /^$/,
          /\($/,
          /\[$/,
          /\!$/,
          /\+$/,
          /\-$/,
          /\*$/,
          /\/\s+/,
          /\%$/,
          /\=$/,
          /\>$/,
          /<$/,
          /\&$/,
          /\|$/,
          /\^$/,
          /\~$/,
          /\?$/,
          /\,$/,
          /delete$/,
          /in$/,
          /instanceof$/,
          /new$/,
          /typeof$/,
          /void$/
        ];
        var isLegal = legalRegx.some(function(reg) {
          return reg.test(before2);
        });
        if (!isLegal) {
          return false;
        } else {
          var sep = "/";
          return this._parseJSString(token, idx, sep);
        }
      };
      CSSOM.CSSValueExpression.prototype._findMatchedIdx = function(token, idx, sep) {
        var startIdx = idx, endIdx;
        var NOT_FOUND = -1;
        while (true) {
          endIdx = token.indexOf(sep, startIdx + 1);
          if (endIdx === -1) {
            endIdx = NOT_FOUND;
            break;
          } else {
            var text = token.substring(idx + 1, endIdx), matched = text.match(/\\+$/);
            if (!matched || matched[0] % 2 === 0) {
              break;
            } else {
              startIdx = endIdx;
            }
          }
        }
        var nextNewLineIdx = token.indexOf("\n", idx + 1);
        if (nextNewLineIdx < endIdx) {
          endIdx = NOT_FOUND;
        }
        return endIdx;
      };
      exports.CSSValueExpression = CSSOM.CSSValueExpression;
    }
  });

  // ../node_modules/.pnpm/cssom@0.5.0/node_modules/cssom/lib/MatcherList.js
  var require_MatcherList = __commonJS({
    "../node_modules/.pnpm/cssom@0.5.0/node_modules/cssom/lib/MatcherList.js"(exports) {
      var CSSOM = {};
      CSSOM.MatcherList = function MatcherList() {
        this.length = 0;
      };
      CSSOM.MatcherList.prototype = {
        constructor: CSSOM.MatcherList,
        /**
         * @return {string}
         */
        get matcherText() {
          return Array.prototype.join.call(this, ", ");
        },
        /**
         * @param {string} value
         */
        set matcherText(value) {
          var values = value.split(",");
          var length = this.length = values.length;
          for (var i = 0; i < length; i++) {
            this[i] = values[i].trim();
          }
        },
        /**
         * @param {string} matcher
         */
        appendMatcher: function(matcher) {
          if (Array.prototype.indexOf.call(this, matcher) === -1) {
            this[this.length] = matcher;
            this.length++;
          }
        },
        /**
         * @param {string} matcher
         */
        deleteMatcher: function(matcher) {
          var index = Array.prototype.indexOf.call(this, matcher);
          if (index !== -1) {
            Array.prototype.splice.call(this, index, 1);
          }
        }
      };
      exports.MatcherList = CSSOM.MatcherList;
    }
  });

  // ../node_modules/.pnpm/cssom@0.5.0/node_modules/cssom/lib/CSSDocumentRule.js
  var require_CSSDocumentRule = __commonJS({
    "../node_modules/.pnpm/cssom@0.5.0/node_modules/cssom/lib/CSSDocumentRule.js"(exports) {
      var CSSOM = {
        CSSRule: require_CSSRule().CSSRule,
        MatcherList: require_MatcherList().MatcherList
      };
      CSSOM.CSSDocumentRule = function CSSDocumentRule() {
        CSSOM.CSSRule.call(this);
        this.matcher = new CSSOM.MatcherList();
        this.cssRules = [];
      };
      CSSOM.CSSDocumentRule.prototype = new CSSOM.CSSRule();
      CSSOM.CSSDocumentRule.prototype.constructor = CSSOM.CSSDocumentRule;
      CSSOM.CSSDocumentRule.prototype.type = 10;
      Object.defineProperty(CSSOM.CSSDocumentRule.prototype, "cssText", {
        get: function() {
          var cssTexts = [];
          for (var i = 0, length = this.cssRules.length; i < length; i++) {
            cssTexts.push(this.cssRules[i].cssText);
          }
          return "@-moz-document " + this.matcher.matcherText + " {" + cssTexts.join("") + "}";
        }
      });
      exports.CSSDocumentRule = CSSOM.CSSDocumentRule;
    }
  });

  // ../node_modules/.pnpm/cssom@0.5.0/node_modules/cssom/lib/parse.js
  var require_parse = __commonJS({
    "../node_modules/.pnpm/cssom@0.5.0/node_modules/cssom/lib/parse.js"(exports) {
      var CSSOM = {};
      CSSOM.parse = function parse6(token) {
        var i = 0;
        var state = "before-selector";
        var index;
        var buffer = "";
        var valueParenthesisDepth = 0;
        var SIGNIFICANT_WHITESPACE = {
          "selector": true,
          "value": true,
          "value-parenthesis": true,
          "atRule": true,
          "importRule-begin": true,
          "importRule": true,
          "atBlock": true,
          "conditionBlock": true,
          "documentRule-begin": true
        };
        var styleSheet = new CSSOM.CSSStyleSheet();
        var currentScope = styleSheet;
        var parentRule;
        var ancestorRules = [];
        var hasAncestors = false;
        var prevScope;
        var name, priority = "", styleRule, mediaRule, supportsRule, importRule, fontFaceRule, keyframesRule, documentRule, hostRule;
        var atKeyframesRegExp = /@(-(?:\w+-)+)?keyframes/g;
        var parseError = function(message) {
          var lines = token.substring(0, i).split("\n");
          var lineCount = lines.length;
          var charCount = lines.pop().length + 1;
          var error = new Error(message + " (line " + lineCount + ", char " + charCount + ")");
          error.line = lineCount;
          error["char"] = charCount;
          error.styleSheet = styleSheet;
          throw error;
        };
        for (var character; character = token.charAt(i); i++) {
          switch (character) {
            case " ":
            case "	":
            case "\r":
            case "\n":
            case "\f":
              if (SIGNIFICANT_WHITESPACE[state]) {
                buffer += character;
              }
              break;
            // String
            case '"':
              index = i + 1;
              do {
                index = token.indexOf('"', index) + 1;
                if (!index) {
                  parseError('Unmatched "');
                }
              } while (token[index - 2] === "\\");
              buffer += token.slice(i, index);
              i = index - 1;
              switch (state) {
                case "before-value":
                  state = "value";
                  break;
                case "importRule-begin":
                  state = "importRule";
                  break;
              }
              break;
            case "'":
              index = i + 1;
              do {
                index = token.indexOf("'", index) + 1;
                if (!index) {
                  parseError("Unmatched '");
                }
              } while (token[index - 2] === "\\");
              buffer += token.slice(i, index);
              i = index - 1;
              switch (state) {
                case "before-value":
                  state = "value";
                  break;
                case "importRule-begin":
                  state = "importRule";
                  break;
              }
              break;
            // Comment
            case "/":
              if (token.charAt(i + 1) === "*") {
                i += 2;
                index = token.indexOf("*/", i);
                if (index === -1) {
                  parseError("Missing */");
                } else {
                  i = index + 1;
                }
              } else {
                buffer += character;
              }
              if (state === "importRule-begin") {
                buffer += " ";
                state = "importRule";
              }
              break;
            // At-rule
            case "@":
              if (token.indexOf("@-moz-document", i) === i) {
                state = "documentRule-begin";
                documentRule = new CSSOM.CSSDocumentRule();
                documentRule.__starts = i;
                i += "-moz-document".length;
                buffer = "";
                break;
              } else if (token.indexOf("@media", i) === i) {
                state = "atBlock";
                mediaRule = new CSSOM.CSSMediaRule();
                mediaRule.__starts = i;
                i += "media".length;
                buffer = "";
                break;
              } else if (token.indexOf("@supports", i) === i) {
                state = "conditionBlock";
                supportsRule = new CSSOM.CSSSupportsRule();
                supportsRule.__starts = i;
                i += "supports".length;
                buffer = "";
                break;
              } else if (token.indexOf("@host", i) === i) {
                state = "hostRule-begin";
                i += "host".length;
                hostRule = new CSSOM.CSSHostRule();
                hostRule.__starts = i;
                buffer = "";
                break;
              } else if (token.indexOf("@import", i) === i) {
                state = "importRule-begin";
                i += "import".length;
                buffer += "@import";
                break;
              } else if (token.indexOf("@font-face", i) === i) {
                state = "fontFaceRule-begin";
                i += "font-face".length;
                fontFaceRule = new CSSOM.CSSFontFaceRule();
                fontFaceRule.__starts = i;
                buffer = "";
                break;
              } else {
                atKeyframesRegExp.lastIndex = i;
                var matchKeyframes = atKeyframesRegExp.exec(token);
                if (matchKeyframes && matchKeyframes.index === i) {
                  state = "keyframesRule-begin";
                  keyframesRule = new CSSOM.CSSKeyframesRule();
                  keyframesRule.__starts = i;
                  keyframesRule._vendorPrefix = matchKeyframes[1];
                  i += matchKeyframes[0].length - 1;
                  buffer = "";
                  break;
                } else if (state === "selector") {
                  state = "atRule";
                }
              }
              buffer += character;
              break;
            case "{":
              if (state === "selector" || state === "atRule") {
                styleRule.selectorText = buffer.trim();
                styleRule.style.__starts = i;
                buffer = "";
                state = "before-name";
              } else if (state === "atBlock") {
                mediaRule.media.mediaText = buffer.trim();
                if (parentRule) {
                  ancestorRules.push(parentRule);
                }
                currentScope = parentRule = mediaRule;
                mediaRule.parentStyleSheet = styleSheet;
                buffer = "";
                state = "before-selector";
              } else if (state === "conditionBlock") {
                supportsRule.conditionText = buffer.trim();
                if (parentRule) {
                  ancestorRules.push(parentRule);
                }
                currentScope = parentRule = supportsRule;
                supportsRule.parentStyleSheet = styleSheet;
                buffer = "";
                state = "before-selector";
              } else if (state === "hostRule-begin") {
                if (parentRule) {
                  ancestorRules.push(parentRule);
                }
                currentScope = parentRule = hostRule;
                hostRule.parentStyleSheet = styleSheet;
                buffer = "";
                state = "before-selector";
              } else if (state === "fontFaceRule-begin") {
                if (parentRule) {
                  fontFaceRule.parentRule = parentRule;
                }
                fontFaceRule.parentStyleSheet = styleSheet;
                styleRule = fontFaceRule;
                buffer = "";
                state = "before-name";
              } else if (state === "keyframesRule-begin") {
                keyframesRule.name = buffer.trim();
                if (parentRule) {
                  ancestorRules.push(parentRule);
                  keyframesRule.parentRule = parentRule;
                }
                keyframesRule.parentStyleSheet = styleSheet;
                currentScope = parentRule = keyframesRule;
                buffer = "";
                state = "keyframeRule-begin";
              } else if (state === "keyframeRule-begin") {
                styleRule = new CSSOM.CSSKeyframeRule();
                styleRule.keyText = buffer.trim();
                styleRule.__starts = i;
                buffer = "";
                state = "before-name";
              } else if (state === "documentRule-begin") {
                documentRule.matcher.matcherText = buffer.trim();
                if (parentRule) {
                  ancestorRules.push(parentRule);
                  documentRule.parentRule = parentRule;
                }
                currentScope = parentRule = documentRule;
                documentRule.parentStyleSheet = styleSheet;
                buffer = "";
                state = "before-selector";
              }
              break;
            case ":":
              if (state === "name") {
                name = buffer.trim();
                buffer = "";
                state = "before-value";
              } else {
                buffer += character;
              }
              break;
            case "(":
              if (state === "value") {
                if (buffer.trim() === "expression") {
                  var info = new CSSOM.CSSValueExpression(token, i).parse();
                  if (info.error) {
                    parseError(info.error);
                  } else {
                    buffer += info.expression;
                    i = info.idx;
                  }
                } else {
                  state = "value-parenthesis";
                  valueParenthesisDepth = 1;
                  buffer += character;
                }
              } else if (state === "value-parenthesis") {
                valueParenthesisDepth++;
                buffer += character;
              } else {
                buffer += character;
              }
              break;
            case ")":
              if (state === "value-parenthesis") {
                valueParenthesisDepth--;
                if (valueParenthesisDepth === 0) state = "value";
              }
              buffer += character;
              break;
            case "!":
              if (state === "value" && token.indexOf("!important", i) === i) {
                priority = "important";
                i += "important".length;
              } else {
                buffer += character;
              }
              break;
            case ";":
              switch (state) {
                case "value":
                  styleRule.style.setProperty(name, buffer.trim(), priority);
                  priority = "";
                  buffer = "";
                  state = "before-name";
                  break;
                case "atRule":
                  buffer = "";
                  state = "before-selector";
                  break;
                case "importRule":
                  importRule = new CSSOM.CSSImportRule();
                  importRule.parentStyleSheet = importRule.styleSheet.parentStyleSheet = styleSheet;
                  importRule.cssText = buffer + character;
                  styleSheet.cssRules.push(importRule);
                  buffer = "";
                  state = "before-selector";
                  break;
                default:
                  buffer += character;
                  break;
              }
              break;
            case "}":
              switch (state) {
                case "value":
                  styleRule.style.setProperty(name, buffer.trim(), priority);
                  priority = "";
                /* falls through */
                case "before-name":
                case "name":
                  styleRule.__ends = i + 1;
                  if (parentRule) {
                    styleRule.parentRule = parentRule;
                  }
                  styleRule.parentStyleSheet = styleSheet;
                  currentScope.cssRules.push(styleRule);
                  buffer = "";
                  if (currentScope.constructor === CSSOM.CSSKeyframesRule) {
                    state = "keyframeRule-begin";
                  } else {
                    state = "before-selector";
                  }
                  break;
                case "keyframeRule-begin":
                case "before-selector":
                case "selector":
                  if (!parentRule) {
                    parseError("Unexpected }");
                  }
                  hasAncestors = ancestorRules.length > 0;
                  while (ancestorRules.length > 0) {
                    parentRule = ancestorRules.pop();
                    if (parentRule.constructor.name === "CSSMediaRule" || parentRule.constructor.name === "CSSSupportsRule") {
                      prevScope = currentScope;
                      currentScope = parentRule;
                      currentScope.cssRules.push(prevScope);
                      break;
                    }
                    if (ancestorRules.length === 0) {
                      hasAncestors = false;
                    }
                  }
                  if (!hasAncestors) {
                    currentScope.__ends = i + 1;
                    styleSheet.cssRules.push(currentScope);
                    currentScope = styleSheet;
                    parentRule = null;
                  }
                  buffer = "";
                  state = "before-selector";
                  break;
              }
              break;
            default:
              switch (state) {
                case "before-selector":
                  state = "selector";
                  styleRule = new CSSOM.CSSStyleRule();
                  styleRule.__starts = i;
                  break;
                case "before-name":
                  state = "name";
                  break;
                case "before-value":
                  state = "value";
                  break;
                case "importRule-begin":
                  state = "importRule";
                  break;
              }
              buffer += character;
              break;
          }
        }
        return styleSheet;
      };
      exports.parse = CSSOM.parse;
      CSSOM.CSSStyleSheet = require_CSSStyleSheet().CSSStyleSheet;
      CSSOM.CSSStyleRule = require_CSSStyleRule().CSSStyleRule;
      CSSOM.CSSImportRule = require_CSSImportRule().CSSImportRule;
      CSSOM.CSSGroupingRule = require_CSSGroupingRule().CSSGroupingRule;
      CSSOM.CSSMediaRule = require_CSSMediaRule().CSSMediaRule;
      CSSOM.CSSConditionRule = require_CSSConditionRule().CSSConditionRule;
      CSSOM.CSSSupportsRule = require_CSSSupportsRule().CSSSupportsRule;
      CSSOM.CSSFontFaceRule = require_CSSFontFaceRule().CSSFontFaceRule;
      CSSOM.CSSHostRule = require_CSSHostRule().CSSHostRule;
      CSSOM.CSSStyleDeclaration = require_CSSStyleDeclaration().CSSStyleDeclaration;
      CSSOM.CSSKeyframeRule = require_CSSKeyframeRule().CSSKeyframeRule;
      CSSOM.CSSKeyframesRule = require_CSSKeyframesRule().CSSKeyframesRule;
      CSSOM.CSSValueExpression = require_CSSValueExpression().CSSValueExpression;
      CSSOM.CSSDocumentRule = require_CSSDocumentRule().CSSDocumentRule;
    }
  });

  // ../node_modules/.pnpm/cssom@0.5.0/node_modules/cssom/lib/CSSStyleDeclaration.js
  var require_CSSStyleDeclaration = __commonJS({
    "../node_modules/.pnpm/cssom@0.5.0/node_modules/cssom/lib/CSSStyleDeclaration.js"(exports) {
      var CSSOM = {};
      CSSOM.CSSStyleDeclaration = function CSSStyleDeclaration2() {
        this.length = 0;
        this.parentRule = null;
        this._importants = {};
      };
      CSSOM.CSSStyleDeclaration.prototype = {
        constructor: CSSOM.CSSStyleDeclaration,
        /**
         *
         * @param {string} name
         * @see http://www.w3.org/TR/DOM-Level-2-Style/css.html#CSS-CSSStyleDeclaration-getPropertyValue
         * @return {string} the value of the property if it has been explicitly set for this declaration block.
         * Returns the empty string if the property has not been set.
         */
        getPropertyValue: function(name) {
          return this[name] || "";
        },
        /**
         *
         * @param {string} name
         * @param {string} value
         * @param {string} [priority=null] "important" or null
         * @see http://www.w3.org/TR/DOM-Level-2-Style/css.html#CSS-CSSStyleDeclaration-setProperty
         */
        setProperty: function(name, value, priority) {
          if (this[name]) {
            var index = Array.prototype.indexOf.call(this, name);
            if (index < 0) {
              this[this.length] = name;
              this.length++;
            }
          } else {
            this[this.length] = name;
            this.length++;
          }
          this[name] = value + "";
          this._importants[name] = priority;
        },
        /**
         *
         * @param {string} name
         * @see http://www.w3.org/TR/DOM-Level-2-Style/css.html#CSS-CSSStyleDeclaration-removeProperty
         * @return {string} the value of the property if it has been explicitly set for this declaration block.
         * Returns the empty string if the property has not been set or the property name does not correspond to a known CSS property.
         */
        removeProperty: function(name) {
          if (!(name in this)) {
            return "";
          }
          var index = Array.prototype.indexOf.call(this, name);
          if (index < 0) {
            return "";
          }
          var prevValue = this[name];
          this[name] = "";
          Array.prototype.splice.call(this, index, 1);
          return prevValue;
        },
        getPropertyCSSValue: function() {
        },
        /**
         *
         * @param {String} name
         */
        getPropertyPriority: function(name) {
          return this._importants[name] || "";
        },
        /**
         *   element.style.overflow = "auto"
         *   element.style.getPropertyShorthand("overflow-x")
         *   -> "overflow"
         */
        getPropertyShorthand: function() {
        },
        isPropertyImplicit: function() {
        },
        // Doesn't work in IE < 9
        get cssText() {
          var properties = [];
          for (var i = 0, length = this.length; i < length; ++i) {
            var name = this[i];
            var value = this.getPropertyValue(name);
            var priority = this.getPropertyPriority(name);
            if (priority) {
              priority = " !" + priority;
            }
            properties[i] = name + ": " + value + priority + ";";
          }
          return properties.join(" ");
        },
        set cssText(text) {
          var i, name;
          for (i = this.length; i--; ) {
            name = this[i];
            this[name] = "";
          }
          Array.prototype.splice.call(this, 0, this.length);
          this._importants = {};
          var dummyRule = CSSOM.parse("#bogus{" + text + "}").cssRules[0].style;
          var length = dummyRule.length;
          for (i = 0; i < length; ++i) {
            name = dummyRule[i];
            this.setProperty(dummyRule[i], dummyRule.getPropertyValue(name), dummyRule.getPropertyPriority(name));
          }
        }
      };
      exports.CSSStyleDeclaration = CSSOM.CSSStyleDeclaration;
      CSSOM.parse = require_parse().parse;
    }
  });

  // ../node_modules/.pnpm/cssom@0.5.0/node_modules/cssom/lib/clone.js
  var require_clone = __commonJS({
    "../node_modules/.pnpm/cssom@0.5.0/node_modules/cssom/lib/clone.js"(exports) {
      var CSSOM = {
        CSSStyleSheet: require_CSSStyleSheet().CSSStyleSheet,
        CSSRule: require_CSSRule().CSSRule,
        CSSStyleRule: require_CSSStyleRule().CSSStyleRule,
        CSSGroupingRule: require_CSSGroupingRule().CSSGroupingRule,
        CSSConditionRule: require_CSSConditionRule().CSSConditionRule,
        CSSMediaRule: require_CSSMediaRule().CSSMediaRule,
        CSSSupportsRule: require_CSSSupportsRule().CSSSupportsRule,
        CSSStyleDeclaration: require_CSSStyleDeclaration().CSSStyleDeclaration,
        CSSKeyframeRule: require_CSSKeyframeRule().CSSKeyframeRule,
        CSSKeyframesRule: require_CSSKeyframesRule().CSSKeyframesRule
      };
      CSSOM.clone = function clone(stylesheet) {
        var cloned = new CSSOM.CSSStyleSheet();
        var rules = stylesheet.cssRules;
        if (!rules) {
          return cloned;
        }
        for (var i = 0, rulesLength = rules.length; i < rulesLength; i++) {
          var rule2 = rules[i];
          var ruleClone = cloned.cssRules[i] = new rule2.constructor();
          var style = rule2.style;
          if (style) {
            var styleClone = ruleClone.style = new CSSOM.CSSStyleDeclaration();
            for (var j = 0, styleLength = style.length; j < styleLength; j++) {
              var name = styleClone[j] = style[j];
              styleClone[name] = style[name];
              styleClone._importants[name] = style.getPropertyPriority(name);
            }
            styleClone.length = style.length;
          }
          if (rule2.hasOwnProperty("keyText")) {
            ruleClone.keyText = rule2.keyText;
          }
          if (rule2.hasOwnProperty("selectorText")) {
            ruleClone.selectorText = rule2.selectorText;
          }
          if (rule2.hasOwnProperty("mediaText")) {
            ruleClone.mediaText = rule2.mediaText;
          }
          if (rule2.hasOwnProperty("conditionText")) {
            ruleClone.conditionText = rule2.conditionText;
          }
          if (rule2.hasOwnProperty("cssRules")) {
            ruleClone.cssRules = clone(rule2).cssRules;
          }
        }
        return cloned;
      };
      exports.clone = CSSOM.clone;
    }
  });

  // ../node_modules/.pnpm/cssom@0.5.0/node_modules/cssom/lib/index.js
  var require_lib = __commonJS({
    "../node_modules/.pnpm/cssom@0.5.0/node_modules/cssom/lib/index.js"(exports) {
      "use strict";
      exports.CSSStyleDeclaration = require_CSSStyleDeclaration().CSSStyleDeclaration;
      exports.CSSRule = require_CSSRule().CSSRule;
      exports.CSSGroupingRule = require_CSSGroupingRule().CSSGroupingRule;
      exports.CSSConditionRule = require_CSSConditionRule().CSSConditionRule;
      exports.CSSStyleRule = require_CSSStyleRule().CSSStyleRule;
      exports.MediaList = require_MediaList().MediaList;
      exports.CSSMediaRule = require_CSSMediaRule().CSSMediaRule;
      exports.CSSSupportsRule = require_CSSSupportsRule().CSSSupportsRule;
      exports.CSSImportRule = require_CSSImportRule().CSSImportRule;
      exports.CSSFontFaceRule = require_CSSFontFaceRule().CSSFontFaceRule;
      exports.CSSHostRule = require_CSSHostRule().CSSHostRule;
      exports.StyleSheet = require_StyleSheet().StyleSheet;
      exports.CSSStyleSheet = require_CSSStyleSheet().CSSStyleSheet;
      exports.CSSKeyframesRule = require_CSSKeyframesRule().CSSKeyframesRule;
      exports.CSSKeyframeRule = require_CSSKeyframeRule().CSSKeyframeRule;
      exports.MatcherList = require_MatcherList().MatcherList;
      exports.CSSDocumentRule = require_CSSDocumentRule().CSSDocumentRule;
      exports.CSSValue = require_CSSValue().CSSValue;
      exports.CSSValueExpression = require_CSSValueExpression().CSSValueExpression;
      exports.parse = require_parse().parse;
      exports.clone = require_clone().clone;
    }
  });

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/commonjs/canvas-shim.cjs
  var require_canvas_shim = __commonJS({
    "../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/commonjs/canvas-shim.cjs"(exports, module) {
      var Canvas2 = class {
        constructor(width, height) {
          this.width = width;
          this.height = height;
        }
        getContext() {
          return null;
        }
        toDataURL() {
          return "";
        }
      };
      module.exports = {
        createCanvas: (width, height) => new Canvas2(width, height)
      };
    }
  });

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/commonjs/canvas.cjs
  var require_canvas = __commonJS({
    "../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/commonjs/canvas.cjs"(exports, module) {
      try {
        module.exports = __require("canvas");
      } catch (fallback) {
        module.exports = require_canvas_shim();
      }
    }
  });

  // ../node_modules/.pnpm/picocolors@1.1.1/node_modules/picocolors/picocolors.js
  var require_picocolors = __commonJS({
    "../node_modules/.pnpm/picocolors@1.1.1/node_modules/picocolors/picocolors.js"(exports, module) {
      var p = process || {};
      var argv = p.argv || [];
      var env = p.env || {};
      var isColorSupported = !(!!env.NO_COLOR || argv.includes("--no-color")) && (!!env.FORCE_COLOR || argv.includes("--color") || p.platform === "win32" || (p.stdout || {}).isTTY && env.TERM !== "dumb" || !!env.CI);
      var formatter = (open, close, replace2 = open) => (input) => {
        let string = "" + input, index = string.indexOf(close, open.length);
        return ~index ? open + replaceClose(string, close, replace2, index) + close : open + string + close;
      };
      var replaceClose = (string, close, replace2, index) => {
        let result = "", cursor = 0;
        do {
          result += string.substring(cursor, index) + replace2;
          cursor = index + close.length;
          index = string.indexOf(close, cursor);
        } while (~index);
        return result + string.substring(cursor);
      };
      var createColors = (enabled = isColorSupported) => {
        let f = enabled ? formatter : () => String;
        return {
          isColorSupported: enabled,
          reset: f("\x1B[0m", "\x1B[0m"),
          bold: f("\x1B[1m", "\x1B[22m", "\x1B[22m\x1B[1m"),
          dim: f("\x1B[2m", "\x1B[22m", "\x1B[22m\x1B[2m"),
          italic: f("\x1B[3m", "\x1B[23m"),
          underline: f("\x1B[4m", "\x1B[24m"),
          inverse: f("\x1B[7m", "\x1B[27m"),
          hidden: f("\x1B[8m", "\x1B[28m"),
          strikethrough: f("\x1B[9m", "\x1B[29m"),
          black: f("\x1B[30m", "\x1B[39m"),
          red: f("\x1B[31m", "\x1B[39m"),
          green: f("\x1B[32m", "\x1B[39m"),
          yellow: f("\x1B[33m", "\x1B[39m"),
          blue: f("\x1B[34m", "\x1B[39m"),
          magenta: f("\x1B[35m", "\x1B[39m"),
          cyan: f("\x1B[36m", "\x1B[39m"),
          white: f("\x1B[37m", "\x1B[39m"),
          gray: f("\x1B[90m", "\x1B[39m"),
          bgBlack: f("\x1B[40m", "\x1B[49m"),
          bgRed: f("\x1B[41m", "\x1B[49m"),
          bgGreen: f("\x1B[42m", "\x1B[49m"),
          bgYellow: f("\x1B[43m", "\x1B[49m"),
          bgBlue: f("\x1B[44m", "\x1B[49m"),
          bgMagenta: f("\x1B[45m", "\x1B[49m"),
          bgCyan: f("\x1B[46m", "\x1B[49m"),
          bgWhite: f("\x1B[47m", "\x1B[49m"),
          blackBright: f("\x1B[90m", "\x1B[39m"),
          redBright: f("\x1B[91m", "\x1B[39m"),
          greenBright: f("\x1B[92m", "\x1B[39m"),
          yellowBright: f("\x1B[93m", "\x1B[39m"),
          blueBright: f("\x1B[94m", "\x1B[39m"),
          magentaBright: f("\x1B[95m", "\x1B[39m"),
          cyanBright: f("\x1B[96m", "\x1B[39m"),
          whiteBright: f("\x1B[97m", "\x1B[39m"),
          bgBlackBright: f("\x1B[100m", "\x1B[49m"),
          bgRedBright: f("\x1B[101m", "\x1B[49m"),
          bgGreenBright: f("\x1B[102m", "\x1B[49m"),
          bgYellowBright: f("\x1B[103m", "\x1B[49m"),
          bgBlueBright: f("\x1B[104m", "\x1B[49m"),
          bgMagentaBright: f("\x1B[105m", "\x1B[49m"),
          bgCyanBright: f("\x1B[106m", "\x1B[49m"),
          bgWhiteBright: f("\x1B[107m", "\x1B[49m")
        };
      };
      module.exports = createColors();
      module.exports.createColors = createColors;
    }
  });

  // ../node_modules/.pnpm/postcss@8.5.16/node_modules/postcss/lib/tokenize.js
  var require_tokenize = __commonJS({
    "../node_modules/.pnpm/postcss@8.5.16/node_modules/postcss/lib/tokenize.js"(exports, module) {
      "use strict";
      var SINGLE_QUOTE = "'".charCodeAt(0);
      var DOUBLE_QUOTE = '"'.charCodeAt(0);
      var BACKSLASH = "\\".charCodeAt(0);
      var SLASH = "/".charCodeAt(0);
      var NEWLINE = "\n".charCodeAt(0);
      var SPACE = " ".charCodeAt(0);
      var FEED = "\f".charCodeAt(0);
      var TAB = "	".charCodeAt(0);
      var CR = "\r".charCodeAt(0);
      var OPEN_SQUARE = "[".charCodeAt(0);
      var CLOSE_SQUARE = "]".charCodeAt(0);
      var OPEN_PARENTHESES = "(".charCodeAt(0);
      var CLOSE_PARENTHESES = ")".charCodeAt(0);
      var OPEN_CURLY = "{".charCodeAt(0);
      var CLOSE_CURLY = "}".charCodeAt(0);
      var SEMICOLON = ";".charCodeAt(0);
      var ASTERISK = "*".charCodeAt(0);
      var COLON = ":".charCodeAt(0);
      var AT = "@".charCodeAt(0);
      var RE_AT_END = /[\t\n\f\r "#'()/;[\\\]{}]/g;
      var RE_WORD_END = /[\t\n\f\r !"#'():;@[\\\]{}]|\/(?=\*)/g;
      var RE_BAD_BRACKET = /.[\r\n"'(/\\]/;
      var RE_HEX_ESCAPE = /[\da-f]/i;
      module.exports = function tokenizer(input, options = {}) {
        let css = input.css.valueOf();
        let ignore = options.ignoreErrors;
        let code, content, escape3, next, quote;
        let currentToken, escaped, escapePos, n, prev;
        let length = css.length;
        let pos = 0;
        let buffer = [];
        let returned = [];
        let lastBadParen = -1;
        function position() {
          return pos;
        }
        function unclosed(what) {
          throw input.error("Unclosed " + what, pos);
        }
        function endOfFile() {
          return returned.length === 0 && pos >= length;
        }
        function nextToken(opts) {
          if (returned.length) return returned.pop();
          if (pos >= length) return;
          let ignoreUnclosed = opts ? opts.ignoreUnclosed : false;
          code = css.charCodeAt(pos);
          switch (code) {
            case NEWLINE:
            case SPACE:
            case TAB:
            case CR:
            case FEED: {
              next = pos;
              do {
                next += 1;
                code = css.charCodeAt(next);
              } while (code === SPACE || code === NEWLINE || code === TAB || code === CR || code === FEED);
              currentToken = ["space", css.slice(pos, next)];
              pos = next - 1;
              break;
            }
            case OPEN_SQUARE:
            case CLOSE_SQUARE:
            case OPEN_CURLY:
            case CLOSE_CURLY:
            case COLON:
            case SEMICOLON:
            case CLOSE_PARENTHESES: {
              let controlChar = String.fromCharCode(code);
              currentToken = [controlChar, controlChar, pos];
              break;
            }
            case OPEN_PARENTHESES: {
              prev = buffer.length ? buffer.pop()[1] : "";
              n = css.charCodeAt(pos + 1);
              if (prev === "url" && n !== SINGLE_QUOTE && n !== DOUBLE_QUOTE && n !== SPACE && n !== NEWLINE && n !== TAB && n !== FEED && n !== CR) {
                next = pos;
                do {
                  escaped = false;
                  next = css.indexOf(")", next + 1);
                  if (next === -1) {
                    if (ignore || ignoreUnclosed) {
                      next = pos;
                      break;
                    } else {
                      unclosed("bracket");
                    }
                  }
                  escapePos = next;
                  while (css.charCodeAt(escapePos - 1) === BACKSLASH) {
                    escapePos -= 1;
                    escaped = !escaped;
                  }
                } while (escaped);
                currentToken = ["brackets", css.slice(pos, next + 1), pos, next];
                pos = next;
              } else if (pos <= lastBadParen) {
                currentToken = ["(", "(", pos];
              } else {
                next = css.indexOf(")", pos + 1);
                content = css.slice(pos, next + 1);
                if (next === -1 || RE_BAD_BRACKET.test(content)) {
                  lastBadParen = next === -1 ? length : next;
                  currentToken = ["(", "(", pos];
                } else {
                  currentToken = ["brackets", content, pos, next];
                  pos = next;
                }
              }
              break;
            }
            case SINGLE_QUOTE:
            case DOUBLE_QUOTE: {
              quote = code === SINGLE_QUOTE ? "'" : '"';
              next = pos;
              do {
                escaped = false;
                next = css.indexOf(quote, next + 1);
                if (next === -1) {
                  if (ignore || ignoreUnclosed) {
                    next = pos + 1;
                    break;
                  } else {
                    unclosed("string");
                  }
                }
                escapePos = next;
                while (css.charCodeAt(escapePos - 1) === BACKSLASH) {
                  escapePos -= 1;
                  escaped = !escaped;
                }
              } while (escaped);
              currentToken = ["string", css.slice(pos, next + 1), pos, next];
              pos = next;
              break;
            }
            case AT: {
              RE_AT_END.lastIndex = pos + 1;
              RE_AT_END.test(css);
              if (RE_AT_END.lastIndex === 0) {
                next = css.length - 1;
              } else {
                next = RE_AT_END.lastIndex - 2;
              }
              currentToken = ["at-word", css.slice(pos, next + 1), pos, next];
              pos = next;
              break;
            }
            case BACKSLASH: {
              next = pos;
              escape3 = true;
              while (css.charCodeAt(next + 1) === BACKSLASH) {
                next += 1;
                escape3 = !escape3;
              }
              code = css.charCodeAt(next + 1);
              if (escape3 && code !== SLASH && code !== SPACE && code !== NEWLINE && code !== TAB && code !== CR && code !== FEED) {
                next += 1;
                if (RE_HEX_ESCAPE.test(css.charAt(next))) {
                  while (RE_HEX_ESCAPE.test(css.charAt(next + 1))) {
                    next += 1;
                  }
                  if (css.charCodeAt(next + 1) === SPACE) {
                    next += 1;
                  }
                }
              }
              currentToken = ["word", css.slice(pos, next + 1), pos, next];
              pos = next;
              break;
            }
            default: {
              if (code === SLASH && css.charCodeAt(pos + 1) === ASTERISK) {
                next = css.indexOf("*/", pos + 2) + 1;
                if (next === 0) {
                  if (ignore || ignoreUnclosed) {
                    next = css.length;
                  } else {
                    unclosed("comment");
                  }
                }
                currentToken = ["comment", css.slice(pos, next + 1), pos, next];
                pos = next;
              } else {
                RE_WORD_END.lastIndex = pos + 1;
                RE_WORD_END.test(css);
                if (RE_WORD_END.lastIndex === 0) {
                  next = css.length - 1;
                } else {
                  next = RE_WORD_END.lastIndex - 2;
                }
                currentToken = ["word", css.slice(pos, next + 1), pos, next];
                buffer.push(currentToken);
                pos = next;
              }
              break;
            }
          }
          pos++;
          return currentToken;
        }
        function back(token) {
          returned.push(token);
        }
        return {
          back,
          endOfFile,
          nextToken,
          position
        };
      };
    }
  });

  // ../node_modules/.pnpm/postcss@8.5.16/node_modules/postcss/lib/terminal-highlight.js
  var require_terminal_highlight = __commonJS({
    "../node_modules/.pnpm/postcss@8.5.16/node_modules/postcss/lib/terminal-highlight.js"(exports, module) {
      "use strict";
      var pico = require_picocolors();
      var tokenizer = require_tokenize();
      var Input2;
      function registerInput(dependant) {
        Input2 = dependant;
      }
      var HIGHLIGHT_THEME = {
        ";": pico.yellow,
        ":": pico.yellow,
        "(": pico.cyan,
        ")": pico.cyan,
        "[": pico.yellow,
        "]": pico.yellow,
        "{": pico.yellow,
        "}": pico.yellow,
        "at-word": pico.cyan,
        "brackets": pico.cyan,
        "call": pico.cyan,
        "class": pico.yellow,
        "comment": pico.gray,
        "hash": pico.magenta,
        "string": pico.green
      };
      function getTokenType([type, value], processor) {
        if (type === "word") {
          if (value[0] === ".") {
            return "class";
          }
          if (value[0] === "#") {
            return "hash";
          }
        }
        if (!processor.endOfFile()) {
          let next = processor.nextToken();
          processor.back(next);
          if (next[0] === "brackets" || next[0] === "(") return "call";
        }
        return type;
      }
      function terminalHighlight(css) {
        let processor = tokenizer(new Input2(css), { ignoreErrors: true });
        let result = "";
        while (!processor.endOfFile()) {
          let token = processor.nextToken();
          let color = HIGHLIGHT_THEME[getTokenType(token, processor)];
          if (color) {
            result += token[1].split(/\r?\n/).map((i) => color(i)).join("\n");
          } else {
            result += token[1];
          }
        }
        return result;
      }
      terminalHighlight.registerInput = registerInput;
      module.exports = terminalHighlight;
    }
  });

  // ../node_modules/.pnpm/postcss@8.5.16/node_modules/postcss/lib/css-syntax-error.js
  var require_css_syntax_error = __commonJS({
    "../node_modules/.pnpm/postcss@8.5.16/node_modules/postcss/lib/css-syntax-error.js"(exports, module) {
      "use strict";
      var pico = require_picocolors();
      var terminalHighlight = require_terminal_highlight();
      var CssSyntaxError2 = class _CssSyntaxError extends Error {
        constructor(message, line, column, source, file, plugin2) {
          super(message);
          this.name = "CssSyntaxError";
          this.reason = message;
          if (file) {
            this.file = file;
          }
          if (source) {
            this.source = source;
          }
          if (plugin2) {
            this.plugin = plugin2;
          }
          if (typeof line !== "undefined" && typeof column !== "undefined") {
            if (typeof line === "number") {
              this.line = line;
              this.column = column;
            } else {
              this.line = line.line;
              this.column = line.column;
              this.endLine = column.line;
              this.endColumn = column.column;
            }
          }
          this.setMessage();
          if (Error.captureStackTrace) {
            Error.captureStackTrace(this, _CssSyntaxError);
          }
        }
        setMessage() {
          this.message = this.plugin ? this.plugin + ": " : "";
          this.message += this.file ? this.file : "<css input>";
          if (typeof this.line !== "undefined") {
            this.message += ":" + this.line + ":" + this.column;
          }
          this.message += ": " + this.reason;
        }
        showSourceCode(color) {
          if (!this.source) return "";
          let css = this.source;
          if (color == null) color = pico.isColorSupported;
          let aside = (text) => text;
          let mark = (text) => text;
          let highlight = (text) => text;
          if (color) {
            let { bold, gray, red } = pico.createColors(true);
            mark = (text) => bold(red(text));
            aside = (text) => gray(text);
            if (terminalHighlight) {
              highlight = (text) => terminalHighlight(text);
            }
          }
          let lines = css.split(/\r?\n/);
          let start = Math.max(this.line - 3, 0);
          let end = Math.min(this.line + 2, lines.length);
          let maxWidth = String(end).length;
          return lines.slice(start, end).map((line, index) => {
            let number = start + 1 + index;
            let gutter = " " + (" " + number).slice(-maxWidth) + " | ";
            if (number === this.line) {
              if (line.length > 160) {
                let padding = 20;
                let subLineStart = Math.max(0, this.column - padding);
                let subLineEnd = Math.max(
                  this.column + padding,
                  this.endColumn + padding
                );
                let subLine = line.slice(subLineStart, subLineEnd);
                let spacing2 = aside(gutter.replace(/\d/g, " ")) + line.slice(0, Math.min(this.column - 1, padding - 1)).replace(/[^\t]/g, " ");
                return mark(">") + aside(gutter) + highlight(subLine) + "\n " + spacing2 + mark("^");
              }
              let spacing = aside(gutter.replace(/\d/g, " ")) + line.slice(0, this.column - 1).replace(/[^\t]/g, " ");
              return mark(">") + aside(gutter) + highlight(line) + "\n " + spacing + mark("^");
            }
            return " " + aside(gutter) + highlight(line);
          }).join("\n");
        }
        toString() {
          let code = this.showSourceCode();
          if (code) {
            code = "\n\n" + code + "\n";
          }
          return this.name + ": " + this.message + code;
        }
      };
      module.exports = CssSyntaxError2;
      CssSyntaxError2.default = CssSyntaxError2;
    }
  });

  // ../node_modules/.pnpm/postcss@8.5.16/node_modules/postcss/lib/stringifier.js
  var require_stringifier = __commonJS({
    "../node_modules/.pnpm/postcss@8.5.16/node_modules/postcss/lib/stringifier.js"(exports, module) {
      "use strict";
      var STYLE_TAG = /(<)(\/?style\b)/gi;
      var COMMENT_OPEN = /(<)(!--)/g;
      function escapeHTMLInCSS(str) {
        if (typeof str !== "string") return str;
        if (!str.includes("<")) return str;
        return str.replace(STYLE_TAG, "\\3c $2").replace(COMMENT_OPEN, "\\3c $2");
      }
      var DEFAULT_RAW = {
        after: "\n",
        beforeClose: "\n",
        beforeComment: "\n",
        beforeDecl: "\n",
        beforeOpen: " ",
        beforeRule: "\n",
        colon: ": ",
        commentLeft: " ",
        commentRight: " ",
        emptyBody: "",
        indent: "    ",
        semicolon: false
      };
      function capitalize(str) {
        return str[0].toUpperCase() + str.slice(1);
      }
      var Stringifier = class {
        constructor(builder) {
          this.builder = builder;
        }
        atrule(node, semicolon) {
          let raws = node.raws;
          let name = "@" + node.name;
          let params = node.params ? this.rawValue(node, "params") : "";
          if (typeof raws.afterName !== "undefined") {
            name += raws.afterName;
          } else if (params) {
            name += " ";
          }
          if (node.nodes) {
            this.block(node, name + params);
          } else {
            let end = (raws.between || "") + (semicolon ? ";" : "");
            this.builder(escapeHTMLInCSS(name + params + end), node);
          }
        }
        beforeAfter(node, detect) {
          let value;
          if (node.type === "decl") {
            value = this.raw(node, null, "beforeDecl");
          } else if (node.type === "comment") {
            value = this.raw(node, null, "beforeComment");
          } else if (detect === "before") {
            value = this.raw(node, null, "beforeRule");
          } else {
            value = this.raw(node, null, "beforeClose");
          }
          let buf = node.parent;
          let depth = 0;
          while (buf && buf.type !== "root") {
            depth += 1;
            buf = buf.parent;
          }
          if (value.includes("\n")) {
            let indent = this.raw(node, null, "indent");
            if (indent.length) {
              for (let step = 0; step < depth; step++) value += indent;
            }
          }
          return value;
        }
        block(node, start) {
          let between = this.raw(node, "between", "beforeOpen");
          this.builder(escapeHTMLInCSS(start + between) + "{", node, "start");
          let after2;
          if (node.nodes && node.nodes.length) {
            this.body(node);
            after2 = this.raw(node, "after");
          } else {
            after2 = this.raw(node, "after", "emptyBody");
          }
          if (after2) this.builder(escapeHTMLInCSS(after2));
          this.builder("}", node, "end");
        }
        body(node) {
          let nodes = node.nodes;
          let last = nodes.length - 1;
          while (last > 0) {
            if (nodes[last].type !== "comment") break;
            last -= 1;
          }
          let semicolon = this.raw(node, "semicolon");
          let isDocument2 = node.type === "document";
          for (let i = 0; i < nodes.length; i++) {
            let child = nodes[i];
            let before2 = this.raw(child, "before");
            if (before2) this.builder(isDocument2 ? before2 : escapeHTMLInCSS(before2));
            this.stringify(child, last !== i || semicolon);
          }
        }
        comment(node) {
          let left = this.raw(node, "left", "commentLeft");
          let right = this.raw(node, "right", "commentRight");
          this.builder(escapeHTMLInCSS("/*" + left + node.text + right + "*/"), node);
        }
        decl(node, semicolon) {
          let raws = node.raws;
          let between = this.raw(node, "between", "colon");
          let string = node.prop + between + this.rawValue(node, "value");
          if (node.important) {
            string += raws.important || " !important";
          }
          if (semicolon) string += ";";
          this.builder(escapeHTMLInCSS(string), node);
        }
        document(node) {
          this.body(node);
        }
        raw(node, own, detect) {
          let value;
          if (!detect) detect = own;
          if (own) {
            value = node.raws[own];
            if (typeof value !== "undefined") return value;
          }
          let parent = node.parent;
          if (detect === "before") {
            if (!parent || parent.type === "root" && parent.first === node) {
              return "";
            }
            if (parent && parent.type === "document") {
              return "";
            }
          }
          if (!parent) return DEFAULT_RAW[detect];
          let root2 = node.root();
          let cache2 = root2.rawCache || (root2.rawCache = {});
          if (typeof cache2[detect] !== "undefined") {
            return cache2[detect];
          }
          if (detect === "before" || detect === "after") {
            return this.beforeAfter(node, detect);
          } else {
            let method = "raw" + capitalize(detect);
            if (this[method]) {
              value = this[method](root2, node);
            } else {
              root2.walk((i) => {
                value = i.raws[own];
                if (typeof value !== "undefined") return false;
              });
            }
          }
          if (typeof value === "undefined") value = DEFAULT_RAW[detect];
          cache2[detect] = value;
          return value;
        }
        rawBeforeClose(root2) {
          let value;
          root2.walk((i) => {
            if (i.nodes && i.nodes.length > 0) {
              if (typeof i.raws.after !== "undefined") {
                value = i.raws.after;
                if (value.includes("\n")) {
                  value = value.replace(/[^\n]+$/, "");
                }
                return false;
              }
            }
          });
          if (value) value = value.replace(/\S/g, "");
          return value;
        }
        rawBeforeComment(root2, node) {
          let value;
          root2.walkComments((i) => {
            if (typeof i.raws.before !== "undefined") {
              value = i.raws.before;
              if (value.includes("\n")) {
                value = value.replace(/[^\n]+$/, "");
              }
              return false;
            }
          });
          if (typeof value === "undefined") {
            value = this.raw(node, null, "beforeDecl");
          } else if (value) {
            value = value.replace(/\S/g, "");
          }
          return value;
        }
        rawBeforeDecl(root2, node) {
          let value;
          root2.walkDecls((i) => {
            if (typeof i.raws.before !== "undefined") {
              value = i.raws.before;
              if (value.includes("\n")) {
                value = value.replace(/[^\n]+$/, "");
              }
              return false;
            }
          });
          if (typeof value === "undefined") {
            value = this.raw(node, null, "beforeRule");
          } else if (value) {
            value = value.replace(/\S/g, "");
          }
          return value;
        }
        rawBeforeOpen(root2) {
          let value;
          root2.walk((i) => {
            if (i.type !== "decl") {
              value = i.raws.between;
              if (typeof value !== "undefined") return false;
            }
          });
          return value;
        }
        rawBeforeRule(root2) {
          let value;
          root2.walk((i) => {
            if (i.nodes && (i.parent !== root2 || root2.first !== i)) {
              if (typeof i.raws.before !== "undefined") {
                value = i.raws.before;
                if (value.includes("\n")) {
                  value = value.replace(/[^\n]+$/, "");
                }
                return false;
              }
            }
          });
          if (value) value = value.replace(/\S/g, "");
          return value;
        }
        rawColon(root2) {
          let value;
          root2.walkDecls((i) => {
            if (typeof i.raws.between !== "undefined") {
              value = i.raws.between.replace(/[^\s:]/g, "");
              return false;
            }
          });
          return value;
        }
        rawEmptyBody(root2) {
          let value;
          root2.walk((i) => {
            if (i.nodes && i.nodes.length === 0) {
              value = i.raws.after;
              if (typeof value !== "undefined") return false;
            }
          });
          return value;
        }
        rawIndent(root2) {
          if (root2.raws.indent) return root2.raws.indent;
          let value;
          root2.walk((i) => {
            let p = i.parent;
            if (p && p !== root2 && p.parent && p.parent === root2) {
              if (typeof i.raws.before !== "undefined") {
                let parts = i.raws.before.split("\n");
                value = parts[parts.length - 1];
                value = value.replace(/\S/g, "");
                return false;
              }
            }
          });
          return value;
        }
        rawSemicolon(root2) {
          let value;
          root2.walk((i) => {
            if (i.nodes && i.nodes.length && i.last.type === "decl") {
              value = i.raws.semicolon;
              if (typeof value !== "undefined") return false;
            }
          });
          return value;
        }
        rawValue(node, prop2) {
          let value = node[prop2];
          let raw = node.raws[prop2];
          if (raw && raw.value === value) {
            return raw.raw;
          }
          return value;
        }
        root(node) {
          this.body(node);
          if (node.raws.after) {
            let after2 = node.raws.after;
            let isDocument2 = node.parent && node.parent.type === "document";
            this.builder(isDocument2 ? after2 : escapeHTMLInCSS(after2));
          }
        }
        rule(node) {
          this.block(node, this.rawValue(node, "selector"));
          if (node.raws.ownSemicolon) {
            this.builder(escapeHTMLInCSS(node.raws.ownSemicolon), node, "end");
          }
        }
        stringify(node, semicolon) {
          if (!this[node.type]) {
            throw new Error(
              "Unknown AST node type " + node.type + ". Maybe you need to change PostCSS stringifier."
            );
          }
          this[node.type](node, semicolon);
        }
      };
      module.exports = Stringifier;
      Stringifier.default = Stringifier;
    }
  });

  // ../node_modules/.pnpm/postcss@8.5.16/node_modules/postcss/lib/stringify.js
  var require_stringify = __commonJS({
    "../node_modules/.pnpm/postcss@8.5.16/node_modules/postcss/lib/stringify.js"(exports, module) {
      "use strict";
      var Stringifier = require_stringifier();
      function stringify2(node, builder) {
        let str = new Stringifier(builder);
        str.stringify(node);
      }
      module.exports = stringify2;
      stringify2.default = stringify2;
    }
  });

  // ../node_modules/.pnpm/postcss@8.5.16/node_modules/postcss/lib/symbols.js
  var require_symbols = __commonJS({
    "../node_modules/.pnpm/postcss@8.5.16/node_modules/postcss/lib/symbols.js"(exports, module) {
      "use strict";
      module.exports.isClean = /* @__PURE__ */ Symbol("isClean");
      module.exports.my = /* @__PURE__ */ Symbol("my");
    }
  });

  // ../node_modules/.pnpm/postcss@8.5.16/node_modules/postcss/lib/node.js
  var require_node = __commonJS({
    "../node_modules/.pnpm/postcss@8.5.16/node_modules/postcss/lib/node.js"(exports, module) {
      "use strict";
      var CssSyntaxError2 = require_css_syntax_error();
      var Stringifier = require_stringifier();
      var stringify2 = require_stringify();
      var { isClean, my } = require_symbols();
      function cloneNode2(obj, parent) {
        let cloned = new obj.constructor();
        for (let i in obj) {
          if (!Object.prototype.hasOwnProperty.call(obj, i)) {
            continue;
          }
          if (i === "proxyCache") continue;
          let value = obj[i];
          let type = typeof value;
          if (i === "parent" && type === "object") {
            if (parent) cloned[i] = parent;
          } else if (i === "source") {
            cloned[i] = value;
          } else if (Array.isArray(value)) {
            cloned[i] = value.map((j) => cloneNode2(j, cloned));
          } else {
            if (type === "object" && value !== null) value = cloneNode2(value);
            cloned[i] = value;
          }
        }
        return cloned;
      }
      function sourceOffset(inputCSS, position) {
        if (position && typeof position.offset !== "undefined") {
          return position.offset;
        }
        let column = 1;
        let line = 1;
        let offset = 0;
        for (let i = 0; i < inputCSS.length; i++) {
          if (line === position.line && column === position.column) {
            offset = i;
            break;
          }
          if (inputCSS[i] === "\n") {
            column = 1;
            line += 1;
          } else {
            column += 1;
          }
        }
        return offset;
      }
      var Node5 = class {
        get proxyOf() {
          return this;
        }
        constructor(defaults = {}) {
          this.raws = {};
          this[isClean] = false;
          this[my] = true;
          for (let name in defaults) {
            if (name === "nodes") {
              this.nodes = [];
              for (let node of defaults[name]) {
                if (typeof node.clone === "function" && node.parent) {
                  this.append(node.clone());
                } else {
                  this.append(node);
                }
              }
            } else {
              this[name] = defaults[name];
            }
          }
        }
        addToError(error) {
          error.postcssNode = this;
          if (error.stack && this.source && /\n\s{4}at /.test(error.stack)) {
            let s = this.source;
            error.stack = error.stack.replace(
              /\n\s{4}at /,
              `$&${s.input.from}:${s.start.line}:${s.start.column}$&`
            );
          }
          return error;
        }
        after(add2) {
          this.parent.insertAfter(this, add2);
          return this;
        }
        assign(overrides = {}) {
          for (let name in overrides) {
            this[name] = overrides[name];
          }
          return this;
        }
        before(add2) {
          this.parent.insertBefore(this, add2);
          return this;
        }
        cleanRaws(keepBetween) {
          delete this.raws.before;
          delete this.raws.after;
          if (!keepBetween) delete this.raws.between;
        }
        clone(overrides = {}) {
          let cloned = cloneNode2(this);
          for (let name in overrides) {
            cloned[name] = overrides[name];
          }
          return cloned;
        }
        cloneAfter(overrides = {}) {
          let cloned = this.clone(overrides);
          this.parent.insertAfter(this, cloned);
          return cloned;
        }
        cloneBefore(overrides = {}) {
          let cloned = this.clone(overrides);
          this.parent.insertBefore(this, cloned);
          return cloned;
        }
        error(message, opts = {}) {
          if (this.source) {
            let { end, start } = this.rangeBy(opts);
            return this.source.input.error(
              message,
              { column: start.column, line: start.line },
              { column: end.column, line: end.line },
              opts
            );
          }
          return new CssSyntaxError2(message);
        }
        getProxyProcessor() {
          return {
            get(node, prop2) {
              if (prop2 === "proxyOf") {
                return node;
              } else if (prop2 === "root") {
                return () => node.root().toProxy();
              } else {
                return node[prop2];
              }
            },
            set(node, prop2, value) {
              if (node[prop2] === value) return true;
              node[prop2] = value;
              if (prop2 === "prop" || prop2 === "value" || prop2 === "name" || prop2 === "params" || prop2 === "important" || /* c8 ignore next */
              prop2 === "text") {
                node.markDirty();
              }
              return true;
            }
          };
        }
        /* c8 ignore next 3 */
        markClean() {
          this[isClean] = true;
        }
        markDirty() {
          if (this[isClean]) {
            this[isClean] = false;
            let next = this;
            while (next = next.parent) {
              next[isClean] = false;
            }
          }
        }
        next() {
          if (!this.parent) return void 0;
          let index = this.parent.index(this);
          return this.parent.nodes[index + 1];
        }
        positionBy(opts = {}) {
          let inputString = "document" in this.source.input ? this.source.input.document : this.source.input.css;
          let pos = {
            column: this.source.start.column,
            line: this.source.start.line,
            offset: sourceOffset(inputString, this.source.start)
          };
          if (opts.index) {
            pos = this.positionInside(opts.index);
          } else if (opts.word) {
            let stringRepresentation = inputString.slice(
              sourceOffset(inputString, this.source.start),
              sourceOffset(inputString, this.source.end)
            );
            let index = stringRepresentation.indexOf(opts.word);
            if (index !== -1) pos = this.positionInside(index);
          }
          return pos;
        }
        positionInside(index) {
          let column = this.source.start.column;
          let line = this.source.start.line;
          let inputString = "document" in this.source.input ? this.source.input.document : this.source.input.css;
          let offset = sourceOffset(inputString, this.source.start);
          let end = offset + index;
          for (let i = offset; i < end; i++) {
            if (inputString[i] === "\n") {
              column = 1;
              line += 1;
            } else {
              column += 1;
            }
          }
          return { column, line, offset: end };
        }
        prev() {
          if (!this.parent) return void 0;
          let index = this.parent.index(this);
          return this.parent.nodes[index - 1];
        }
        rangeBy(opts = {}) {
          let inputString = "document" in this.source.input ? this.source.input.document : this.source.input.css;
          let start = {
            column: this.source.start.column,
            line: this.source.start.line,
            offset: sourceOffset(inputString, this.source.start)
          };
          let end = this.source.end ? {
            column: this.source.end.column + 1,
            line: this.source.end.line,
            offset: typeof this.source.end.offset === "number" ? (
              // `source.end.offset` is exclusive, so we don't need to add 1
              this.source.end.offset
            ) : (
              // Since line/column in this.source.end is inclusive,
              // the `sourceOffset(... , this.source.end)` returns an inclusive offset.
              // So, we add 1 to convert it to exclusive.
              sourceOffset(inputString, this.source.end) + 1
            )
          } : {
            column: start.column + 1,
            line: start.line,
            offset: start.offset + 1
          };
          if (opts.word) {
            let stringRepresentation = inputString.slice(
              sourceOffset(inputString, this.source.start),
              sourceOffset(inputString, this.source.end)
            );
            let index = stringRepresentation.indexOf(opts.word);
            if (index !== -1) {
              start = this.positionInside(index);
              end = this.positionInside(index + opts.word.length);
            }
          } else {
            if (opts.start) {
              start = {
                column: opts.start.column,
                line: opts.start.line,
                offset: sourceOffset(inputString, opts.start)
              };
            } else if (typeof opts.index === "number") {
              start = this.positionInside(opts.index);
            }
            if (opts.end) {
              end = {
                column: opts.end.column,
                line: opts.end.line,
                offset: sourceOffset(inputString, opts.end)
              };
            } else if (typeof opts.endIndex === "number") {
              end = this.positionInside(opts.endIndex);
            } else if (typeof opts.index === "number") {
              end = this.positionInside(opts.index + 1);
            }
          }
          if (end.line < start.line || end.line === start.line && end.column <= start.column) {
            end = {
              column: start.column + 1,
              line: start.line,
              offset: start.offset + 1
            };
          }
          return { end, start };
        }
        raw(prop2, defaultType) {
          let str = new Stringifier();
          return str.raw(this, prop2, defaultType);
        }
        remove() {
          if (this.parent) {
            this.parent.removeChild(this);
          }
          this.parent = void 0;
          return this;
        }
        replaceWith(...nodes) {
          if (this.parent) {
            let bookmark = this;
            let foundSelf = false;
            for (let node of nodes) {
              if (node === this) {
                foundSelf = true;
              } else if (foundSelf) {
                this.parent.insertAfter(bookmark, node);
                bookmark = node;
              } else {
                this.parent.insertBefore(bookmark, node);
              }
            }
            if (!foundSelf) {
              this.remove();
            }
          }
          return this;
        }
        root() {
          let result = this;
          while (result.parent && result.parent.type !== "document") {
            result = result.parent;
          }
          return result;
        }
        toJSON(_, inputs) {
          let fixed = {};
          let emitInputs = inputs == null;
          inputs = inputs || /* @__PURE__ */ new Map();
          let inputsNextIndex = 0;
          for (let name in this) {
            if (!Object.prototype.hasOwnProperty.call(this, name)) {
              continue;
            }
            if (name === "parent" || name === "proxyCache") continue;
            let value = this[name];
            if (Array.isArray(value)) {
              fixed[name] = value.map((i) => {
                if (typeof i === "object" && i.toJSON) {
                  return i.toJSON(null, inputs);
                } else {
                  return i;
                }
              });
            } else if (typeof value === "object" && value.toJSON) {
              fixed[name] = value.toJSON(null, inputs);
            } else if (name === "source") {
              if (value == null) continue;
              let inputId = inputs.get(value.input);
              if (inputId == null) {
                inputId = inputsNextIndex;
                inputs.set(value.input, inputsNextIndex);
                inputsNextIndex++;
              }
              fixed[name] = {
                end: value.end,
                inputId,
                start: value.start
              };
            } else {
              fixed[name] = value;
            }
          }
          if (emitInputs) {
            fixed.inputs = [...inputs.keys()].map((input) => input.toJSON());
          }
          return fixed;
        }
        toProxy() {
          if (!this.proxyCache) {
            this.proxyCache = new Proxy(this, this.getProxyProcessor());
          }
          return this.proxyCache;
        }
        toString(stringifier = stringify2) {
          if (stringifier.stringify) stringifier = stringifier.stringify;
          let result = "";
          stringifier(this, (i) => {
            result += i;
          });
          return result;
        }
        warn(result, text, opts = {}) {
          let data = { node: this };
          for (let i in opts) data[i] = opts[i];
          return result.warn(text, data);
        }
      };
      module.exports = Node5;
      Node5.default = Node5;
    }
  });

  // ../node_modules/.pnpm/postcss@8.5.16/node_modules/postcss/lib/comment.js
  var require_comment = __commonJS({
    "../node_modules/.pnpm/postcss@8.5.16/node_modules/postcss/lib/comment.js"(exports, module) {
      "use strict";
      var Node5 = require_node();
      var Comment6 = class extends Node5 {
        constructor(defaults) {
          super(defaults);
          this.type = "comment";
        }
      };
      module.exports = Comment6;
      Comment6.default = Comment6;
    }
  });

  // ../node_modules/.pnpm/postcss@8.5.16/node_modules/postcss/lib/declaration.js
  var require_declaration = __commonJS({
    "../node_modules/.pnpm/postcss@8.5.16/node_modules/postcss/lib/declaration.js"(exports, module) {
      "use strict";
      var Node5 = require_node();
      var Declaration2 = class extends Node5 {
        get variable() {
          return this.prop.startsWith("--") || this.prop[0] === "$";
        }
        constructor(defaults) {
          if (defaults && typeof defaults.value !== "undefined" && typeof defaults.value !== "string") {
            defaults = { ...defaults, value: String(defaults.value) };
          }
          super(defaults);
          this.type = "decl";
        }
      };
      module.exports = Declaration2;
      Declaration2.default = Declaration2;
    }
  });

  // ../node_modules/.pnpm/postcss@8.5.16/node_modules/postcss/lib/container.js
  var require_container = __commonJS({
    "../node_modules/.pnpm/postcss@8.5.16/node_modules/postcss/lib/container.js"(exports, module) {
      "use strict";
      var Comment6 = require_comment();
      var Declaration2 = require_declaration();
      var Node5 = require_node();
      var { isClean, my } = require_symbols();
      var AtRule2;
      var parse6;
      var Root3;
      var Rule2;
      function cleanSource(nodes) {
        return nodes.map((i) => {
          if (i.nodes) i.nodes = cleanSource(i.nodes);
          delete i.source;
          return i;
        });
      }
      function markTreeDirty(node) {
        node[isClean] = false;
        if (node.proxyOf.nodes) {
          for (let i of node.proxyOf.nodes) {
            markTreeDirty(i);
          }
        }
      }
      var Container2 = class _Container extends Node5 {
        get first() {
          if (!this.proxyOf.nodes) return void 0;
          return this.proxyOf.nodes[0];
        }
        get last() {
          if (!this.proxyOf.nodes) return void 0;
          return this.proxyOf.nodes[this.proxyOf.nodes.length - 1];
        }
        append(...children) {
          for (let child of children) {
            let nodes = this.normalize(child, this.last);
            for (let node of nodes) this.proxyOf.nodes.push(node);
          }
          this.markDirty();
          return this;
        }
        cleanRaws(keepBetween) {
          super.cleanRaws(keepBetween);
          if (this.nodes) {
            for (let node of this.nodes) node.cleanRaws(keepBetween);
          }
        }
        each(callback) {
          if (!this.proxyOf.nodes) return void 0;
          let iterator = this.getIterator();
          let index, result;
          while (this.indexes[iterator] < this.proxyOf.nodes.length) {
            index = this.indexes[iterator];
            result = callback(this.proxyOf.nodes[index], index);
            if (result === false) break;
            this.indexes[iterator] += 1;
          }
          delete this.indexes[iterator];
          return result;
        }
        every(condition) {
          return this.nodes.every(condition);
        }
        getIterator() {
          if (!this.lastEach) this.lastEach = 0;
          if (!this.indexes) this.indexes = {};
          this.lastEach += 1;
          let iterator = this.lastEach;
          this.indexes[iterator] = 0;
          return iterator;
        }
        getProxyProcessor() {
          return {
            get(node, prop2) {
              if (prop2 === "proxyOf") {
                return node;
              } else if (!node[prop2]) {
                return node[prop2];
              } else if (prop2 === "each" || typeof prop2 === "string" && prop2.startsWith("walk")) {
                return (...args) => {
                  return node[prop2](
                    ...args.map((i) => {
                      if (typeof i === "function") {
                        return (child, index) => i(child.toProxy(), index);
                      } else {
                        return i;
                      }
                    })
                  );
                };
              } else if (prop2 === "every" || prop2 === "some") {
                return (cb) => {
                  return node[prop2](
                    (child, ...other) => cb(child.toProxy(), ...other)
                  );
                };
              } else if (prop2 === "root") {
                return () => node.root().toProxy();
              } else if (prop2 === "nodes") {
                return node.nodes.map((i) => i.toProxy());
              } else if (prop2 === "first" || prop2 === "last") {
                return node[prop2].toProxy();
              } else {
                return node[prop2];
              }
            },
            set(node, prop2, value) {
              if (node[prop2] === value) return true;
              node[prop2] = value;
              if (prop2 === "name" || prop2 === "params" || prop2 === "selector") {
                node.markDirty();
              }
              return true;
            }
          };
        }
        index(child) {
          if (typeof child === "number") return child;
          if (child.proxyOf) child = child.proxyOf;
          return this.proxyOf.nodes.indexOf(child);
        }
        insertAfter(exist, add2) {
          let existIndex = this.index(exist);
          let nodes = this.normalize(add2, this.proxyOf.nodes[existIndex]).reverse();
          existIndex = this.index(exist);
          for (let node of nodes) this.proxyOf.nodes.splice(existIndex + 1, 0, node);
          let index;
          for (let id in this.indexes) {
            index = this.indexes[id];
            if (existIndex < index) {
              this.indexes[id] = index + nodes.length;
            }
          }
          this.markDirty();
          return this;
        }
        insertBefore(exist, add2) {
          let existIndex = this.index(exist);
          let type = existIndex === 0 ? "prepend" : false;
          let nodes = this.normalize(
            add2,
            this.proxyOf.nodes[existIndex],
            type
          ).reverse();
          existIndex = this.index(exist);
          for (let node of nodes) this.proxyOf.nodes.splice(existIndex, 0, node);
          let index;
          for (let id in this.indexes) {
            index = this.indexes[id];
            if (existIndex <= index) {
              this.indexes[id] = index + nodes.length;
            }
          }
          this.markDirty();
          return this;
        }
        normalize(nodes, sample) {
          if (typeof nodes === "string") {
            nodes = cleanSource(parse6(nodes).nodes);
          } else if (typeof nodes === "undefined") {
            nodes = [];
          } else if (Array.isArray(nodes)) {
            nodes = nodes.slice(0);
            for (let i of nodes) {
              if (i.parent) i.parent.removeChild(i, "ignore");
            }
          } else if (nodes.type === "root" && this.type !== "document") {
            nodes = nodes.nodes.slice(0);
            for (let i of nodes) {
              if (i.parent) i.parent.removeChild(i, "ignore");
            }
          } else if (nodes.type) {
            nodes = [nodes];
          } else if (nodes.prop) {
            if (typeof nodes.value === "undefined") {
              throw new Error("Value field is missed in node creation");
            } else if (typeof nodes.value !== "string") {
              nodes.value = String(nodes.value);
            }
            nodes = [new Declaration2(nodes)];
          } else if (nodes.selector || nodes.selectors) {
            nodes = [new Rule2(nodes)];
          } else if (nodes.name) {
            nodes = [new AtRule2(nodes)];
          } else if (nodes.text) {
            nodes = [new Comment6(nodes)];
          } else {
            throw new Error("Unknown node type in node creation");
          }
          let processed = nodes.map((i) => {
            if (!i[my]) _Container.rebuild(i);
            i = i.proxyOf;
            if (i.parent) i.parent.removeChild(i);
            if (i[isClean]) markTreeDirty(i);
            if (!i.raws) i.raws = {};
            if (typeof i.raws.before === "undefined") {
              if (sample && typeof sample.raws.before !== "undefined") {
                i.raws.before = sample.raws.before.replace(/\S/g, "");
              }
            }
            i.parent = this.proxyOf;
            return i;
          });
          return processed;
        }
        prepend(...children) {
          children = children.reverse();
          for (let child of children) {
            let nodes = this.normalize(child, this.first, "prepend").reverse();
            for (let node of nodes) this.proxyOf.nodes.unshift(node);
            for (let id in this.indexes) {
              this.indexes[id] = this.indexes[id] + nodes.length;
            }
          }
          this.markDirty();
          return this;
        }
        push(child) {
          child.parent = this;
          this.proxyOf.nodes.push(child);
          return this;
        }
        removeAll() {
          for (let node of this.proxyOf.nodes) node.parent = void 0;
          this.proxyOf.nodes = [];
          this.markDirty();
          return this;
        }
        removeChild(child) {
          child = this.index(child);
          this.proxyOf.nodes[child].parent = void 0;
          this.proxyOf.nodes.splice(child, 1);
          let index;
          for (let id in this.indexes) {
            index = this.indexes[id];
            if (index >= child) {
              this.indexes[id] = index - 1;
            }
          }
          this.markDirty();
          return this;
        }
        replaceValues(pattern, opts, callback) {
          if (!callback) {
            callback = opts;
            opts = {};
          }
          this.walkDecls((decl2) => {
            if (opts.props && !opts.props.includes(decl2.prop)) return;
            if (opts.fast && !decl2.value.includes(opts.fast)) return;
            decl2.value = decl2.value.replace(pattern, callback);
          });
          this.markDirty();
          return this;
        }
        some(condition) {
          return this.nodes.some(condition);
        }
        walk(callback) {
          return this.each((child, i) => {
            let result;
            try {
              result = callback(child, i);
            } catch (e) {
              throw child.addToError(e);
            }
            if (result !== false && child.walk) {
              result = child.walk(callback);
            }
            return result;
          });
        }
        walkAtRules(name, callback) {
          if (!callback) {
            callback = name;
            return this.walk((child, i) => {
              if (child.type === "atrule") {
                return callback(child, i);
              }
            });
          }
          if (name instanceof RegExp) {
            return this.walk((child, i) => {
              if (child.type === "atrule" && name.test(child.name)) {
                return callback(child, i);
              }
            });
          }
          return this.walk((child, i) => {
            if (child.type === "atrule" && child.name === name) {
              return callback(child, i);
            }
          });
        }
        walkComments(callback) {
          return this.walk((child, i) => {
            if (child.type === "comment") {
              return callback(child, i);
            }
          });
        }
        walkDecls(prop2, callback) {
          if (!callback) {
            callback = prop2;
            return this.walk((child, i) => {
              if (child.type === "decl") {
                return callback(child, i);
              }
            });
          }
          if (prop2 instanceof RegExp) {
            return this.walk((child, i) => {
              if (child.type === "decl" && prop2.test(child.prop)) {
                return callback(child, i);
              }
            });
          }
          return this.walk((child, i) => {
            if (child.type === "decl" && child.prop === prop2) {
              return callback(child, i);
            }
          });
        }
        walkRules(selector, callback) {
          if (!callback) {
            callback = selector;
            return this.walk((child, i) => {
              if (child.type === "rule") {
                return callback(child, i);
              }
            });
          }
          if (selector instanceof RegExp) {
            return this.walk((child, i) => {
              if (child.type === "rule" && selector.test(child.selector)) {
                return callback(child, i);
              }
            });
          }
          return this.walk((child, i) => {
            if (child.type === "rule" && child.selector === selector) {
              return callback(child, i);
            }
          });
        }
      };
      Container2.registerParse = (dependant) => {
        parse6 = dependant;
      };
      Container2.registerRule = (dependant) => {
        Rule2 = dependant;
      };
      Container2.registerAtRule = (dependant) => {
        AtRule2 = dependant;
      };
      Container2.registerRoot = (dependant) => {
        Root3 = dependant;
      };
      module.exports = Container2;
      Container2.default = Container2;
      Container2.rebuild = (node) => {
        if (node.type === "atrule") {
          Object.setPrototypeOf(node, AtRule2.prototype);
        } else if (node.type === "rule") {
          Object.setPrototypeOf(node, Rule2.prototype);
        } else if (node.type === "decl") {
          Object.setPrototypeOf(node, Declaration2.prototype);
        } else if (node.type === "comment") {
          Object.setPrototypeOf(node, Comment6.prototype);
        } else if (node.type === "root") {
          Object.setPrototypeOf(node, Root3.prototype);
        }
        node[my] = true;
        if (node.nodes) {
          node.nodes.forEach((child) => {
            Container2.rebuild(child);
          });
        }
      };
    }
  });

  // ../node_modules/.pnpm/postcss@8.5.16/node_modules/postcss/lib/at-rule.js
  var require_at_rule = __commonJS({
    "../node_modules/.pnpm/postcss@8.5.16/node_modules/postcss/lib/at-rule.js"(exports, module) {
      "use strict";
      var Container2 = require_container();
      var AtRule2 = class extends Container2 {
        constructor(defaults) {
          super(defaults);
          this.type = "atrule";
        }
        append(...children) {
          if (!this.proxyOf.nodes) this.nodes = [];
          return super.append(...children);
        }
        prepend(...children) {
          if (!this.proxyOf.nodes) this.nodes = [];
          return super.prepend(...children);
        }
      };
      module.exports = AtRule2;
      AtRule2.default = AtRule2;
      Container2.registerAtRule(AtRule2);
    }
  });

  // ../node_modules/.pnpm/postcss@8.5.16/node_modules/postcss/lib/document.js
  var require_document = __commonJS({
    "../node_modules/.pnpm/postcss@8.5.16/node_modules/postcss/lib/document.js"(exports, module) {
      "use strict";
      var Container2 = require_container();
      var LazyResult;
      var Processor2;
      var Document6 = class extends Container2 {
        constructor(defaults) {
          super({ type: "document", ...defaults });
          if (!this.nodes) {
            this.nodes = [];
          }
        }
        toResult(opts = {}) {
          let lazy = new LazyResult(new Processor2(), this, opts);
          return lazy.stringify();
        }
      };
      Document6.registerLazyResult = (dependant) => {
        LazyResult = dependant;
      };
      Document6.registerProcessor = (dependant) => {
        Processor2 = dependant;
      };
      module.exports = Document6;
      Document6.default = Document6;
    }
  });

  // ../node_modules/.pnpm/nanoid@3.3.15/node_modules/nanoid/non-secure/index.cjs
  var require_non_secure = __commonJS({
    "../node_modules/.pnpm/nanoid@3.3.15/node_modules/nanoid/non-secure/index.cjs"(exports, module) {
      var urlAlphabet = "useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict";
      var customAlphabet = (alphabet, defaultSize = 21) => {
        return (size = defaultSize) => {
          let id = "";
          let i = size | 0;
          while (i--) {
            id += alphabet[Math.random() * alphabet.length | 0];
          }
          return id;
        };
      };
      var nanoid = (size = 21) => {
        let id = "";
        let i = size | 0;
        while (i--) {
          id += urlAlphabet[Math.random() * 64 | 0];
        }
        return id;
      };
      module.exports = { nanoid, customAlphabet };
    }
  });

  // ../node_modules/.pnpm/source-map-js@1.2.1/node_modules/source-map-js/lib/base64.js
  var require_base64 = __commonJS({
    "../node_modules/.pnpm/source-map-js@1.2.1/node_modules/source-map-js/lib/base64.js"(exports) {
      var intToCharMap = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".split("");
      exports.encode = function(number) {
        if (0 <= number && number < intToCharMap.length) {
          return intToCharMap[number];
        }
        throw new TypeError("Must be between 0 and 63: " + number);
      };
      exports.decode = function(charCode) {
        var bigA = 65;
        var bigZ = 90;
        var littleA = 97;
        var littleZ = 122;
        var zero = 48;
        var nine = 57;
        var plus = 43;
        var slash = 47;
        var littleOffset = 26;
        var numberOffset = 52;
        if (bigA <= charCode && charCode <= bigZ) {
          return charCode - bigA;
        }
        if (littleA <= charCode && charCode <= littleZ) {
          return charCode - littleA + littleOffset;
        }
        if (zero <= charCode && charCode <= nine) {
          return charCode - zero + numberOffset;
        }
        if (charCode == plus) {
          return 62;
        }
        if (charCode == slash) {
          return 63;
        }
        return -1;
      };
    }
  });

  // ../node_modules/.pnpm/source-map-js@1.2.1/node_modules/source-map-js/lib/base64-vlq.js
  var require_base64_vlq = __commonJS({
    "../node_modules/.pnpm/source-map-js@1.2.1/node_modules/source-map-js/lib/base64-vlq.js"(exports) {
      var base64 = require_base64();
      var VLQ_BASE_SHIFT = 5;
      var VLQ_BASE = 1 << VLQ_BASE_SHIFT;
      var VLQ_BASE_MASK = VLQ_BASE - 1;
      var VLQ_CONTINUATION_BIT = VLQ_BASE;
      function toVLQSigned(aValue) {
        return aValue < 0 ? (-aValue << 1) + 1 : (aValue << 1) + 0;
      }
      function fromVLQSigned(aValue) {
        var isNegative = (aValue & 1) === 1;
        var shifted = aValue >> 1;
        return isNegative ? -shifted : shifted;
      }
      exports.encode = function base64VLQ_encode(aValue) {
        var encoded = "";
        var digit;
        var vlq = toVLQSigned(aValue);
        do {
          digit = vlq & VLQ_BASE_MASK;
          vlq >>>= VLQ_BASE_SHIFT;
          if (vlq > 0) {
            digit |= VLQ_CONTINUATION_BIT;
          }
          encoded += base64.encode(digit);
        } while (vlq > 0);
        return encoded;
      };
      exports.decode = function base64VLQ_decode(aStr, aIndex, aOutParam) {
        var strLen = aStr.length;
        var result = 0;
        var shift = 0;
        var continuation, digit;
        do {
          if (aIndex >= strLen) {
            throw new Error("Expected more digits in base 64 VLQ value.");
          }
          digit = base64.decode(aStr.charCodeAt(aIndex++));
          if (digit === -1) {
            throw new Error("Invalid base64 digit: " + aStr.charAt(aIndex - 1));
          }
          continuation = !!(digit & VLQ_CONTINUATION_BIT);
          digit &= VLQ_BASE_MASK;
          result = result + (digit << shift);
          shift += VLQ_BASE_SHIFT;
        } while (continuation);
        aOutParam.value = fromVLQSigned(result);
        aOutParam.rest = aIndex;
      };
    }
  });

  // ../node_modules/.pnpm/source-map-js@1.2.1/node_modules/source-map-js/lib/util.js
  var require_util = __commonJS({
    "../node_modules/.pnpm/source-map-js@1.2.1/node_modules/source-map-js/lib/util.js"(exports) {
      function getArg(aArgs, aName, aDefaultValue) {
        if (aName in aArgs) {
          return aArgs[aName];
        } else if (arguments.length === 3) {
          return aDefaultValue;
        } else {
          throw new Error('"' + aName + '" is a required argument.');
        }
      }
      exports.getArg = getArg;
      var urlRegexp = /^(?:([\w+\-.]+):)?\/\/(?:(\w+:\w+)@)?([\w.-]*)(?::(\d+))?(.*)$/;
      var dataUrlRegexp = /^data:.+\,.+$/;
      function urlParse(aUrl) {
        var match = aUrl.match(urlRegexp);
        if (!match) {
          return null;
        }
        return {
          scheme: match[1],
          auth: match[2],
          host: match[3],
          port: match[4],
          path: match[5]
        };
      }
      exports.urlParse = urlParse;
      function urlGenerate(aParsedUrl) {
        var url = "";
        if (aParsedUrl.scheme) {
          url += aParsedUrl.scheme + ":";
        }
        url += "//";
        if (aParsedUrl.auth) {
          url += aParsedUrl.auth + "@";
        }
        if (aParsedUrl.host) {
          url += aParsedUrl.host;
        }
        if (aParsedUrl.port) {
          url += ":" + aParsedUrl.port;
        }
        if (aParsedUrl.path) {
          url += aParsedUrl.path;
        }
        return url;
      }
      exports.urlGenerate = urlGenerate;
      var MAX_CACHED_INPUTS = 32;
      function lruMemoize(f) {
        var cache2 = [];
        return function(input) {
          for (var i = 0; i < cache2.length; i++) {
            if (cache2[i].input === input) {
              var temp = cache2[0];
              cache2[0] = cache2[i];
              cache2[i] = temp;
              return cache2[0].result;
            }
          }
          var result = f(input);
          cache2.unshift({
            input,
            result
          });
          if (cache2.length > MAX_CACHED_INPUTS) {
            cache2.pop();
          }
          return result;
        };
      }
      var normalize = lruMemoize(function normalize2(aPath) {
        var path = aPath;
        var url = urlParse(aPath);
        if (url) {
          if (!url.path) {
            return aPath;
          }
          path = url.path;
        }
        var isAbsolute = exports.isAbsolute(path);
        var parts = [];
        var start = 0;
        var i = 0;
        while (true) {
          start = i;
          i = path.indexOf("/", start);
          if (i === -1) {
            parts.push(path.slice(start));
            break;
          } else {
            parts.push(path.slice(start, i));
            while (i < path.length && path[i] === "/") {
              i++;
            }
          }
        }
        for (var part, up = 0, i = parts.length - 1; i >= 0; i--) {
          part = parts[i];
          if (part === ".") {
            parts.splice(i, 1);
          } else if (part === "..") {
            up++;
          } else if (up > 0) {
            if (part === "") {
              parts.splice(i + 1, up);
              up = 0;
            } else {
              parts.splice(i, 2);
              up--;
            }
          }
        }
        path = parts.join("/");
        if (path === "") {
          path = isAbsolute ? "/" : ".";
        }
        if (url) {
          url.path = path;
          return urlGenerate(url);
        }
        return path;
      });
      exports.normalize = normalize;
      function join(aRoot, aPath) {
        if (aRoot === "") {
          aRoot = ".";
        }
        if (aPath === "") {
          aPath = ".";
        }
        var aPathUrl = urlParse(aPath);
        var aRootUrl = urlParse(aRoot);
        if (aRootUrl) {
          aRoot = aRootUrl.path || "/";
        }
        if (aPathUrl && !aPathUrl.scheme) {
          if (aRootUrl) {
            aPathUrl.scheme = aRootUrl.scheme;
          }
          return urlGenerate(aPathUrl);
        }
        if (aPathUrl || aPath.match(dataUrlRegexp)) {
          return aPath;
        }
        if (aRootUrl && !aRootUrl.host && !aRootUrl.path) {
          aRootUrl.host = aPath;
          return urlGenerate(aRootUrl);
        }
        var joined = aPath.charAt(0) === "/" ? aPath : normalize(aRoot.replace(/\/+$/, "") + "/" + aPath);
        if (aRootUrl) {
          aRootUrl.path = joined;
          return urlGenerate(aRootUrl);
        }
        return joined;
      }
      exports.join = join;
      exports.isAbsolute = function(aPath) {
        return aPath.charAt(0) === "/" || urlRegexp.test(aPath);
      };
      function relative(aRoot, aPath) {
        if (aRoot === "") {
          aRoot = ".";
        }
        aRoot = aRoot.replace(/\/$/, "");
        var level = 0;
        while (aPath.indexOf(aRoot + "/") !== 0) {
          var index = aRoot.lastIndexOf("/");
          if (index < 0) {
            return aPath;
          }
          aRoot = aRoot.slice(0, index);
          if (aRoot.match(/^([^\/]+:\/)?\/*$/)) {
            return aPath;
          }
          ++level;
        }
        return Array(level + 1).join("../") + aPath.substr(aRoot.length + 1);
      }
      exports.relative = relative;
      var supportsNullProto = (function() {
        var obj = /* @__PURE__ */ Object.create(null);
        return !("__proto__" in obj);
      })();
      function identity(s) {
        return s;
      }
      function toSetString(aStr) {
        if (isProtoString(aStr)) {
          return "$" + aStr;
        }
        return aStr;
      }
      exports.toSetString = supportsNullProto ? identity : toSetString;
      function fromSetString(aStr) {
        if (isProtoString(aStr)) {
          return aStr.slice(1);
        }
        return aStr;
      }
      exports.fromSetString = supportsNullProto ? identity : fromSetString;
      function isProtoString(s) {
        if (!s) {
          return false;
        }
        var length = s.length;
        if (length < 9) {
          return false;
        }
        if (s.charCodeAt(length - 1) !== 95 || s.charCodeAt(length - 2) !== 95 || s.charCodeAt(length - 3) !== 111 || s.charCodeAt(length - 4) !== 116 || s.charCodeAt(length - 5) !== 111 || s.charCodeAt(length - 6) !== 114 || s.charCodeAt(length - 7) !== 112 || s.charCodeAt(length - 8) !== 95 || s.charCodeAt(length - 9) !== 95) {
          return false;
        }
        for (var i = length - 10; i >= 0; i--) {
          if (s.charCodeAt(i) !== 36) {
            return false;
          }
        }
        return true;
      }
      function compareByOriginalPositions(mappingA, mappingB, onlyCompareOriginal) {
        var cmp = strcmp(mappingA.source, mappingB.source);
        if (cmp !== 0) {
          return cmp;
        }
        cmp = mappingA.originalLine - mappingB.originalLine;
        if (cmp !== 0) {
          return cmp;
        }
        cmp = mappingA.originalColumn - mappingB.originalColumn;
        if (cmp !== 0 || onlyCompareOriginal) {
          return cmp;
        }
        cmp = mappingA.generatedColumn - mappingB.generatedColumn;
        if (cmp !== 0) {
          return cmp;
        }
        cmp = mappingA.generatedLine - mappingB.generatedLine;
        if (cmp !== 0) {
          return cmp;
        }
        return strcmp(mappingA.name, mappingB.name);
      }
      exports.compareByOriginalPositions = compareByOriginalPositions;
      function compareByOriginalPositionsNoSource(mappingA, mappingB, onlyCompareOriginal) {
        var cmp;
        cmp = mappingA.originalLine - mappingB.originalLine;
        if (cmp !== 0) {
          return cmp;
        }
        cmp = mappingA.originalColumn - mappingB.originalColumn;
        if (cmp !== 0 || onlyCompareOriginal) {
          return cmp;
        }
        cmp = mappingA.generatedColumn - mappingB.generatedColumn;
        if (cmp !== 0) {
          return cmp;
        }
        cmp = mappingA.generatedLine - mappingB.generatedLine;
        if (cmp !== 0) {
          return cmp;
        }
        return strcmp(mappingA.name, mappingB.name);
      }
      exports.compareByOriginalPositionsNoSource = compareByOriginalPositionsNoSource;
      function compareByGeneratedPositionsDeflated(mappingA, mappingB, onlyCompareGenerated) {
        var cmp = mappingA.generatedLine - mappingB.generatedLine;
        if (cmp !== 0) {
          return cmp;
        }
        cmp = mappingA.generatedColumn - mappingB.generatedColumn;
        if (cmp !== 0 || onlyCompareGenerated) {
          return cmp;
        }
        cmp = strcmp(mappingA.source, mappingB.source);
        if (cmp !== 0) {
          return cmp;
        }
        cmp = mappingA.originalLine - mappingB.originalLine;
        if (cmp !== 0) {
          return cmp;
        }
        cmp = mappingA.originalColumn - mappingB.originalColumn;
        if (cmp !== 0) {
          return cmp;
        }
        return strcmp(mappingA.name, mappingB.name);
      }
      exports.compareByGeneratedPositionsDeflated = compareByGeneratedPositionsDeflated;
      function compareByGeneratedPositionsDeflatedNoLine(mappingA, mappingB, onlyCompareGenerated) {
        var cmp = mappingA.generatedColumn - mappingB.generatedColumn;
        if (cmp !== 0 || onlyCompareGenerated) {
          return cmp;
        }
        cmp = strcmp(mappingA.source, mappingB.source);
        if (cmp !== 0) {
          return cmp;
        }
        cmp = mappingA.originalLine - mappingB.originalLine;
        if (cmp !== 0) {
          return cmp;
        }
        cmp = mappingA.originalColumn - mappingB.originalColumn;
        if (cmp !== 0) {
          return cmp;
        }
        return strcmp(mappingA.name, mappingB.name);
      }
      exports.compareByGeneratedPositionsDeflatedNoLine = compareByGeneratedPositionsDeflatedNoLine;
      function strcmp(aStr1, aStr2) {
        if (aStr1 === aStr2) {
          return 0;
        }
        if (aStr1 === null) {
          return 1;
        }
        if (aStr2 === null) {
          return -1;
        }
        if (aStr1 > aStr2) {
          return 1;
        }
        return -1;
      }
      function compareByGeneratedPositionsInflated(mappingA, mappingB) {
        var cmp = mappingA.generatedLine - mappingB.generatedLine;
        if (cmp !== 0) {
          return cmp;
        }
        cmp = mappingA.generatedColumn - mappingB.generatedColumn;
        if (cmp !== 0) {
          return cmp;
        }
        cmp = strcmp(mappingA.source, mappingB.source);
        if (cmp !== 0) {
          return cmp;
        }
        cmp = mappingA.originalLine - mappingB.originalLine;
        if (cmp !== 0) {
          return cmp;
        }
        cmp = mappingA.originalColumn - mappingB.originalColumn;
        if (cmp !== 0) {
          return cmp;
        }
        return strcmp(mappingA.name, mappingB.name);
      }
      exports.compareByGeneratedPositionsInflated = compareByGeneratedPositionsInflated;
      function parseSourceMapInput(str) {
        return JSON.parse(str.replace(/^\)]}'[^\n]*\n/, ""));
      }
      exports.parseSourceMapInput = parseSourceMapInput;
      function computeSourceURL(sourceRoot, sourceURL, sourceMapURL) {
        sourceURL = sourceURL || "";
        if (sourceRoot) {
          if (sourceRoot[sourceRoot.length - 1] !== "/" && sourceURL[0] !== "/") {
            sourceRoot += "/";
          }
          sourceURL = sourceRoot + sourceURL;
        }
        if (sourceMapURL) {
          var parsed = urlParse(sourceMapURL);
          if (!parsed) {
            throw new Error("sourceMapURL could not be parsed");
          }
          if (parsed.path) {
            var index = parsed.path.lastIndexOf("/");
            if (index >= 0) {
              parsed.path = parsed.path.substring(0, index + 1);
            }
          }
          sourceURL = join(urlGenerate(parsed), sourceURL);
        }
        return normalize(sourceURL);
      }
      exports.computeSourceURL = computeSourceURL;
    }
  });

  // ../node_modules/.pnpm/source-map-js@1.2.1/node_modules/source-map-js/lib/array-set.js
  var require_array_set = __commonJS({
    "../node_modules/.pnpm/source-map-js@1.2.1/node_modules/source-map-js/lib/array-set.js"(exports) {
      var util = require_util();
      var has = Object.prototype.hasOwnProperty;
      var hasNativeMap = typeof Map !== "undefined";
      function ArraySet() {
        this._array = [];
        this._set = hasNativeMap ? /* @__PURE__ */ new Map() : /* @__PURE__ */ Object.create(null);
      }
      ArraySet.fromArray = function ArraySet_fromArray(aArray, aAllowDuplicates) {
        var set = new ArraySet();
        for (var i = 0, len = aArray.length; i < len; i++) {
          set.add(aArray[i], aAllowDuplicates);
        }
        return set;
      };
      ArraySet.prototype.size = function ArraySet_size() {
        return hasNativeMap ? this._set.size : Object.getOwnPropertyNames(this._set).length;
      };
      ArraySet.prototype.add = function ArraySet_add(aStr, aAllowDuplicates) {
        var sStr = hasNativeMap ? aStr : util.toSetString(aStr);
        var isDuplicate = hasNativeMap ? this.has(aStr) : has.call(this._set, sStr);
        var idx = this._array.length;
        if (!isDuplicate || aAllowDuplicates) {
          this._array.push(aStr);
        }
        if (!isDuplicate) {
          if (hasNativeMap) {
            this._set.set(aStr, idx);
          } else {
            this._set[sStr] = idx;
          }
        }
      };
      ArraySet.prototype.has = function ArraySet_has(aStr) {
        if (hasNativeMap) {
          return this._set.has(aStr);
        } else {
          var sStr = util.toSetString(aStr);
          return has.call(this._set, sStr);
        }
      };
      ArraySet.prototype.indexOf = function ArraySet_indexOf(aStr) {
        if (hasNativeMap) {
          var idx = this._set.get(aStr);
          if (idx >= 0) {
            return idx;
          }
        } else {
          var sStr = util.toSetString(aStr);
          if (has.call(this._set, sStr)) {
            return this._set[sStr];
          }
        }
        throw new Error('"' + aStr + '" is not in the set.');
      };
      ArraySet.prototype.at = function ArraySet_at(aIdx) {
        if (aIdx >= 0 && aIdx < this._array.length) {
          return this._array[aIdx];
        }
        throw new Error("No element indexed by " + aIdx);
      };
      ArraySet.prototype.toArray = function ArraySet_toArray() {
        return this._array.slice();
      };
      exports.ArraySet = ArraySet;
    }
  });

  // ../node_modules/.pnpm/source-map-js@1.2.1/node_modules/source-map-js/lib/mapping-list.js
  var require_mapping_list = __commonJS({
    "../node_modules/.pnpm/source-map-js@1.2.1/node_modules/source-map-js/lib/mapping-list.js"(exports) {
      var util = require_util();
      function generatedPositionAfter(mappingA, mappingB) {
        var lineA = mappingA.generatedLine;
        var lineB = mappingB.generatedLine;
        var columnA = mappingA.generatedColumn;
        var columnB = mappingB.generatedColumn;
        return lineB > lineA || lineB == lineA && columnB >= columnA || util.compareByGeneratedPositionsInflated(mappingA, mappingB) <= 0;
      }
      function MappingList() {
        this._array = [];
        this._sorted = true;
        this._last = { generatedLine: -1, generatedColumn: 0 };
      }
      MappingList.prototype.unsortedForEach = function MappingList_forEach(aCallback, aThisArg) {
        this._array.forEach(aCallback, aThisArg);
      };
      MappingList.prototype.add = function MappingList_add(aMapping) {
        if (generatedPositionAfter(this._last, aMapping)) {
          this._last = aMapping;
          this._array.push(aMapping);
        } else {
          this._sorted = false;
          this._array.push(aMapping);
        }
      };
      MappingList.prototype.toArray = function MappingList_toArray() {
        if (!this._sorted) {
          this._array.sort(util.compareByGeneratedPositionsInflated);
          this._sorted = true;
        }
        return this._array;
      };
      exports.MappingList = MappingList;
    }
  });

  // ../node_modules/.pnpm/source-map-js@1.2.1/node_modules/source-map-js/lib/source-map-generator.js
  var require_source_map_generator = __commonJS({
    "../node_modules/.pnpm/source-map-js@1.2.1/node_modules/source-map-js/lib/source-map-generator.js"(exports) {
      var base64VLQ = require_base64_vlq();
      var util = require_util();
      var ArraySet = require_array_set().ArraySet;
      var MappingList = require_mapping_list().MappingList;
      function SourceMapGenerator(aArgs) {
        if (!aArgs) {
          aArgs = {};
        }
        this._file = util.getArg(aArgs, "file", null);
        this._sourceRoot = util.getArg(aArgs, "sourceRoot", null);
        this._skipValidation = util.getArg(aArgs, "skipValidation", false);
        this._ignoreInvalidMapping = util.getArg(aArgs, "ignoreInvalidMapping", false);
        this._sources = new ArraySet();
        this._names = new ArraySet();
        this._mappings = new MappingList();
        this._sourcesContents = null;
      }
      SourceMapGenerator.prototype._version = 3;
      SourceMapGenerator.fromSourceMap = function SourceMapGenerator_fromSourceMap(aSourceMapConsumer, generatorOps) {
        var sourceRoot = aSourceMapConsumer.sourceRoot;
        var generator = new SourceMapGenerator(Object.assign(generatorOps || {}, {
          file: aSourceMapConsumer.file,
          sourceRoot
        }));
        aSourceMapConsumer.eachMapping(function(mapping) {
          var newMapping = {
            generated: {
              line: mapping.generatedLine,
              column: mapping.generatedColumn
            }
          };
          if (mapping.source != null) {
            newMapping.source = mapping.source;
            if (sourceRoot != null) {
              newMapping.source = util.relative(sourceRoot, newMapping.source);
            }
            newMapping.original = {
              line: mapping.originalLine,
              column: mapping.originalColumn
            };
            if (mapping.name != null) {
              newMapping.name = mapping.name;
            }
          }
          generator.addMapping(newMapping);
        });
        aSourceMapConsumer.sources.forEach(function(sourceFile) {
          var sourceRelative = sourceFile;
          if (sourceRoot !== null) {
            sourceRelative = util.relative(sourceRoot, sourceFile);
          }
          if (!generator._sources.has(sourceRelative)) {
            generator._sources.add(sourceRelative);
          }
          var content = aSourceMapConsumer.sourceContentFor(sourceFile);
          if (content != null) {
            generator.setSourceContent(sourceFile, content);
          }
        });
        return generator;
      };
      SourceMapGenerator.prototype.addMapping = function SourceMapGenerator_addMapping(aArgs) {
        var generated = util.getArg(aArgs, "generated");
        var original = util.getArg(aArgs, "original", null);
        var source = util.getArg(aArgs, "source", null);
        var name = util.getArg(aArgs, "name", null);
        if (!this._skipValidation) {
          if (this._validateMapping(generated, original, source, name) === false) {
            return;
          }
        }
        if (source != null) {
          source = String(source);
          if (!this._sources.has(source)) {
            this._sources.add(source);
          }
        }
        if (name != null) {
          name = String(name);
          if (!this._names.has(name)) {
            this._names.add(name);
          }
        }
        this._mappings.add({
          generatedLine: generated.line,
          generatedColumn: generated.column,
          originalLine: original != null && original.line,
          originalColumn: original != null && original.column,
          source,
          name
        });
      };
      SourceMapGenerator.prototype.setSourceContent = function SourceMapGenerator_setSourceContent(aSourceFile, aSourceContent) {
        var source = aSourceFile;
        if (this._sourceRoot != null) {
          source = util.relative(this._sourceRoot, source);
        }
        if (aSourceContent != null) {
          if (!this._sourcesContents) {
            this._sourcesContents = /* @__PURE__ */ Object.create(null);
          }
          this._sourcesContents[util.toSetString(source)] = aSourceContent;
        } else if (this._sourcesContents) {
          delete this._sourcesContents[util.toSetString(source)];
          if (Object.keys(this._sourcesContents).length === 0) {
            this._sourcesContents = null;
          }
        }
      };
      SourceMapGenerator.prototype.applySourceMap = function SourceMapGenerator_applySourceMap(aSourceMapConsumer, aSourceFile, aSourceMapPath) {
        var sourceFile = aSourceFile;
        if (aSourceFile == null) {
          if (aSourceMapConsumer.file == null) {
            throw new Error(
              `SourceMapGenerator.prototype.applySourceMap requires either an explicit source file, or the source map's "file" property. Both were omitted.`
            );
          }
          sourceFile = aSourceMapConsumer.file;
        }
        var sourceRoot = this._sourceRoot;
        if (sourceRoot != null) {
          sourceFile = util.relative(sourceRoot, sourceFile);
        }
        var newSources = new ArraySet();
        var newNames = new ArraySet();
        this._mappings.unsortedForEach(function(mapping) {
          if (mapping.source === sourceFile && mapping.originalLine != null) {
            var original = aSourceMapConsumer.originalPositionFor({
              line: mapping.originalLine,
              column: mapping.originalColumn
            });
            if (original.source != null) {
              mapping.source = original.source;
              if (aSourceMapPath != null) {
                mapping.source = util.join(aSourceMapPath, mapping.source);
              }
              if (sourceRoot != null) {
                mapping.source = util.relative(sourceRoot, mapping.source);
              }
              mapping.originalLine = original.line;
              mapping.originalColumn = original.column;
              if (original.name != null) {
                mapping.name = original.name;
              }
            }
          }
          var source = mapping.source;
          if (source != null && !newSources.has(source)) {
            newSources.add(source);
          }
          var name = mapping.name;
          if (name != null && !newNames.has(name)) {
            newNames.add(name);
          }
        }, this);
        this._sources = newSources;
        this._names = newNames;
        aSourceMapConsumer.sources.forEach(function(sourceFile2) {
          var content = aSourceMapConsumer.sourceContentFor(sourceFile2);
          if (content != null) {
            if (aSourceMapPath != null) {
              sourceFile2 = util.join(aSourceMapPath, sourceFile2);
            }
            if (sourceRoot != null) {
              sourceFile2 = util.relative(sourceRoot, sourceFile2);
            }
            this.setSourceContent(sourceFile2, content);
          }
        }, this);
      };
      SourceMapGenerator.prototype._validateMapping = function SourceMapGenerator_validateMapping(aGenerated, aOriginal, aSource, aName) {
        if (aOriginal && typeof aOriginal.line !== "number" && typeof aOriginal.column !== "number") {
          var message = "original.line and original.column are not numbers -- you probably meant to omit the original mapping entirely and only map the generated position. If so, pass null for the original mapping instead of an object with empty or null values.";
          if (this._ignoreInvalidMapping) {
            if (typeof console !== "undefined" && console.warn) {
              console.warn(message);
            }
            return false;
          } else {
            throw new Error(message);
          }
        }
        if (aGenerated && "line" in aGenerated && "column" in aGenerated && aGenerated.line > 0 && aGenerated.column >= 0 && !aOriginal && !aSource && !aName) {
          return;
        } else if (aGenerated && "line" in aGenerated && "column" in aGenerated && aOriginal && "line" in aOriginal && "column" in aOriginal && aGenerated.line > 0 && aGenerated.column >= 0 && aOriginal.line > 0 && aOriginal.column >= 0 && aSource) {
          return;
        } else {
          var message = "Invalid mapping: " + JSON.stringify({
            generated: aGenerated,
            source: aSource,
            original: aOriginal,
            name: aName
          });
          if (this._ignoreInvalidMapping) {
            if (typeof console !== "undefined" && console.warn) {
              console.warn(message);
            }
            return false;
          } else {
            throw new Error(message);
          }
        }
      };
      SourceMapGenerator.prototype._serializeMappings = function SourceMapGenerator_serializeMappings() {
        var previousGeneratedColumn = 0;
        var previousGeneratedLine = 1;
        var previousOriginalColumn = 0;
        var previousOriginalLine = 0;
        var previousName = 0;
        var previousSource = 0;
        var result = "";
        var next;
        var mapping;
        var nameIdx;
        var sourceIdx;
        var mappings = this._mappings.toArray();
        for (var i = 0, len = mappings.length; i < len; i++) {
          mapping = mappings[i];
          next = "";
          if (mapping.generatedLine !== previousGeneratedLine) {
            previousGeneratedColumn = 0;
            while (mapping.generatedLine !== previousGeneratedLine) {
              next += ";";
              previousGeneratedLine++;
            }
          } else {
            if (i > 0) {
              if (!util.compareByGeneratedPositionsInflated(mapping, mappings[i - 1])) {
                continue;
              }
              next += ",";
            }
          }
          next += base64VLQ.encode(mapping.generatedColumn - previousGeneratedColumn);
          previousGeneratedColumn = mapping.generatedColumn;
          if (mapping.source != null) {
            sourceIdx = this._sources.indexOf(mapping.source);
            next += base64VLQ.encode(sourceIdx - previousSource);
            previousSource = sourceIdx;
            next += base64VLQ.encode(mapping.originalLine - 1 - previousOriginalLine);
            previousOriginalLine = mapping.originalLine - 1;
            next += base64VLQ.encode(mapping.originalColumn - previousOriginalColumn);
            previousOriginalColumn = mapping.originalColumn;
            if (mapping.name != null) {
              nameIdx = this._names.indexOf(mapping.name);
              next += base64VLQ.encode(nameIdx - previousName);
              previousName = nameIdx;
            }
          }
          result += next;
        }
        return result;
      };
      SourceMapGenerator.prototype._generateSourcesContent = function SourceMapGenerator_generateSourcesContent(aSources, aSourceRoot) {
        return aSources.map(function(source) {
          if (!this._sourcesContents) {
            return null;
          }
          if (aSourceRoot != null) {
            source = util.relative(aSourceRoot, source);
          }
          var key2 = util.toSetString(source);
          return Object.prototype.hasOwnProperty.call(this._sourcesContents, key2) ? this._sourcesContents[key2] : null;
        }, this);
      };
      SourceMapGenerator.prototype.toJSON = function SourceMapGenerator_toJSON() {
        var map = {
          version: this._version,
          sources: this._sources.toArray(),
          names: this._names.toArray(),
          mappings: this._serializeMappings()
        };
        if (this._file != null) {
          map.file = this._file;
        }
        if (this._sourceRoot != null) {
          map.sourceRoot = this._sourceRoot;
        }
        if (this._sourcesContents) {
          map.sourcesContent = this._generateSourcesContent(map.sources, map.sourceRoot);
        }
        return map;
      };
      SourceMapGenerator.prototype.toString = function SourceMapGenerator_toString() {
        return JSON.stringify(this.toJSON());
      };
      exports.SourceMapGenerator = SourceMapGenerator;
    }
  });

  // ../node_modules/.pnpm/source-map-js@1.2.1/node_modules/source-map-js/lib/binary-search.js
  var require_binary_search = __commonJS({
    "../node_modules/.pnpm/source-map-js@1.2.1/node_modules/source-map-js/lib/binary-search.js"(exports) {
      exports.GREATEST_LOWER_BOUND = 1;
      exports.LEAST_UPPER_BOUND = 2;
      function recursiveSearch(aLow, aHigh, aNeedle, aHaystack, aCompare, aBias) {
        var mid = Math.floor((aHigh - aLow) / 2) + aLow;
        var cmp = aCompare(aNeedle, aHaystack[mid], true);
        if (cmp === 0) {
          return mid;
        } else if (cmp > 0) {
          if (aHigh - mid > 1) {
            return recursiveSearch(mid, aHigh, aNeedle, aHaystack, aCompare, aBias);
          }
          if (aBias == exports.LEAST_UPPER_BOUND) {
            return aHigh < aHaystack.length ? aHigh : -1;
          } else {
            return mid;
          }
        } else {
          if (mid - aLow > 1) {
            return recursiveSearch(aLow, mid, aNeedle, aHaystack, aCompare, aBias);
          }
          if (aBias == exports.LEAST_UPPER_BOUND) {
            return mid;
          } else {
            return aLow < 0 ? -1 : aLow;
          }
        }
      }
      exports.search = function search(aNeedle, aHaystack, aCompare, aBias) {
        if (aHaystack.length === 0) {
          return -1;
        }
        var index = recursiveSearch(
          -1,
          aHaystack.length,
          aNeedle,
          aHaystack,
          aCompare,
          aBias || exports.GREATEST_LOWER_BOUND
        );
        if (index < 0) {
          return -1;
        }
        while (index - 1 >= 0) {
          if (aCompare(aHaystack[index], aHaystack[index - 1], true) !== 0) {
            break;
          }
          --index;
        }
        return index;
      };
    }
  });

  // ../node_modules/.pnpm/source-map-js@1.2.1/node_modules/source-map-js/lib/quick-sort.js
  var require_quick_sort = __commonJS({
    "../node_modules/.pnpm/source-map-js@1.2.1/node_modules/source-map-js/lib/quick-sort.js"(exports) {
      function SortTemplate(comparator) {
        function swap(ary, x, y) {
          var temp = ary[x];
          ary[x] = ary[y];
          ary[y] = temp;
        }
        function randomIntInRange(low, high) {
          return Math.round(low + Math.random() * (high - low));
        }
        function doQuickSort(ary, comparator2, p, r) {
          if (p < r) {
            var pivotIndex = randomIntInRange(p, r);
            var i = p - 1;
            swap(ary, pivotIndex, r);
            var pivot = ary[r];
            for (var j = p; j < r; j++) {
              if (comparator2(ary[j], pivot, false) <= 0) {
                i += 1;
                swap(ary, i, j);
              }
            }
            swap(ary, i + 1, j);
            var q = i + 1;
            doQuickSort(ary, comparator2, p, q - 1);
            doQuickSort(ary, comparator2, q + 1, r);
          }
        }
        return doQuickSort;
      }
      function cloneSort(comparator) {
        let template = SortTemplate.toString();
        let templateFn = new Function(`return ${template}`)();
        return templateFn(comparator);
      }
      var sortCache = /* @__PURE__ */ new WeakMap();
      exports.quickSort = function(ary, comparator, start = 0) {
        let doQuickSort = sortCache.get(comparator);
        if (doQuickSort === void 0) {
          doQuickSort = cloneSort(comparator);
          sortCache.set(comparator, doQuickSort);
        }
        doQuickSort(ary, comparator, start, ary.length - 1);
      };
    }
  });

  // ../node_modules/.pnpm/source-map-js@1.2.1/node_modules/source-map-js/lib/source-map-consumer.js
  var require_source_map_consumer = __commonJS({
    "../node_modules/.pnpm/source-map-js@1.2.1/node_modules/source-map-js/lib/source-map-consumer.js"(exports) {
      var util = require_util();
      var binarySearch = require_binary_search();
      var ArraySet = require_array_set().ArraySet;
      var base64VLQ = require_base64_vlq();
      var quickSort = require_quick_sort().quickSort;
      function SourceMapConsumer(aSourceMap, aSourceMapURL) {
        var sourceMap = aSourceMap;
        if (typeof aSourceMap === "string") {
          sourceMap = util.parseSourceMapInput(aSourceMap);
        }
        return sourceMap.sections != null ? new IndexedSourceMapConsumer(sourceMap, aSourceMapURL) : new BasicSourceMapConsumer(sourceMap, aSourceMapURL);
      }
      SourceMapConsumer.fromSourceMap = function(aSourceMap, aSourceMapURL) {
        return BasicSourceMapConsumer.fromSourceMap(aSourceMap, aSourceMapURL);
      };
      SourceMapConsumer.prototype._version = 3;
      SourceMapConsumer.prototype.__generatedMappings = null;
      Object.defineProperty(SourceMapConsumer.prototype, "_generatedMappings", {
        configurable: true,
        enumerable: true,
        get: function() {
          if (!this.__generatedMappings) {
            this._parseMappings(this._mappings, this.sourceRoot);
          }
          return this.__generatedMappings;
        }
      });
      SourceMapConsumer.prototype.__originalMappings = null;
      Object.defineProperty(SourceMapConsumer.prototype, "_originalMappings", {
        configurable: true,
        enumerable: true,
        get: function() {
          if (!this.__originalMappings) {
            this._parseMappings(this._mappings, this.sourceRoot);
          }
          return this.__originalMappings;
        }
      });
      SourceMapConsumer.prototype._charIsMappingSeparator = function SourceMapConsumer_charIsMappingSeparator(aStr, index) {
        var c = aStr.charAt(index);
        return c === ";" || c === ",";
      };
      SourceMapConsumer.prototype._parseMappings = function SourceMapConsumer_parseMappings(aStr, aSourceRoot) {
        throw new Error("Subclasses must implement _parseMappings");
      };
      SourceMapConsumer.GENERATED_ORDER = 1;
      SourceMapConsumer.ORIGINAL_ORDER = 2;
      SourceMapConsumer.GREATEST_LOWER_BOUND = 1;
      SourceMapConsumer.LEAST_UPPER_BOUND = 2;
      SourceMapConsumer.prototype.eachMapping = function SourceMapConsumer_eachMapping(aCallback, aContext, aOrder) {
        var context = aContext || null;
        var order = aOrder || SourceMapConsumer.GENERATED_ORDER;
        var mappings;
        switch (order) {
          case SourceMapConsumer.GENERATED_ORDER:
            mappings = this._generatedMappings;
            break;
          case SourceMapConsumer.ORIGINAL_ORDER:
            mappings = this._originalMappings;
            break;
          default:
            throw new Error("Unknown order of iteration.");
        }
        var sourceRoot = this.sourceRoot;
        var boundCallback = aCallback.bind(context);
        var names = this._names;
        var sources = this._sources;
        var sourceMapURL = this._sourceMapURL;
        for (var i = 0, n = mappings.length; i < n; i++) {
          var mapping = mappings[i];
          var source = mapping.source === null ? null : sources.at(mapping.source);
          if (source !== null) {
            source = util.computeSourceURL(sourceRoot, source, sourceMapURL);
          }
          boundCallback({
            source,
            generatedLine: mapping.generatedLine,
            generatedColumn: mapping.generatedColumn,
            originalLine: mapping.originalLine,
            originalColumn: mapping.originalColumn,
            name: mapping.name === null ? null : names.at(mapping.name)
          });
        }
      };
      SourceMapConsumer.prototype.allGeneratedPositionsFor = function SourceMapConsumer_allGeneratedPositionsFor(aArgs) {
        var line = util.getArg(aArgs, "line");
        var needle = {
          source: util.getArg(aArgs, "source"),
          originalLine: line,
          originalColumn: util.getArg(aArgs, "column", 0)
        };
        needle.source = this._findSourceIndex(needle.source);
        if (needle.source < 0) {
          return [];
        }
        var mappings = [];
        var index = this._findMapping(
          needle,
          this._originalMappings,
          "originalLine",
          "originalColumn",
          util.compareByOriginalPositions,
          binarySearch.LEAST_UPPER_BOUND
        );
        if (index >= 0) {
          var mapping = this._originalMappings[index];
          if (aArgs.column === void 0) {
            var originalLine = mapping.originalLine;
            while (mapping && mapping.originalLine === originalLine) {
              mappings.push({
                line: util.getArg(mapping, "generatedLine", null),
                column: util.getArg(mapping, "generatedColumn", null),
                lastColumn: util.getArg(mapping, "lastGeneratedColumn", null)
              });
              mapping = this._originalMappings[++index];
            }
          } else {
            var originalColumn = mapping.originalColumn;
            while (mapping && mapping.originalLine === line && mapping.originalColumn == originalColumn) {
              mappings.push({
                line: util.getArg(mapping, "generatedLine", null),
                column: util.getArg(mapping, "generatedColumn", null),
                lastColumn: util.getArg(mapping, "lastGeneratedColumn", null)
              });
              mapping = this._originalMappings[++index];
            }
          }
        }
        return mappings;
      };
      exports.SourceMapConsumer = SourceMapConsumer;
      function BasicSourceMapConsumer(aSourceMap, aSourceMapURL) {
        var sourceMap = aSourceMap;
        if (typeof aSourceMap === "string") {
          sourceMap = util.parseSourceMapInput(aSourceMap);
        }
        var version = util.getArg(sourceMap, "version");
        var sources = util.getArg(sourceMap, "sources");
        var names = util.getArg(sourceMap, "names", []);
        var sourceRoot = util.getArg(sourceMap, "sourceRoot", null);
        var sourcesContent = util.getArg(sourceMap, "sourcesContent", null);
        var mappings = util.getArg(sourceMap, "mappings");
        var file = util.getArg(sourceMap, "file", null);
        if (version != this._version) {
          throw new Error("Unsupported version: " + version);
        }
        if (sourceRoot) {
          sourceRoot = util.normalize(sourceRoot);
        }
        sources = sources.map(String).map(util.normalize).map(function(source) {
          return sourceRoot && util.isAbsolute(sourceRoot) && util.isAbsolute(source) ? util.relative(sourceRoot, source) : source;
        });
        this._names = ArraySet.fromArray(names.map(String), true);
        this._sources = ArraySet.fromArray(sources, true);
        this._absoluteSources = this._sources.toArray().map(function(s) {
          return util.computeSourceURL(sourceRoot, s, aSourceMapURL);
        });
        this.sourceRoot = sourceRoot;
        this.sourcesContent = sourcesContent;
        this._mappings = mappings;
        this._sourceMapURL = aSourceMapURL;
        this.file = file;
      }
      BasicSourceMapConsumer.prototype = Object.create(SourceMapConsumer.prototype);
      BasicSourceMapConsumer.prototype.consumer = SourceMapConsumer;
      BasicSourceMapConsumer.prototype._findSourceIndex = function(aSource) {
        var relativeSource = aSource;
        if (this.sourceRoot != null) {
          relativeSource = util.relative(this.sourceRoot, relativeSource);
        }
        if (this._sources.has(relativeSource)) {
          return this._sources.indexOf(relativeSource);
        }
        var i;
        for (i = 0; i < this._absoluteSources.length; ++i) {
          if (this._absoluteSources[i] == aSource) {
            return i;
          }
        }
        return -1;
      };
      BasicSourceMapConsumer.fromSourceMap = function SourceMapConsumer_fromSourceMap(aSourceMap, aSourceMapURL) {
        var smc = Object.create(BasicSourceMapConsumer.prototype);
        var names = smc._names = ArraySet.fromArray(aSourceMap._names.toArray(), true);
        var sources = smc._sources = ArraySet.fromArray(aSourceMap._sources.toArray(), true);
        smc.sourceRoot = aSourceMap._sourceRoot;
        smc.sourcesContent = aSourceMap._generateSourcesContent(
          smc._sources.toArray(),
          smc.sourceRoot
        );
        smc.file = aSourceMap._file;
        smc._sourceMapURL = aSourceMapURL;
        smc._absoluteSources = smc._sources.toArray().map(function(s) {
          return util.computeSourceURL(smc.sourceRoot, s, aSourceMapURL);
        });
        var generatedMappings = aSourceMap._mappings.toArray().slice();
        var destGeneratedMappings = smc.__generatedMappings = [];
        var destOriginalMappings = smc.__originalMappings = [];
        for (var i = 0, length = generatedMappings.length; i < length; i++) {
          var srcMapping = generatedMappings[i];
          var destMapping = new Mapping();
          destMapping.generatedLine = srcMapping.generatedLine;
          destMapping.generatedColumn = srcMapping.generatedColumn;
          if (srcMapping.source) {
            destMapping.source = sources.indexOf(srcMapping.source);
            destMapping.originalLine = srcMapping.originalLine;
            destMapping.originalColumn = srcMapping.originalColumn;
            if (srcMapping.name) {
              destMapping.name = names.indexOf(srcMapping.name);
            }
            destOriginalMappings.push(destMapping);
          }
          destGeneratedMappings.push(destMapping);
        }
        quickSort(smc.__originalMappings, util.compareByOriginalPositions);
        return smc;
      };
      BasicSourceMapConsumer.prototype._version = 3;
      Object.defineProperty(BasicSourceMapConsumer.prototype, "sources", {
        get: function() {
          return this._absoluteSources.slice();
        }
      });
      function Mapping() {
        this.generatedLine = 0;
        this.generatedColumn = 0;
        this.source = null;
        this.originalLine = null;
        this.originalColumn = null;
        this.name = null;
      }
      var compareGenerated = util.compareByGeneratedPositionsDeflatedNoLine;
      function sortGenerated(array, start) {
        let l = array.length;
        let n = array.length - start;
        if (n <= 1) {
          return;
        } else if (n == 2) {
          let a = array[start];
          let b = array[start + 1];
          if (compareGenerated(a, b) > 0) {
            array[start] = b;
            array[start + 1] = a;
          }
        } else if (n < 20) {
          for (let i = start; i < l; i++) {
            for (let j = i; j > start; j--) {
              let a = array[j - 1];
              let b = array[j];
              if (compareGenerated(a, b) <= 0) {
                break;
              }
              array[j - 1] = b;
              array[j] = a;
            }
          }
        } else {
          quickSort(array, compareGenerated, start);
        }
      }
      BasicSourceMapConsumer.prototype._parseMappings = function SourceMapConsumer_parseMappings(aStr, aSourceRoot) {
        var generatedLine = 1;
        var previousGeneratedColumn = 0;
        var previousOriginalLine = 0;
        var previousOriginalColumn = 0;
        var previousSource = 0;
        var previousName = 0;
        var length = aStr.length;
        var index = 0;
        var cachedSegments = {};
        var temp = {};
        var originalMappings = [];
        var generatedMappings = [];
        var mapping, str, segment, end, value;
        let subarrayStart = 0;
        while (index < length) {
          if (aStr.charAt(index) === ";") {
            generatedLine++;
            index++;
            previousGeneratedColumn = 0;
            sortGenerated(generatedMappings, subarrayStart);
            subarrayStart = generatedMappings.length;
          } else if (aStr.charAt(index) === ",") {
            index++;
          } else {
            mapping = new Mapping();
            mapping.generatedLine = generatedLine;
            for (end = index; end < length; end++) {
              if (this._charIsMappingSeparator(aStr, end)) {
                break;
              }
            }
            str = aStr.slice(index, end);
            segment = [];
            while (index < end) {
              base64VLQ.decode(aStr, index, temp);
              value = temp.value;
              index = temp.rest;
              segment.push(value);
            }
            if (segment.length === 2) {
              throw new Error("Found a source, but no line and column");
            }
            if (segment.length === 3) {
              throw new Error("Found a source and line, but no column");
            }
            mapping.generatedColumn = previousGeneratedColumn + segment[0];
            previousGeneratedColumn = mapping.generatedColumn;
            if (segment.length > 1) {
              mapping.source = previousSource + segment[1];
              previousSource += segment[1];
              mapping.originalLine = previousOriginalLine + segment[2];
              previousOriginalLine = mapping.originalLine;
              mapping.originalLine += 1;
              mapping.originalColumn = previousOriginalColumn + segment[3];
              previousOriginalColumn = mapping.originalColumn;
              if (segment.length > 4) {
                mapping.name = previousName + segment[4];
                previousName += segment[4];
              }
            }
            generatedMappings.push(mapping);
            if (typeof mapping.originalLine === "number") {
              let currentSource = mapping.source;
              while (originalMappings.length <= currentSource) {
                originalMappings.push(null);
              }
              if (originalMappings[currentSource] === null) {
                originalMappings[currentSource] = [];
              }
              originalMappings[currentSource].push(mapping);
            }
          }
        }
        sortGenerated(generatedMappings, subarrayStart);
        this.__generatedMappings = generatedMappings;
        for (var i = 0; i < originalMappings.length; i++) {
          if (originalMappings[i] != null) {
            quickSort(originalMappings[i], util.compareByOriginalPositionsNoSource);
          }
        }
        this.__originalMappings = [].concat(...originalMappings);
      };
      BasicSourceMapConsumer.prototype._findMapping = function SourceMapConsumer_findMapping(aNeedle, aMappings, aLineName, aColumnName, aComparator, aBias) {
        if (aNeedle[aLineName] <= 0) {
          throw new TypeError("Line must be greater than or equal to 1, got " + aNeedle[aLineName]);
        }
        if (aNeedle[aColumnName] < 0) {
          throw new TypeError("Column must be greater than or equal to 0, got " + aNeedle[aColumnName]);
        }
        return binarySearch.search(aNeedle, aMappings, aComparator, aBias);
      };
      BasicSourceMapConsumer.prototype.computeColumnSpans = function SourceMapConsumer_computeColumnSpans() {
        for (var index = 0; index < this._generatedMappings.length; ++index) {
          var mapping = this._generatedMappings[index];
          if (index + 1 < this._generatedMappings.length) {
            var nextMapping = this._generatedMappings[index + 1];
            if (mapping.generatedLine === nextMapping.generatedLine) {
              mapping.lastGeneratedColumn = nextMapping.generatedColumn - 1;
              continue;
            }
          }
          mapping.lastGeneratedColumn = Infinity;
        }
      };
      BasicSourceMapConsumer.prototype.originalPositionFor = function SourceMapConsumer_originalPositionFor(aArgs) {
        var needle = {
          generatedLine: util.getArg(aArgs, "line"),
          generatedColumn: util.getArg(aArgs, "column")
        };
        var index = this._findMapping(
          needle,
          this._generatedMappings,
          "generatedLine",
          "generatedColumn",
          util.compareByGeneratedPositionsDeflated,
          util.getArg(aArgs, "bias", SourceMapConsumer.GREATEST_LOWER_BOUND)
        );
        if (index >= 0) {
          var mapping = this._generatedMappings[index];
          if (mapping.generatedLine === needle.generatedLine) {
            var source = util.getArg(mapping, "source", null);
            if (source !== null) {
              source = this._sources.at(source);
              source = util.computeSourceURL(this.sourceRoot, source, this._sourceMapURL);
            }
            var name = util.getArg(mapping, "name", null);
            if (name !== null) {
              name = this._names.at(name);
            }
            return {
              source,
              line: util.getArg(mapping, "originalLine", null),
              column: util.getArg(mapping, "originalColumn", null),
              name
            };
          }
        }
        return {
          source: null,
          line: null,
          column: null,
          name: null
        };
      };
      BasicSourceMapConsumer.prototype.hasContentsOfAllSources = function BasicSourceMapConsumer_hasContentsOfAllSources() {
        if (!this.sourcesContent) {
          return false;
        }
        return this.sourcesContent.length >= this._sources.size() && !this.sourcesContent.some(function(sc) {
          return sc == null;
        });
      };
      BasicSourceMapConsumer.prototype.sourceContentFor = function SourceMapConsumer_sourceContentFor(aSource, nullOnMissing) {
        if (!this.sourcesContent) {
          return null;
        }
        var index = this._findSourceIndex(aSource);
        if (index >= 0) {
          return this.sourcesContent[index];
        }
        var relativeSource = aSource;
        if (this.sourceRoot != null) {
          relativeSource = util.relative(this.sourceRoot, relativeSource);
        }
        var url;
        if (this.sourceRoot != null && (url = util.urlParse(this.sourceRoot))) {
          var fileUriAbsPath = relativeSource.replace(/^file:\/\//, "");
          if (url.scheme == "file" && this._sources.has(fileUriAbsPath)) {
            return this.sourcesContent[this._sources.indexOf(fileUriAbsPath)];
          }
          if ((!url.path || url.path == "/") && this._sources.has("/" + relativeSource)) {
            return this.sourcesContent[this._sources.indexOf("/" + relativeSource)];
          }
        }
        if (nullOnMissing) {
          return null;
        } else {
          throw new Error('"' + relativeSource + '" is not in the SourceMap.');
        }
      };
      BasicSourceMapConsumer.prototype.generatedPositionFor = function SourceMapConsumer_generatedPositionFor(aArgs) {
        var source = util.getArg(aArgs, "source");
        source = this._findSourceIndex(source);
        if (source < 0) {
          return {
            line: null,
            column: null,
            lastColumn: null
          };
        }
        var needle = {
          source,
          originalLine: util.getArg(aArgs, "line"),
          originalColumn: util.getArg(aArgs, "column")
        };
        var index = this._findMapping(
          needle,
          this._originalMappings,
          "originalLine",
          "originalColumn",
          util.compareByOriginalPositions,
          util.getArg(aArgs, "bias", SourceMapConsumer.GREATEST_LOWER_BOUND)
        );
        if (index >= 0) {
          var mapping = this._originalMappings[index];
          if (mapping.source === needle.source) {
            return {
              line: util.getArg(mapping, "generatedLine", null),
              column: util.getArg(mapping, "generatedColumn", null),
              lastColumn: util.getArg(mapping, "lastGeneratedColumn", null)
            };
          }
        }
        return {
          line: null,
          column: null,
          lastColumn: null
        };
      };
      exports.BasicSourceMapConsumer = BasicSourceMapConsumer;
      function IndexedSourceMapConsumer(aSourceMap, aSourceMapURL) {
        var sourceMap = aSourceMap;
        if (typeof aSourceMap === "string") {
          sourceMap = util.parseSourceMapInput(aSourceMap);
        }
        var version = util.getArg(sourceMap, "version");
        var sections = util.getArg(sourceMap, "sections");
        if (version != this._version) {
          throw new Error("Unsupported version: " + version);
        }
        this._sources = new ArraySet();
        this._names = new ArraySet();
        var lastOffset = {
          line: -1,
          column: 0
        };
        this._sections = sections.map(function(s) {
          if (s.url) {
            throw new Error("Support for url field in sections not implemented.");
          }
          var offset = util.getArg(s, "offset");
          var offsetLine = util.getArg(offset, "line");
          var offsetColumn = util.getArg(offset, "column");
          if (offsetLine < lastOffset.line || offsetLine === lastOffset.line && offsetColumn < lastOffset.column) {
            throw new Error("Section offsets must be ordered and non-overlapping.");
          }
          lastOffset = offset;
          return {
            generatedOffset: {
              // The offset fields are 0-based, but we use 1-based indices when
              // encoding/decoding from VLQ.
              generatedLine: offsetLine + 1,
              generatedColumn: offsetColumn + 1
            },
            consumer: new SourceMapConsumer(util.getArg(s, "map"), aSourceMapURL)
          };
        });
      }
      IndexedSourceMapConsumer.prototype = Object.create(SourceMapConsumer.prototype);
      IndexedSourceMapConsumer.prototype.constructor = SourceMapConsumer;
      IndexedSourceMapConsumer.prototype._version = 3;
      Object.defineProperty(IndexedSourceMapConsumer.prototype, "sources", {
        get: function() {
          var sources = [];
          for (var i = 0; i < this._sections.length; i++) {
            for (var j = 0; j < this._sections[i].consumer.sources.length; j++) {
              sources.push(this._sections[i].consumer.sources[j]);
            }
          }
          return sources;
        }
      });
      IndexedSourceMapConsumer.prototype.originalPositionFor = function IndexedSourceMapConsumer_originalPositionFor(aArgs) {
        var needle = {
          generatedLine: util.getArg(aArgs, "line"),
          generatedColumn: util.getArg(aArgs, "column")
        };
        var sectionIndex = binarySearch.search(
          needle,
          this._sections,
          function(needle2, section2) {
            var cmp = needle2.generatedLine - section2.generatedOffset.generatedLine;
            if (cmp) {
              return cmp;
            }
            return needle2.generatedColumn - section2.generatedOffset.generatedColumn;
          }
        );
        var section = this._sections[sectionIndex];
        if (!section) {
          return {
            source: null,
            line: null,
            column: null,
            name: null
          };
        }
        return section.consumer.originalPositionFor({
          line: needle.generatedLine - (section.generatedOffset.generatedLine - 1),
          column: needle.generatedColumn - (section.generatedOffset.generatedLine === needle.generatedLine ? section.generatedOffset.generatedColumn - 1 : 0),
          bias: aArgs.bias
        });
      };
      IndexedSourceMapConsumer.prototype.hasContentsOfAllSources = function IndexedSourceMapConsumer_hasContentsOfAllSources() {
        return this._sections.every(function(s) {
          return s.consumer.hasContentsOfAllSources();
        });
      };
      IndexedSourceMapConsumer.prototype.sourceContentFor = function IndexedSourceMapConsumer_sourceContentFor(aSource, nullOnMissing) {
        for (var i = 0; i < this._sections.length; i++) {
          var section = this._sections[i];
          var content = section.consumer.sourceContentFor(aSource, true);
          if (content || content === "") {
            return content;
          }
        }
        if (nullOnMissing) {
          return null;
        } else {
          throw new Error('"' + aSource + '" is not in the SourceMap.');
        }
      };
      IndexedSourceMapConsumer.prototype.generatedPositionFor = function IndexedSourceMapConsumer_generatedPositionFor(aArgs) {
        for (var i = 0; i < this._sections.length; i++) {
          var section = this._sections[i];
          if (section.consumer._findSourceIndex(util.getArg(aArgs, "source")) === -1) {
            continue;
          }
          var generatedPosition = section.consumer.generatedPositionFor(aArgs);
          if (generatedPosition) {
            var ret = {
              line: generatedPosition.line + (section.generatedOffset.generatedLine - 1),
              column: generatedPosition.column + (section.generatedOffset.generatedLine === generatedPosition.line ? section.generatedOffset.generatedColumn - 1 : 0)
            };
            return ret;
          }
        }
        return {
          line: null,
          column: null
        };
      };
      IndexedSourceMapConsumer.prototype._parseMappings = function IndexedSourceMapConsumer_parseMappings(aStr, aSourceRoot) {
        this.__generatedMappings = [];
        this.__originalMappings = [];
        for (var i = 0; i < this._sections.length; i++) {
          var section = this._sections[i];
          var sectionMappings = section.consumer._generatedMappings;
          for (var j = 0; j < sectionMappings.length; j++) {
            var mapping = sectionMappings[j];
            var source = section.consumer._sources.at(mapping.source);
            if (source !== null) {
              source = util.computeSourceURL(section.consumer.sourceRoot, source, this._sourceMapURL);
            }
            this._sources.add(source);
            source = this._sources.indexOf(source);
            var name = null;
            if (mapping.name) {
              name = section.consumer._names.at(mapping.name);
              this._names.add(name);
              name = this._names.indexOf(name);
            }
            var adjustedMapping = {
              source,
              generatedLine: mapping.generatedLine + (section.generatedOffset.generatedLine - 1),
              generatedColumn: mapping.generatedColumn + (section.generatedOffset.generatedLine === mapping.generatedLine ? section.generatedOffset.generatedColumn - 1 : 0),
              originalLine: mapping.originalLine,
              originalColumn: mapping.originalColumn,
              name
            };
            this.__generatedMappings.push(adjustedMapping);
            if (typeof adjustedMapping.originalLine === "number") {
              this.__originalMappings.push(adjustedMapping);
            }
          }
        }
        quickSort(this.__generatedMappings, util.compareByGeneratedPositionsDeflated);
        quickSort(this.__originalMappings, util.compareByOriginalPositions);
      };
      exports.IndexedSourceMapConsumer = IndexedSourceMapConsumer;
    }
  });

  // ../node_modules/.pnpm/source-map-js@1.2.1/node_modules/source-map-js/lib/source-node.js
  var require_source_node = __commonJS({
    "../node_modules/.pnpm/source-map-js@1.2.1/node_modules/source-map-js/lib/source-node.js"(exports) {
      var SourceMapGenerator = require_source_map_generator().SourceMapGenerator;
      var util = require_util();
      var REGEX_NEWLINE = /(\r?\n)/;
      var NEWLINE_CODE = 10;
      var isSourceNode = "$$$isSourceNode$$$";
      function SourceNode(aLine, aColumn, aSource, aChunks, aName) {
        this.children = [];
        this.sourceContents = {};
        this.line = aLine == null ? null : aLine;
        this.column = aColumn == null ? null : aColumn;
        this.source = aSource == null ? null : aSource;
        this.name = aName == null ? null : aName;
        this[isSourceNode] = true;
        if (aChunks != null) this.add(aChunks);
      }
      SourceNode.fromStringWithSourceMap = function SourceNode_fromStringWithSourceMap(aGeneratedCode, aSourceMapConsumer, aRelativePath) {
        var node = new SourceNode();
        var remainingLines = aGeneratedCode.split(REGEX_NEWLINE);
        var remainingLinesIndex = 0;
        var shiftNextLine = function() {
          var lineContents = getNextLine();
          var newLine = getNextLine() || "";
          return lineContents + newLine;
          function getNextLine() {
            return remainingLinesIndex < remainingLines.length ? remainingLines[remainingLinesIndex++] : void 0;
          }
        };
        var lastGeneratedLine = 1, lastGeneratedColumn = 0;
        var lastMapping = null;
        aSourceMapConsumer.eachMapping(function(mapping) {
          if (lastMapping !== null) {
            if (lastGeneratedLine < mapping.generatedLine) {
              addMappingWithCode(lastMapping, shiftNextLine());
              lastGeneratedLine++;
              lastGeneratedColumn = 0;
            } else {
              var nextLine = remainingLines[remainingLinesIndex] || "";
              var code = nextLine.substr(0, mapping.generatedColumn - lastGeneratedColumn);
              remainingLines[remainingLinesIndex] = nextLine.substr(mapping.generatedColumn - lastGeneratedColumn);
              lastGeneratedColumn = mapping.generatedColumn;
              addMappingWithCode(lastMapping, code);
              lastMapping = mapping;
              return;
            }
          }
          while (lastGeneratedLine < mapping.generatedLine) {
            node.add(shiftNextLine());
            lastGeneratedLine++;
          }
          if (lastGeneratedColumn < mapping.generatedColumn) {
            var nextLine = remainingLines[remainingLinesIndex] || "";
            node.add(nextLine.substr(0, mapping.generatedColumn));
            remainingLines[remainingLinesIndex] = nextLine.substr(mapping.generatedColumn);
            lastGeneratedColumn = mapping.generatedColumn;
          }
          lastMapping = mapping;
        }, this);
        if (remainingLinesIndex < remainingLines.length) {
          if (lastMapping) {
            addMappingWithCode(lastMapping, shiftNextLine());
          }
          node.add(remainingLines.splice(remainingLinesIndex).join(""));
        }
        aSourceMapConsumer.sources.forEach(function(sourceFile) {
          var content = aSourceMapConsumer.sourceContentFor(sourceFile);
          if (content != null) {
            if (aRelativePath != null) {
              sourceFile = util.join(aRelativePath, sourceFile);
            }
            node.setSourceContent(sourceFile, content);
          }
        });
        return node;
        function addMappingWithCode(mapping, code) {
          if (mapping === null || mapping.source === void 0) {
            node.add(code);
          } else {
            var source = aRelativePath ? util.join(aRelativePath, mapping.source) : mapping.source;
            node.add(new SourceNode(
              mapping.originalLine,
              mapping.originalColumn,
              source,
              code,
              mapping.name
            ));
          }
        }
      };
      SourceNode.prototype.add = function SourceNode_add(aChunk) {
        if (Array.isArray(aChunk)) {
          aChunk.forEach(function(chunk) {
            this.add(chunk);
          }, this);
        } else if (aChunk[isSourceNode] || typeof aChunk === "string") {
          if (aChunk) {
            this.children.push(aChunk);
          }
        } else {
          throw new TypeError(
            "Expected a SourceNode, string, or an array of SourceNodes and strings. Got " + aChunk
          );
        }
        return this;
      };
      SourceNode.prototype.prepend = function SourceNode_prepend(aChunk) {
        if (Array.isArray(aChunk)) {
          for (var i = aChunk.length - 1; i >= 0; i--) {
            this.prepend(aChunk[i]);
          }
        } else if (aChunk[isSourceNode] || typeof aChunk === "string") {
          this.children.unshift(aChunk);
        } else {
          throw new TypeError(
            "Expected a SourceNode, string, or an array of SourceNodes and strings. Got " + aChunk
          );
        }
        return this;
      };
      SourceNode.prototype.walk = function SourceNode_walk(aFn) {
        var chunk;
        for (var i = 0, len = this.children.length; i < len; i++) {
          chunk = this.children[i];
          if (chunk[isSourceNode]) {
            chunk.walk(aFn);
          } else {
            if (chunk !== "") {
              aFn(chunk, {
                source: this.source,
                line: this.line,
                column: this.column,
                name: this.name
              });
            }
          }
        }
      };
      SourceNode.prototype.join = function SourceNode_join(aSep) {
        var newChildren;
        var i;
        var len = this.children.length;
        if (len > 0) {
          newChildren = [];
          for (i = 0; i < len - 1; i++) {
            newChildren.push(this.children[i]);
            newChildren.push(aSep);
          }
          newChildren.push(this.children[i]);
          this.children = newChildren;
        }
        return this;
      };
      SourceNode.prototype.replaceRight = function SourceNode_replaceRight(aPattern, aReplacement) {
        var lastChild = this.children[this.children.length - 1];
        if (lastChild[isSourceNode]) {
          lastChild.replaceRight(aPattern, aReplacement);
        } else if (typeof lastChild === "string") {
          this.children[this.children.length - 1] = lastChild.replace(aPattern, aReplacement);
        } else {
          this.children.push("".replace(aPattern, aReplacement));
        }
        return this;
      };
      SourceNode.prototype.setSourceContent = function SourceNode_setSourceContent(aSourceFile, aSourceContent) {
        this.sourceContents[util.toSetString(aSourceFile)] = aSourceContent;
      };
      SourceNode.prototype.walkSourceContents = function SourceNode_walkSourceContents(aFn) {
        for (var i = 0, len = this.children.length; i < len; i++) {
          if (this.children[i][isSourceNode]) {
            this.children[i].walkSourceContents(aFn);
          }
        }
        var sources = Object.keys(this.sourceContents);
        for (var i = 0, len = sources.length; i < len; i++) {
          aFn(util.fromSetString(sources[i]), this.sourceContents[sources[i]]);
        }
      };
      SourceNode.prototype.toString = function SourceNode_toString() {
        var str = "";
        this.walk(function(chunk) {
          str += chunk;
        });
        return str;
      };
      SourceNode.prototype.toStringWithSourceMap = function SourceNode_toStringWithSourceMap(aArgs) {
        var generated = {
          code: "",
          line: 1,
          column: 0
        };
        var map = new SourceMapGenerator(aArgs);
        var sourceMappingActive = false;
        var lastOriginalSource = null;
        var lastOriginalLine = null;
        var lastOriginalColumn = null;
        var lastOriginalName = null;
        this.walk(function(chunk, original) {
          generated.code += chunk;
          if (original.source !== null && original.line !== null && original.column !== null) {
            if (lastOriginalSource !== original.source || lastOriginalLine !== original.line || lastOriginalColumn !== original.column || lastOriginalName !== original.name) {
              map.addMapping({
                source: original.source,
                original: {
                  line: original.line,
                  column: original.column
                },
                generated: {
                  line: generated.line,
                  column: generated.column
                },
                name: original.name
              });
            }
            lastOriginalSource = original.source;
            lastOriginalLine = original.line;
            lastOriginalColumn = original.column;
            lastOriginalName = original.name;
            sourceMappingActive = true;
          } else if (sourceMappingActive) {
            map.addMapping({
              generated: {
                line: generated.line,
                column: generated.column
              }
            });
            lastOriginalSource = null;
            sourceMappingActive = false;
          }
          for (var idx = 0, length = chunk.length; idx < length; idx++) {
            if (chunk.charCodeAt(idx) === NEWLINE_CODE) {
              generated.line++;
              generated.column = 0;
              if (idx + 1 === length) {
                lastOriginalSource = null;
                sourceMappingActive = false;
              } else if (sourceMappingActive) {
                map.addMapping({
                  source: original.source,
                  original: {
                    line: original.line,
                    column: original.column
                  },
                  generated: {
                    line: generated.line,
                    column: generated.column
                  },
                  name: original.name
                });
              }
            } else {
              generated.column++;
            }
          }
        });
        this.walkSourceContents(function(sourceFile, sourceContent) {
          map.setSourceContent(sourceFile, sourceContent);
        });
        return { code: generated.code, map };
      };
      exports.SourceNode = SourceNode;
    }
  });

  // ../node_modules/.pnpm/source-map-js@1.2.1/node_modules/source-map-js/source-map.js
  var require_source_map = __commonJS({
    "../node_modules/.pnpm/source-map-js@1.2.1/node_modules/source-map-js/source-map.js"(exports) {
      exports.SourceMapGenerator = require_source_map_generator().SourceMapGenerator;
      exports.SourceMapConsumer = require_source_map_consumer().SourceMapConsumer;
      exports.SourceNode = require_source_node().SourceNode;
    }
  });

  // ../node_modules/.pnpm/postcss@8.5.16/node_modules/postcss/lib/previous-map.js
  var require_previous_map = __commonJS({
    "../node_modules/.pnpm/postcss@8.5.16/node_modules/postcss/lib/previous-map.js"(exports, module) {
      "use strict";
      var { existsSync, readFileSync } = __require("fs");
      var { dirname, join } = __require("path");
      var { SourceMapConsumer, SourceMapGenerator } = require_source_map();
      function fromBase64(str) {
        if (Buffer) {
          return Buffer.from(str, "base64").toString();
        } else {
          return window.atob(str);
        }
      }
      var PreviousMap = class {
        constructor(css, opts) {
          if (opts.map === false) return;
          if (opts.unsafeMap) this.unsafeMap = true;
          this.loadAnnotation(css);
          this.inline = this.startWith(this.annotation, "data:");
          let prev = opts.map ? opts.map.prev : void 0;
          let text = this.loadMap(opts.from, prev);
          if (!this.mapFile && opts.from) {
            this.mapFile = opts.from;
          }
          if (this.mapFile) this.root = dirname(this.mapFile);
          if (text) this.text = text;
        }
        consumer() {
          if (!this.consumerCache) {
            this.consumerCache = new SourceMapConsumer(this.json || this.text);
          }
          return this.consumerCache;
        }
        decodeInline(text) {
          let baseCharsetUri = /^data:application\/json;charset=utf-?8;base64,/;
          let baseUri = /^data:application\/json;base64,/;
          let charsetUri = /^data:application\/json;charset=utf-?8,/;
          let uri = /^data:application\/json,/;
          let uriMatch = text.match(charsetUri) || text.match(uri);
          if (uriMatch) {
            return decodeURIComponent(text.substr(uriMatch[0].length));
          }
          let baseUriMatch = text.match(baseCharsetUri) || text.match(baseUri);
          if (baseUriMatch) {
            return fromBase64(text.substr(baseUriMatch[0].length));
          }
          let encoding = text.slice("data:application/json;".length);
          encoding = encoding.slice(0, encoding.indexOf(","));
          throw new Error("Unsupported source map encoding " + encoding);
        }
        getAnnotationURL(sourceMapString) {
          return sourceMapString.replace(/^\/\*\s*# sourceMappingURL=/, "").trim();
        }
        isMap(map) {
          if (typeof map !== "object") return false;
          return typeof map.mappings === "string" || typeof map._mappings === "string" || Array.isArray(map.sections);
        }
        loadAnnotation(css) {
          let comments = css.match(/\/\*\s*# sourceMappingURL=/g);
          if (!comments) return;
          let start = css.lastIndexOf(comments.pop());
          let end = css.indexOf("*/", start);
          if (start > -1 && end > -1) {
            this.annotation = this.getAnnotationURL(css.substring(start, end));
          }
        }
        loadFile(path, cssFile, trusted) {
          if (!trusted && !this.unsafeMap) {
            if (!/\.map$/i.test(path)) {
              return void 0;
            }
          }
          this.root = dirname(path);
          if (existsSync(path)) {
            this.mapFile = path;
            return readFileSync(path, "utf-8").toString().trim();
          }
        }
        loadMap(file, prev) {
          if (prev === false) return false;
          if (prev) {
            if (typeof prev === "string") {
              return prev;
            } else if (typeof prev === "function") {
              let prevPath = prev(file);
              if (prevPath) {
                let map = this.loadFile(prevPath, file, true);
                if (!map) {
                  throw new Error(
                    "Unable to load previous source map: " + prevPath.toString()
                  );
                }
                return map;
              }
            } else if (prev instanceof SourceMapConsumer) {
              return SourceMapGenerator.fromSourceMap(prev).toString();
            } else if (prev instanceof SourceMapGenerator) {
              return prev.toString();
            } else if (this.isMap(prev)) {
              return JSON.stringify(prev);
            } else {
              throw new Error(
                "Unsupported previous source map format: " + prev.toString()
              );
            }
          } else if (this.inline) {
            return this.decodeInline(this.annotation);
          } else if (this.annotation) {
            let map = this.annotation;
            if (file) map = join(dirname(file), map);
            let unknown = this.loadFile(map, file, false);
            if (unknown) {
              try {
                this.json = JSON.parse(unknown.replace(/^\)]}'[^\n]*\n/, ""));
              } catch {
                return void 0;
              }
            }
            return unknown;
          }
        }
        startWith(string, start) {
          if (!string) return false;
          return string.substr(0, start.length) === start;
        }
        withContent() {
          return !!(this.consumer().sourcesContent && this.consumer().sourcesContent.length > 0);
        }
      };
      module.exports = PreviousMap;
      PreviousMap.default = PreviousMap;
    }
  });

  // ../node_modules/.pnpm/postcss@8.5.16/node_modules/postcss/lib/input.js
  var require_input = __commonJS({
    "../node_modules/.pnpm/postcss@8.5.16/node_modules/postcss/lib/input.js"(exports, module) {
      "use strict";
      var { nanoid } = require_non_secure();
      var { isAbsolute, resolve } = __require("path");
      var { SourceMapConsumer, SourceMapGenerator } = require_source_map();
      var { fileURLToPath, pathToFileURL } = __require("url");
      var CssSyntaxError2 = require_css_syntax_error();
      var PreviousMap = require_previous_map();
      var terminalHighlight = require_terminal_highlight();
      var lineToIndexCache = /* @__PURE__ */ Symbol("lineToIndexCache");
      var sourceMapAvailable = Boolean(SourceMapConsumer && SourceMapGenerator);
      var pathAvailable = Boolean(resolve && isAbsolute);
      function getLineToIndex(input) {
        if (input[lineToIndexCache]) return input[lineToIndexCache];
        let lines = input.css.split("\n");
        let lineToIndex = new Array(lines.length);
        let prevIndex = 0;
        for (let i = 0, l = lines.length; i < l; i++) {
          lineToIndex[i] = prevIndex;
          prevIndex += lines[i].length + 1;
        }
        input[lineToIndexCache] = lineToIndex;
        return lineToIndex;
      }
      var Input2 = class {
        get from() {
          return this.file || this.id;
        }
        constructor(css, opts = {}) {
          if (css === null || typeof css === "undefined" || typeof css === "object" && !css.toString) {
            throw new Error(`PostCSS received ${css} instead of CSS string`);
          }
          this.css = css.toString();
          if (this.css[0] === "\uFEFF" || this.css[0] === "\uFFFE") {
            this.hasBOM = true;
            this.css = this.css.slice(1);
          } else {
            this.hasBOM = false;
          }
          this.document = this.css;
          if (opts.document) this.document = opts.document.toString();
          if (opts.from) {
            if (!pathAvailable || /^\w+:\/\//.test(opts.from) || isAbsolute(opts.from)) {
              this.file = opts.from;
            } else {
              this.file = resolve(opts.from);
            }
          }
          if (pathAvailable && sourceMapAvailable) {
            let map = new PreviousMap(this.css, opts);
            if (map.text) {
              this.map = map;
              let file = map.consumer().file;
              if (!this.file && file) this.file = this.mapResolve(file);
            }
          }
          if (!this.file) {
            this.id = "<input css " + nanoid(6) + ">";
          }
          if (this.map) this.map.file = this.from;
        }
        error(message, line, column, opts = {}) {
          let endColumn, endLine, endOffset, offset, result;
          if (line && typeof line === "object") {
            let start = line;
            let end = column;
            if (typeof start.offset === "number") {
              offset = start.offset;
              let pos = this.fromOffset(offset);
              line = pos.line;
              column = pos.col;
            } else {
              line = start.line;
              column = start.column;
              offset = this.fromLineAndColumn(line, column);
            }
            if (typeof end.offset === "number") {
              endOffset = end.offset;
              let pos = this.fromOffset(endOffset);
              endLine = pos.line;
              endColumn = pos.col;
            } else {
              endLine = end.line;
              endColumn = end.column;
              endOffset = this.fromLineAndColumn(end.line, end.column);
            }
          } else if (!column) {
            offset = line;
            let pos = this.fromOffset(offset);
            line = pos.line;
            column = pos.col;
          } else {
            offset = this.fromLineAndColumn(line, column);
          }
          let origin = this.origin(line, column, endLine, endColumn);
          if (origin) {
            result = new CssSyntaxError2(
              message,
              origin.endLine === void 0 ? origin.line : { column: origin.column, line: origin.line },
              origin.endLine === void 0 ? origin.column : { column: origin.endColumn, line: origin.endLine },
              origin.source,
              origin.file,
              opts.plugin
            );
          } else {
            result = new CssSyntaxError2(
              message,
              endLine === void 0 ? line : { column, line },
              endLine === void 0 ? column : { column: endColumn, line: endLine },
              this.css,
              this.file,
              opts.plugin
            );
          }
          result.input = {
            column,
            endColumn,
            endLine,
            endOffset,
            line,
            offset,
            source: this.css
          };
          if (this.file) {
            if (pathToFileURL) {
              result.input.url = pathToFileURL(this.file).toString();
            }
            result.input.file = this.file;
          }
          return result;
        }
        fromLineAndColumn(line, column) {
          let lineToIndex = getLineToIndex(this);
          let index = lineToIndex[line - 1];
          return index + column - 1;
        }
        fromOffset(offset) {
          let lineToIndex = getLineToIndex(this);
          let lastLine = lineToIndex[lineToIndex.length - 1];
          let min = 0;
          if (offset >= lastLine) {
            min = lineToIndex.length - 1;
          } else {
            let max = lineToIndex.length - 2;
            let mid;
            while (min < max) {
              mid = min + (max - min >> 1);
              if (offset < lineToIndex[mid]) {
                max = mid - 1;
              } else if (offset >= lineToIndex[mid + 1]) {
                min = mid + 1;
              } else {
                min = mid;
                break;
              }
            }
          }
          return {
            col: offset - lineToIndex[min] + 1,
            line: min + 1
          };
        }
        mapResolve(file) {
          if (/^\w+:\/\//.test(file)) {
            return file;
          }
          return resolve(this.map.consumer().sourceRoot || this.map.root || ".", file);
        }
        origin(line, column, endLine, endColumn) {
          if (!this.map) return false;
          let consumer = this.map.consumer();
          let from = consumer.originalPositionFor({ column: column - 1, line });
          if (!from.source) return false;
          let to;
          if (typeof endLine === "number") {
            to = consumer.originalPositionFor({
              column: endColumn - 1,
              line: endLine
            });
          }
          let fromUrl;
          if (isAbsolute(from.source)) {
            fromUrl = pathToFileURL(from.source);
          } else {
            fromUrl = new URL(
              from.source,
              this.map.consumer().sourceRoot || pathToFileURL(this.map.mapFile)
            );
          }
          let result = {
            column: from.column + 1,
            endColumn: to && to.column + 1,
            endLine: to && to.line,
            line: from.line,
            url: fromUrl.toString()
          };
          if (fromUrl.protocol === "file:") {
            if (fileURLToPath) {
              result.file = fileURLToPath(fromUrl);
            } else {
              throw new Error(`file: protocol is not available in this PostCSS build`);
            }
          }
          let source = consumer.sourceContentFor(from.source);
          if (source) result.source = source;
          return result;
        }
        toJSON() {
          let json = {};
          for (let name of ["hasBOM", "css", "file", "id"]) {
            if (this[name] != null) {
              json[name] = this[name];
            }
          }
          if (this.map) {
            json.map = { ...this.map };
            if (json.map.consumerCache) {
              json.map.consumerCache = void 0;
            }
          }
          return json;
        }
      };
      module.exports = Input2;
      Input2.default = Input2;
      if (terminalHighlight && terminalHighlight.registerInput) {
        terminalHighlight.registerInput(Input2);
      }
    }
  });

  // ../node_modules/.pnpm/postcss@8.5.16/node_modules/postcss/lib/root.js
  var require_root = __commonJS({
    "../node_modules/.pnpm/postcss@8.5.16/node_modules/postcss/lib/root.js"(exports, module) {
      "use strict";
      var Container2 = require_container();
      var LazyResult;
      var Processor2;
      var Root3 = class extends Container2 {
        constructor(defaults) {
          super(defaults);
          this.type = "root";
          if (!this.nodes) this.nodes = [];
        }
        normalize(child, sample, type) {
          let nodes = super.normalize(child);
          if (sample) {
            if (type === "prepend") {
              if (this.nodes.length > 1) {
                sample.raws.before = this.nodes[1].raws.before;
              } else {
                delete sample.raws.before;
              }
            } else if (this.first !== sample) {
              for (let node of nodes) {
                node.raws.before = sample.raws.before;
              }
            }
          }
          return nodes;
        }
        removeChild(child, ignore) {
          let index = this.index(child);
          if (!ignore && index === 0 && this.nodes.length > 1) {
            this.nodes[1].raws.before = this.nodes[index].raws.before;
          }
          return super.removeChild(child);
        }
        toResult(opts = {}) {
          let lazy = new LazyResult(new Processor2(), this, opts);
          return lazy.stringify();
        }
      };
      Root3.registerLazyResult = (dependant) => {
        LazyResult = dependant;
      };
      Root3.registerProcessor = (dependant) => {
        Processor2 = dependant;
      };
      module.exports = Root3;
      Root3.default = Root3;
      Container2.registerRoot(Root3);
    }
  });

  // ../node_modules/.pnpm/postcss@8.5.16/node_modules/postcss/lib/list.js
  var require_list = __commonJS({
    "../node_modules/.pnpm/postcss@8.5.16/node_modules/postcss/lib/list.js"(exports, module) {
      "use strict";
      var list2 = {
        comma(string) {
          return list2.split(string, [","], true);
        },
        space(string) {
          let spaces = [" ", "\n", "	"];
          return list2.split(string, spaces);
        },
        split(string, separators, last) {
          let array = [];
          let current = "";
          let split = false;
          let func = 0;
          let inQuote = false;
          let prevQuote = "";
          let escape3 = false;
          for (let letter of string) {
            if (escape3) {
              escape3 = false;
            } else if (letter === "\\") {
              escape3 = true;
            } else if (inQuote) {
              if (letter === prevQuote) {
                inQuote = false;
              }
            } else if (letter === '"' || letter === "'") {
              inQuote = true;
              prevQuote = letter;
            } else if (letter === "(") {
              func += 1;
            } else if (letter === ")") {
              if (func > 0) func -= 1;
            } else if (func === 0) {
              if (separators.includes(letter)) split = true;
            }
            if (split) {
              if (current !== "") array.push(current.trim());
              current = "";
              split = false;
            } else {
              current += letter;
            }
          }
          if (last || current !== "") array.push(current.trim());
          return array;
        }
      };
      module.exports = list2;
      list2.default = list2;
    }
  });

  // ../node_modules/.pnpm/postcss@8.5.16/node_modules/postcss/lib/rule.js
  var require_rule = __commonJS({
    "../node_modules/.pnpm/postcss@8.5.16/node_modules/postcss/lib/rule.js"(exports, module) {
      "use strict";
      var Container2 = require_container();
      var list2 = require_list();
      var Rule2 = class extends Container2 {
        get selectors() {
          return list2.comma(this.selector);
        }
        set selectors(values) {
          let match = this.selector ? this.selector.match(/,\s*/) : null;
          let sep = match ? match[0] : "," + this.raw("between", "beforeOpen");
          this.selector = values.join(sep);
        }
        constructor(defaults) {
          super(defaults);
          this.type = "rule";
          if (!this.nodes) this.nodes = [];
        }
      };
      module.exports = Rule2;
      Rule2.default = Rule2;
      Container2.registerRule(Rule2);
    }
  });

  // ../node_modules/.pnpm/postcss@8.5.16/node_modules/postcss/lib/fromJSON.js
  var require_fromJSON = __commonJS({
    "../node_modules/.pnpm/postcss@8.5.16/node_modules/postcss/lib/fromJSON.js"(exports, module) {
      "use strict";
      var AtRule2 = require_at_rule();
      var Comment6 = require_comment();
      var Declaration2 = require_declaration();
      var Input2 = require_input();
      var PreviousMap = require_previous_map();
      var Root3 = require_root();
      var Rule2 = require_rule();
      function fromJSON2(json, inputs) {
        if (Array.isArray(json)) return json.map((n) => fromJSON2(n));
        let { inputs: ownInputs, ...defaults } = json;
        if (ownInputs) {
          inputs = [];
          for (let input of ownInputs) {
            let inputHydrated = { ...input, __proto__: Input2.prototype };
            if (inputHydrated.map) {
              inputHydrated.map = {
                ...inputHydrated.map,
                __proto__: PreviousMap.prototype
              };
            }
            inputs.push(inputHydrated);
          }
        }
        let nodes;
        if (defaults.nodes) {
          nodes = json.nodes.map((n) => fromJSON2(n, inputs));
          delete defaults.nodes;
        }
        if (defaults.source) {
          let { inputId, ...source } = defaults.source;
          defaults.source = source;
          if (inputId != null) {
            defaults.source.input = inputs[inputId];
          }
        }
        let node;
        if (defaults.type === "root") {
          node = new Root3(defaults);
        } else if (defaults.type === "decl") {
          node = new Declaration2(defaults);
        } else if (defaults.type === "rule") {
          node = new Rule2(defaults);
        } else if (defaults.type === "comment") {
          node = new Comment6(defaults);
        } else if (defaults.type === "atrule") {
          node = new AtRule2(defaults);
        } else {
          throw new Error("Unknown node type: " + json.type);
        }
        if (nodes) {
          node.nodes = nodes;
          for (let child of nodes) child.parent = node;
        }
        return node;
      }
      module.exports = fromJSON2;
      fromJSON2.default = fromJSON2;
    }
  });

  // ../node_modules/.pnpm/postcss@8.5.16/node_modules/postcss/lib/map-generator.js
  var require_map_generator = __commonJS({
    "../node_modules/.pnpm/postcss@8.5.16/node_modules/postcss/lib/map-generator.js"(exports, module) {
      "use strict";
      var { dirname, relative, resolve, sep } = __require("path");
      var { SourceMapConsumer, SourceMapGenerator } = require_source_map();
      var { pathToFileURL } = __require("url");
      var Input2 = require_input();
      var sourceMapAvailable = Boolean(SourceMapConsumer && SourceMapGenerator);
      var pathAvailable = Boolean(dirname && resolve && relative && sep);
      var MapGenerator = class {
        constructor(stringify2, root2, opts, cssString) {
          this.stringify = stringify2;
          this.mapOpts = opts.map || {};
          this.root = root2;
          this.opts = opts;
          this.css = cssString;
          this.originalCSS = cssString;
          this.usesFileUrls = !this.mapOpts.from && this.mapOpts.absolute;
          this.memoizedFileURLs = /* @__PURE__ */ new Map();
          this.memoizedPaths = /* @__PURE__ */ new Map();
          this.memoizedURLs = /* @__PURE__ */ new Map();
        }
        addAnnotation() {
          let content;
          if (this.isInline()) {
            content = "data:application/json;base64," + this.toBase64(this.map.toString());
          } else if (typeof this.mapOpts.annotation === "string") {
            content = this.mapOpts.annotation;
          } else if (typeof this.mapOpts.annotation === "function") {
            content = this.mapOpts.annotation(this.opts.to, this.root);
          } else {
            content = this.outputFile() + ".map";
          }
          let eol = "\n";
          if (this.css.includes("\r\n")) eol = "\r\n";
          this.css += eol + "/*# sourceMappingURL=" + content + " */";
        }
        applyPrevMaps() {
          for (let prev of this.previous()) {
            let from = this.toUrl(this.path(prev.file));
            let root2 = prev.root || dirname(prev.file);
            let map;
            if (this.mapOpts.sourcesContent === false) {
              map = new SourceMapConsumer(prev.text);
              if (map.sourcesContent) {
                map.sourcesContent = null;
              }
            } else {
              map = prev.consumer();
            }
            this.map.applySourceMap(map, from, this.toUrl(this.path(root2)));
          }
        }
        clearAnnotation() {
          if (this.mapOpts.annotation === false) return;
          if (this.root) {
            let node;
            for (let i = this.root.nodes.length - 1; i >= 0; i--) {
              node = this.root.nodes[i];
              if (node.type !== "comment") continue;
              if (node.text.startsWith("# sourceMappingURL=")) {
                this.root.removeChild(i);
              }
            }
          } else if (this.css) {
            let startIndex;
            while ((startIndex = this.css.lastIndexOf("/*#")) !== -1) {
              let endIndex = this.css.indexOf("*/", startIndex + 3);
              if (endIndex === -1) break;
              while (startIndex > 0 && this.css[startIndex - 1] === "\n") {
                startIndex--;
              }
              this.css = this.css.slice(0, startIndex) + this.css.slice(endIndex + 2);
            }
          }
        }
        generate() {
          this.clearAnnotation();
          if (pathAvailable && sourceMapAvailable && this.isMap()) {
            return this.generateMap();
          } else {
            let result = "";
            this.stringify(this.root, (i) => {
              result += i;
            });
            return [result];
          }
        }
        generateMap() {
          if (this.root) {
            this.generateString();
          } else if (this.previous().length === 1) {
            let prev = this.previous()[0].consumer();
            prev.file = this.outputFile();
            this.map = SourceMapGenerator.fromSourceMap(prev, {
              ignoreInvalidMapping: true
            });
          } else {
            this.map = new SourceMapGenerator({
              file: this.outputFile(),
              ignoreInvalidMapping: true
            });
            this.map.addMapping({
              generated: { column: 0, line: 1 },
              original: { column: 0, line: 1 },
              source: this.opts.from ? this.toUrl(this.path(this.opts.from)) : "<no source>"
            });
          }
          if (this.isSourcesContent()) this.setSourcesContent();
          if (this.root && this.previous().length > 0) this.applyPrevMaps();
          if (this.isAnnotation()) this.addAnnotation();
          if (this.isInline()) {
            return [this.css];
          } else {
            return [this.css, this.map];
          }
        }
        generateString() {
          this.css = "";
          this.map = new SourceMapGenerator({
            file: this.outputFile(),
            ignoreInvalidMapping: true
          });
          let line = 1;
          let column = 1;
          let noSource = "<no source>";
          let mapping = {
            generated: { column: 0, line: 0 },
            original: { column: 0, line: 0 },
            source: ""
          };
          let last, lines;
          this.stringify(this.root, (str, node, type) => {
            this.css += str;
            if (node && type !== "end") {
              mapping.generated.line = line;
              mapping.generated.column = column - 1;
              if (node.source && node.source.start) {
                mapping.source = this.sourcePath(node);
                mapping.original.line = node.source.start.line;
                mapping.original.column = node.source.start.column - 1;
                this.map.addMapping(mapping);
              } else {
                mapping.source = noSource;
                mapping.original.line = 1;
                mapping.original.column = 0;
                this.map.addMapping(mapping);
              }
            }
            lines = str.match(/\n/g);
            if (lines) {
              line += lines.length;
              last = str.lastIndexOf("\n");
              column = str.length - last;
            } else {
              column += str.length;
            }
            if (node && type !== "start") {
              let p = node.parent || { raws: {} };
              let childless = node.type === "decl" || node.type === "atrule" && !node.nodes;
              if (!childless || node !== p.last || p.raws.semicolon) {
                if (node.source && node.source.end) {
                  mapping.source = this.sourcePath(node);
                  mapping.original.line = node.source.end.line;
                  mapping.original.column = node.source.end.column - 1;
                  mapping.generated.line = line;
                  mapping.generated.column = column - 2;
                  this.map.addMapping(mapping);
                } else {
                  mapping.source = noSource;
                  mapping.original.line = 1;
                  mapping.original.column = 0;
                  mapping.generated.line = line;
                  mapping.generated.column = column - 1;
                  this.map.addMapping(mapping);
                }
              }
            }
          });
        }
        isAnnotation() {
          if (this.isInline()) {
            return true;
          }
          if (typeof this.mapOpts.annotation !== "undefined") {
            return this.mapOpts.annotation;
          }
          if (this.previous().length) {
            return this.previous().some((i) => i.annotation);
          }
          return true;
        }
        isInline() {
          if (typeof this.mapOpts.inline !== "undefined") {
            return this.mapOpts.inline;
          }
          let annotation = this.mapOpts.annotation;
          if (typeof annotation !== "undefined" && annotation !== true) {
            return false;
          }
          if (this.previous().length) {
            return this.previous().some((i) => i.inline);
          }
          return true;
        }
        isMap() {
          if (typeof this.opts.map !== "undefined") {
            return !!this.opts.map;
          }
          return this.previous().length > 0;
        }
        isSourcesContent() {
          if (typeof this.mapOpts.sourcesContent !== "undefined") {
            return this.mapOpts.sourcesContent;
          }
          if (this.previous().length) {
            return this.previous().some((i) => i.withContent());
          }
          return true;
        }
        outputFile() {
          if (this.opts.to) {
            return this.path(this.opts.to);
          } else if (this.opts.from) {
            return this.path(this.opts.from);
          } else {
            return "to.css";
          }
        }
        path(file) {
          if (this.mapOpts.absolute) return file;
          if (file.charCodeAt(0) === 60) return file;
          if (/^\w+:\/\//.test(file)) return file;
          let cached = this.memoizedPaths.get(file);
          if (cached) return cached;
          let from = this.opts.to ? dirname(this.opts.to) : ".";
          if (typeof this.mapOpts.annotation === "string") {
            from = dirname(resolve(from, this.mapOpts.annotation));
          }
          let path = relative(from, file);
          this.memoizedPaths.set(file, path);
          return path;
        }
        previous() {
          if (!this.previousMaps) {
            this.previousMaps = [];
            if (this.root) {
              this.root.walk((node) => {
                if (node.source && node.source.input.map) {
                  let map = node.source.input.map;
                  if (!this.previousMaps.includes(map)) {
                    this.previousMaps.push(map);
                  }
                }
              });
            } else {
              let input = new Input2(this.originalCSS, this.opts);
              if (input.map) this.previousMaps.push(input.map);
            }
          }
          return this.previousMaps;
        }
        setSourcesContent() {
          let already = {};
          if (this.root) {
            this.root.walk((node) => {
              if (node.source) {
                let from = node.source.input.from;
                if (from && !already[from]) {
                  already[from] = true;
                  let fromUrl = this.usesFileUrls ? this.toFileUrl(from) : this.toUrl(this.path(from));
                  this.map.setSourceContent(fromUrl, node.source.input.css);
                }
              }
            });
          } else if (this.css) {
            let from = this.opts.from ? this.toUrl(this.path(this.opts.from)) : "<no source>";
            this.map.setSourceContent(from, this.css);
          }
        }
        sourcePath(node) {
          if (this.mapOpts.from) {
            return this.toUrl(this.mapOpts.from);
          } else if (this.usesFileUrls) {
            return this.toFileUrl(node.source.input.from);
          } else {
            return this.toUrl(this.path(node.source.input.from));
          }
        }
        toBase64(str) {
          if (Buffer) {
            return Buffer.from(str).toString("base64");
          } else {
            return window.btoa(unescape(encodeURIComponent(str)));
          }
        }
        toFileUrl(path) {
          let cached = this.memoizedFileURLs.get(path);
          if (cached) return cached;
          if (pathToFileURL) {
            let fileURL = pathToFileURL(path).toString();
            this.memoizedFileURLs.set(path, fileURL);
            return fileURL;
          } else {
            throw new Error(
              "`map.absolute` option is not available in this PostCSS build"
            );
          }
        }
        toUrl(path) {
          let cached = this.memoizedURLs.get(path);
          if (cached) return cached;
          if (sep === "\\") {
            path = path.replace(/\\/g, "/");
          }
          let url = encodeURI(path).replace(/[#?]/g, encodeURIComponent);
          this.memoizedURLs.set(path, url);
          return url;
        }
      };
      module.exports = MapGenerator;
    }
  });

  // ../node_modules/.pnpm/postcss@8.5.16/node_modules/postcss/lib/parser.js
  var require_parser = __commonJS({
    "../node_modules/.pnpm/postcss@8.5.16/node_modules/postcss/lib/parser.js"(exports, module) {
      "use strict";
      var AtRule2 = require_at_rule();
      var Comment6 = require_comment();
      var Declaration2 = require_declaration();
      var Root3 = require_root();
      var Rule2 = require_rule();
      var tokenizer = require_tokenize();
      var SAFE_COMMENT_NEIGHBOR = {
        empty: true,
        space: true
      };
      function findLastWithPosition(tokens) {
        for (let i = tokens.length - 1; i >= 0; i--) {
          let token = tokens[i];
          let pos = token[3] || token[2];
          if (pos) return pos;
        }
      }
      function tokensToString(tokens, from, to) {
        let result = "";
        for (let i = from; i < to; i++) result += tokens[i][1];
        return result;
      }
      var Parser3 = class {
        constructor(input) {
          this.input = input;
          this.root = new Root3();
          this.current = this.root;
          this.spaces = "";
          this.semicolon = false;
          this.createTokenizer();
          this.root.source = { input, start: { column: 1, line: 1, offset: 0 } };
        }
        atrule(token) {
          let node = new AtRule2();
          node.name = token[1].slice(1);
          if (node.name === "") {
            this.unnamedAtrule(node, token);
          }
          this.init(node, token[2]);
          let type;
          let prev;
          let shift;
          let last = false;
          let open = false;
          let params = [];
          let brackets = [];
          while (!this.tokenizer.endOfFile()) {
            token = this.tokenizer.nextToken();
            type = token[0];
            if (type === "(" || type === "[") {
              brackets.push(type === "(" ? ")" : "]");
            } else if (type === "{" && brackets.length > 0) {
              brackets.push("}");
            } else if (type === brackets[brackets.length - 1]) {
              brackets.pop();
            }
            if (brackets.length === 0) {
              if (type === ";") {
                node.source.end = this.getPosition(token[2]);
                node.source.end.offset++;
                this.semicolon = true;
                break;
              } else if (type === "{") {
                open = true;
                break;
              } else if (type === "}") {
                if (params.length > 0) {
                  shift = params.length - 1;
                  prev = params[shift];
                  while (prev && prev[0] === "space") {
                    prev = params[--shift];
                  }
                  if (prev) {
                    node.source.end = this.getPosition(prev[3] || prev[2]);
                    node.source.end.offset++;
                  }
                }
                this.end(token);
                break;
              } else {
                params.push(token);
              }
            } else {
              params.push(token);
            }
            if (this.tokenizer.endOfFile()) {
              last = true;
              break;
            }
          }
          node.raws.between = this.spacesAndCommentsFromEnd(params);
          if (params.length) {
            node.raws.afterName = this.spacesAndCommentsFromStart(params);
            this.raw(node, "params", params);
            if (last) {
              token = params[params.length - 1];
              node.source.end = this.getPosition(token[3] || token[2]);
              node.source.end.offset++;
              this.spaces = node.raws.between;
              node.raws.between = "";
            }
          } else {
            node.raws.afterName = "";
            node.params = "";
          }
          if (open) {
            node.nodes = [];
            this.current = node;
          }
        }
        checkMissedSemicolon(tokens) {
          let colon = this.colon(tokens);
          if (colon === false) return;
          let founded = 0;
          let token;
          for (let j = colon - 1; j >= 0; j--) {
            token = tokens[j];
            if (token[0] !== "space") {
              founded += 1;
              if (founded === 2) break;
            }
          }
          throw this.input.error(
            "Missed semicolon",
            token[0] === "word" ? token[3] + 1 : token[2]
          );
        }
        colon(tokens) {
          let brackets = 0;
          let prev, token, type;
          for (let [i, element] of tokens.entries()) {
            token = element;
            type = token[0];
            if (type === "(") {
              brackets += 1;
            }
            if (type === ")") {
              brackets -= 1;
            }
            if (brackets === 0 && type === ":") {
              if (!prev) {
                this.doubleColon(token);
              } else if (prev[0] === "word" && prev[1] === "progid") {
                continue;
              } else {
                return i;
              }
            }
            prev = token;
          }
          return false;
        }
        comment(token) {
          let node = new Comment6();
          this.init(node, token[2]);
          node.source.end = this.getPosition(token[3] || token[2]);
          node.source.end.offset++;
          let text = token[1].slice(2, -2);
          if (!text.trim()) {
            node.text = "";
            node.raws.left = text;
            node.raws.right = "";
          } else {
            let match = text.match(/^(\s*)([^]*\S)(\s*)$/);
            node.text = match[2];
            node.raws.left = match[1];
            node.raws.right = match[3];
          }
        }
        createTokenizer() {
          this.tokenizer = tokenizer(this.input);
        }
        decl(tokens, customProperty) {
          let node = new Declaration2();
          this.init(node, tokens[0][2]);
          let last = tokens[tokens.length - 1];
          if (last[0] === ";") {
            this.semicolon = true;
            tokens.pop();
          }
          node.source.end = this.getPosition(
            last[3] || last[2] || findLastWithPosition(tokens)
          );
          node.source.end.offset++;
          let start = 0;
          while (tokens[start][0] !== "word") {
            if (start === tokens.length - 1) this.unknownWord([tokens[start]]);
            start++;
          }
          node.raws.before += tokensToString(tokens, 0, start);
          node.source.start = this.getPosition(tokens[start][2]);
          let propStart = start;
          while (start < tokens.length) {
            let type = tokens[start][0];
            if (type === ":" || type === "space" || type === "comment") {
              break;
            }
            start++;
          }
          node.prop = tokensToString(tokens, propStart, start);
          let betweenStart = start;
          let token;
          while (start < tokens.length) {
            token = tokens[start];
            start++;
            if (token[0] === ":") break;
            if (token[0] === "word" && /\w/.test(token[1])) {
              this.unknownWord([token]);
            }
          }
          node.raws.between = tokensToString(tokens, betweenStart, start);
          if (node.prop[0] === "_" || node.prop[0] === "*") {
            node.raws.before += node.prop[0];
            node.prop = node.prop.slice(1);
          }
          let firstSpacesStart = start;
          while (start < tokens.length) {
            let next = tokens[start][0];
            if (next !== "space" && next !== "comment") break;
            start++;
          }
          let firstSpaces = tokens.slice(firstSpacesStart, start);
          tokens = tokens.slice(start);
          this.precheckMissedSemicolon(tokens);
          for (let i = tokens.length - 1; i >= 0; i--) {
            token = tokens[i];
            if (token[1].toLowerCase() === "!important") {
              node.important = true;
              let string = this.stringFrom(tokens, i);
              string = this.spacesFromEnd(tokens) + string;
              if (string !== " !important") node.raws.important = string;
              break;
            } else if (token[1].toLowerCase() === "important") {
              let cache2 = tokens.slice(0);
              let str = "";
              for (let j = i; j > 0; j--) {
                let type = cache2[j][0];
                if (str.trim().startsWith("!") && type !== "space") {
                  break;
                }
                str = cache2.pop()[1] + str;
              }
              if (str.trim().startsWith("!")) {
                node.important = true;
                node.raws.important = str;
                tokens = cache2;
              }
            }
            if (token[0] !== "space" && token[0] !== "comment") {
              break;
            }
          }
          let hasWord = tokens.some((i) => i[0] !== "space" && i[0] !== "comment");
          if (hasWord) {
            node.raws.between += firstSpaces.map((i) => i[1]).join("");
            firstSpaces = [];
          }
          this.raw(node, "value", firstSpaces.concat(tokens), customProperty);
          if (node.value.includes(":") && !customProperty) {
            this.checkMissedSemicolon(tokens);
          }
        }
        doubleColon(token) {
          throw this.input.error(
            "Double colon",
            { offset: token[2] },
            { offset: token[2] + token[1].length }
          );
        }
        emptyRule(token) {
          let node = new Rule2();
          this.init(node, token[2]);
          node.selector = "";
          node.raws.between = "";
          this.current = node;
        }
        end(token) {
          if (this.current.nodes && this.current.nodes.length) {
            this.current.raws.semicolon = this.semicolon;
          }
          this.semicolon = false;
          this.current.raws.after = (this.current.raws.after || "") + this.spaces;
          this.spaces = "";
          if (this.current.parent) {
            this.current.source.end = this.getPosition(token[2]);
            this.current.source.end.offset++;
            this.current = this.current.parent;
          } else {
            this.unexpectedClose(token);
          }
        }
        endFile() {
          if (this.current.parent) this.unclosedBlock();
          if (this.current.nodes && this.current.nodes.length) {
            this.current.raws.semicolon = this.semicolon;
          }
          this.current.raws.after = (this.current.raws.after || "") + this.spaces;
          this.root.source.end = this.getPosition(this.tokenizer.position());
        }
        freeSemicolon(token) {
          this.spaces += token[1];
          if (this.current.nodes) {
            let prev = this.current.nodes[this.current.nodes.length - 1];
            if (prev && prev.type === "rule" && !prev.raws.ownSemicolon) {
              prev.raws.ownSemicolon = this.spaces;
              this.spaces = "";
              prev.source.end = this.getPosition(token[2]);
              prev.source.end.offset += prev.raws.ownSemicolon.length;
            }
          }
        }
        // Helpers
        getPosition(offset) {
          let pos = this.input.fromOffset(offset);
          return {
            column: pos.col,
            line: pos.line,
            offset
          };
        }
        init(node, offset) {
          this.current.push(node);
          node.source = {
            input: this.input,
            start: this.getPosition(offset)
          };
          node.raws.before = this.spaces;
          this.spaces = "";
          if (node.type !== "comment") this.semicolon = false;
        }
        other(start) {
          let end = false;
          let type = null;
          let colon = false;
          let bracket = null;
          let brackets = [];
          let customProperty = start[1].startsWith("--");
          let tokens = [];
          let token = start;
          while (token) {
            type = token[0];
            tokens.push(token);
            if (type === "(" || type === "[") {
              if (!bracket) bracket = token;
              brackets.push(type === "(" ? ")" : "]");
            } else if (customProperty && colon && type === "{") {
              if (!bracket) bracket = token;
              brackets.push("}");
            } else if (brackets.length === 0) {
              if (type === ";") {
                if (colon) {
                  this.decl(tokens, customProperty);
                  return;
                } else {
                  break;
                }
              } else if (type === "{") {
                this.rule(tokens);
                return;
              } else if (type === "}") {
                this.tokenizer.back(tokens.pop());
                end = true;
                break;
              } else if (type === ":") {
                colon = true;
              }
            } else if (type === brackets[brackets.length - 1]) {
              brackets.pop();
              if (brackets.length === 0) bracket = null;
            }
            token = this.tokenizer.nextToken();
          }
          if (this.tokenizer.endOfFile()) end = true;
          if (brackets.length > 0) this.unclosedBracket(bracket);
          if (end && colon) {
            if (!customProperty) {
              while (tokens.length) {
                token = tokens[tokens.length - 1][0];
                if (token !== "space" && token !== "comment") break;
                this.tokenizer.back(tokens.pop());
              }
            }
            this.decl(tokens, customProperty);
          } else {
            this.unknownWord(tokens);
          }
        }
        parse() {
          let token;
          while (!this.tokenizer.endOfFile()) {
            token = this.tokenizer.nextToken();
            switch (token[0]) {
              case "space":
                this.spaces += token[1];
                break;
              case ";":
                this.freeSemicolon(token);
                break;
              case "}":
                this.end(token);
                break;
              case "comment":
                this.comment(token);
                break;
              case "at-word":
                this.atrule(token);
                break;
              case "{":
                this.emptyRule(token);
                break;
              default:
                this.other(token);
                break;
            }
          }
          this.endFile();
        }
        precheckMissedSemicolon() {
        }
        raw(node, prop2, tokens, customProperty) {
          let token, type;
          let length = tokens.length;
          let value = "";
          let clean = true;
          let next, prev;
          for (let i = 0; i < length; i += 1) {
            token = tokens[i];
            type = token[0];
            if (type === "space" && i === length - 1 && !customProperty) {
              clean = false;
            } else if (type === "comment") {
              prev = tokens[i - 1] ? tokens[i - 1][0] : "empty";
              next = tokens[i + 1] ? tokens[i + 1][0] : "empty";
              if (!SAFE_COMMENT_NEIGHBOR[prev] && !SAFE_COMMENT_NEIGHBOR[next]) {
                if (value.slice(-1) === ",") {
                  clean = false;
                } else {
                  value += token[1];
                }
              } else {
                clean = false;
              }
            } else {
              value += token[1];
            }
          }
          if (!clean) {
            let raw = tokens.reduce((all, i) => all + i[1], "");
            node.raws[prop2] = { raw, value };
          }
          node[prop2] = value;
        }
        rule(tokens) {
          tokens.pop();
          let node = new Rule2();
          this.init(node, tokens[0][2]);
          node.raws.between = this.spacesAndCommentsFromEnd(tokens);
          this.raw(node, "selector", tokens);
          this.current = node;
        }
        spacesAndCommentsFromEnd(tokens) {
          let lastTokenType;
          let spaces = "";
          while (tokens.length) {
            lastTokenType = tokens[tokens.length - 1][0];
            if (lastTokenType !== "space" && lastTokenType !== "comment") break;
            spaces = tokens.pop()[1] + spaces;
          }
          return spaces;
        }
        // Errors
        spacesAndCommentsFromStart(tokens) {
          let next;
          let spaces = "";
          while (tokens.length) {
            next = tokens[0][0];
            if (next !== "space" && next !== "comment") break;
            spaces += tokens.shift()[1];
          }
          return spaces;
        }
        spacesFromEnd(tokens) {
          let lastTokenType;
          let spaces = "";
          while (tokens.length) {
            lastTokenType = tokens[tokens.length - 1][0];
            if (lastTokenType !== "space") break;
            spaces = tokens.pop()[1] + spaces;
          }
          return spaces;
        }
        stringFrom(tokens, from) {
          let result = "";
          for (let i = from; i < tokens.length; i++) {
            result += tokens[i][1];
          }
          tokens.splice(from, tokens.length - from);
          return result;
        }
        unclosedBlock() {
          let pos = this.current.source.start;
          throw this.input.error("Unclosed block", pos.line, pos.column);
        }
        unclosedBracket(bracket) {
          throw this.input.error(
            "Unclosed bracket",
            { offset: bracket[2] },
            { offset: bracket[2] + 1 }
          );
        }
        unexpectedClose(token) {
          throw this.input.error(
            "Unexpected }",
            { offset: token[2] },
            { offset: token[2] + 1 }
          );
        }
        unknownWord(tokens) {
          throw this.input.error(
            "Unknown word " + tokens[0][1],
            { offset: tokens[0][2] },
            { offset: tokens[0][2] + tokens[0][1].length }
          );
        }
        unnamedAtrule(node, token) {
          throw this.input.error(
            "At-rule without name",
            { offset: token[2] },
            { offset: token[2] + token[1].length }
          );
        }
      };
      module.exports = Parser3;
    }
  });

  // ../node_modules/.pnpm/postcss@8.5.16/node_modules/postcss/lib/parse.js
  var require_parse2 = __commonJS({
    "../node_modules/.pnpm/postcss@8.5.16/node_modules/postcss/lib/parse.js"(exports, module) {
      "use strict";
      var Container2 = require_container();
      var Input2 = require_input();
      var Parser3 = require_parser();
      function parse6(css, opts) {
        let input = new Input2(css, opts);
        let parser = new Parser3(input);
        try {
          parser.parse();
        } catch (e) {
          if (process.env.NODE_ENV !== "production") {
            if (e.name === "CssSyntaxError" && opts && opts.from) {
              if (/\.scss$/i.test(opts.from)) {
                e.message += "\nYou tried to parse SCSS with the standard CSS parser; try again with the postcss-scss parser";
              } else if (/\.sass/i.test(opts.from)) {
                e.message += "\nYou tried to parse Sass with the standard CSS parser; try again with the postcss-sass parser";
              } else if (/\.less$/i.test(opts.from)) {
                e.message += "\nYou tried to parse Less with the standard CSS parser; try again with the postcss-less parser";
              }
            }
          }
          throw e;
        }
        return parser.root;
      }
      module.exports = parse6;
      parse6.default = parse6;
      Container2.registerParse(parse6);
    }
  });

  // ../node_modules/.pnpm/postcss@8.5.16/node_modules/postcss/lib/warning.js
  var require_warning = __commonJS({
    "../node_modules/.pnpm/postcss@8.5.16/node_modules/postcss/lib/warning.js"(exports, module) {
      "use strict";
      var Warning2 = class {
        constructor(text, opts = {}) {
          this.type = "warning";
          this.text = text;
          if (opts.node && opts.node.source) {
            let range = opts.node.rangeBy(opts);
            this.line = range.start.line;
            this.column = range.start.column;
            this.endLine = range.end.line;
            this.endColumn = range.end.column;
          }
          for (let opt in opts) this[opt] = opts[opt];
        }
        toString() {
          if (this.node) {
            return this.node.error(this.text, {
              index: this.index,
              plugin: this.plugin,
              word: this.word
            }).message;
          }
          if (this.plugin) {
            return this.plugin + ": " + this.text;
          }
          return this.text;
        }
      };
      module.exports = Warning2;
      Warning2.default = Warning2;
    }
  });

  // ../node_modules/.pnpm/postcss@8.5.16/node_modules/postcss/lib/result.js
  var require_result = __commonJS({
    "../node_modules/.pnpm/postcss@8.5.16/node_modules/postcss/lib/result.js"(exports, module) {
      "use strict";
      var Warning2 = require_warning();
      var Result2 = class {
        get content() {
          return this.css;
        }
        constructor(processor, root2, opts) {
          this.processor = processor;
          this.messages = [];
          this.root = root2;
          this.opts = opts;
          this.css = "";
          this.map = void 0;
        }
        toString() {
          return this.css;
        }
        warn(text, opts = {}) {
          if (!opts.plugin) {
            if (this.lastPlugin && this.lastPlugin.postcssPlugin) {
              opts.plugin = this.lastPlugin.postcssPlugin;
            }
          }
          let warning = new Warning2(text, opts);
          this.messages.push(warning);
          return warning;
        }
        warnings() {
          return this.messages.filter((i) => i.type === "warning");
        }
      };
      module.exports = Result2;
      Result2.default = Result2;
    }
  });

  // ../node_modules/.pnpm/postcss@8.5.16/node_modules/postcss/lib/warn-once.js
  var require_warn_once = __commonJS({
    "../node_modules/.pnpm/postcss@8.5.16/node_modules/postcss/lib/warn-once.js"(exports, module) {
      "use strict";
      var printed = {};
      module.exports = function warnOnce(message) {
        if (printed[message]) return;
        printed[message] = true;
        if (typeof console !== "undefined" && console.warn) {
          console.warn(message);
        }
      };
    }
  });

  // ../node_modules/.pnpm/postcss@8.5.16/node_modules/postcss/lib/lazy-result.js
  var require_lazy_result = __commonJS({
    "../node_modules/.pnpm/postcss@8.5.16/node_modules/postcss/lib/lazy-result.js"(exports, module) {
      "use strict";
      var Container2 = require_container();
      var Document6 = require_document();
      var MapGenerator = require_map_generator();
      var parse6 = require_parse2();
      var Result2 = require_result();
      var Root3 = require_root();
      var stringify2 = require_stringify();
      var { isClean, my } = require_symbols();
      var warnOnce = require_warn_once();
      var TYPE_TO_CLASS_NAME = {
        atrule: "AtRule",
        comment: "Comment",
        decl: "Declaration",
        document: "Document",
        root: "Root",
        rule: "Rule"
      };
      var PLUGIN_PROPS = {
        AtRule: true,
        AtRuleExit: true,
        Comment: true,
        CommentExit: true,
        Declaration: true,
        DeclarationExit: true,
        Document: true,
        DocumentExit: true,
        Once: true,
        OnceExit: true,
        postcssPlugin: true,
        prepare: true,
        Root: true,
        RootExit: true,
        Rule: true,
        RuleExit: true
      };
      var NOT_VISITORS = {
        Once: true,
        postcssPlugin: true,
        prepare: true
      };
      var CHILDREN = 0;
      function isPromise(obj) {
        return typeof obj === "object" && typeof obj.then === "function";
      }
      function getEvents(node) {
        let key2 = false;
        let type = TYPE_TO_CLASS_NAME[node.type];
        if (node.type === "decl") {
          key2 = node.prop.toLowerCase();
        } else if (node.type === "atrule") {
          key2 = node.name.toLowerCase();
        }
        if (key2 && node.append) {
          return [
            type,
            type + "-" + key2,
            CHILDREN,
            type + "Exit",
            type + "Exit-" + key2
          ];
        } else if (key2) {
          return [type, type + "-" + key2, type + "Exit", type + "Exit-" + key2];
        } else if (node.append) {
          return [type, CHILDREN, type + "Exit"];
        } else {
          return [type, type + "Exit"];
        }
      }
      function toStack(node) {
        let events;
        if (node.type === "document") {
          events = ["Document", CHILDREN, "DocumentExit"];
        } else if (node.type === "root") {
          events = ["Root", CHILDREN, "RootExit"];
        } else {
          events = getEvents(node);
        }
        return {
          eventIndex: 0,
          events,
          iterator: 0,
          node,
          visitorIndex: 0,
          visitors: []
        };
      }
      function cleanMarks(node) {
        node[isClean] = false;
        if (node.nodes) node.nodes.forEach((i) => cleanMarks(i));
        return node;
      }
      var postcss2 = {};
      var LazyResult = class _LazyResult {
        get content() {
          return this.stringify().content;
        }
        get css() {
          return this.stringify().css;
        }
        get map() {
          return this.stringify().map;
        }
        get messages() {
          return this.sync().messages;
        }
        get opts() {
          return this.result.opts;
        }
        get processor() {
          return this.result.processor;
        }
        get root() {
          return this.sync().root;
        }
        get [Symbol.toStringTag]() {
          return "LazyResult";
        }
        constructor(processor, css, opts) {
          this.stringified = false;
          this.processed = false;
          let root2;
          if (typeof css === "object" && css !== null && (css.type === "root" || css.type === "document")) {
            root2 = cleanMarks(css);
          } else if (css instanceof _LazyResult || css instanceof Result2) {
            root2 = cleanMarks(css.root);
            if (css.map) {
              if (typeof opts.map === "undefined") opts.map = {};
              if (!opts.map.inline) opts.map.inline = false;
              opts.map.prev = css.map;
            }
          } else {
            let parser = parse6;
            if (opts.syntax) parser = opts.syntax.parse;
            if (opts.parser) parser = opts.parser;
            if (parser.parse) parser = parser.parse;
            try {
              root2 = parser(css, opts);
            } catch (error) {
              this.processed = true;
              this.error = error;
            }
            if (root2 && !root2[my]) {
              Container2.rebuild(root2);
            }
          }
          this.result = new Result2(processor, root2, opts);
          this.helpers = { ...postcss2, postcss: postcss2, result: this.result };
          this.plugins = this.processor.plugins.map((plugin2) => {
            if (typeof plugin2 === "object" && plugin2.prepare) {
              return { ...plugin2, ...plugin2.prepare(this.result) };
            } else {
              return plugin2;
            }
          });
        }
        async() {
          if (this.error) return Promise.reject(this.error);
          if (this.processed) return Promise.resolve(this.result);
          if (!this.processing) {
            this.processing = this.runAsync();
          }
          return this.processing;
        }
        catch(onRejected) {
          return this.async().catch(onRejected);
        }
        finally(onFinally) {
          return this.async().then(onFinally, onFinally);
        }
        getAsyncError() {
          throw new Error("Use process(css).then(cb) to work with async plugins");
        }
        handleError(error, node) {
          let plugin2 = this.result.lastPlugin;
          try {
            if (node) node.addToError(error);
            this.error = error;
            if (error.name === "CssSyntaxError" && !error.plugin) {
              error.plugin = plugin2.postcssPlugin;
              error.setMessage();
            } else if (plugin2.postcssVersion) {
              if (process.env.NODE_ENV !== "production") {
                let pluginName = plugin2.postcssPlugin;
                let pluginVer = plugin2.postcssVersion;
                let runtimeVer = this.result.processor.version;
                let a = pluginVer.split(".");
                let b = runtimeVer.split(".");
                if (a[0] !== b[0] || parseInt(a[1]) > parseInt(b[1])) {
                  console.error(
                    "Unknown error from PostCSS plugin. Your current PostCSS version is " + runtimeVer + ", but " + pluginName + " uses " + pluginVer + ". Perhaps this is the source of the error below."
                  );
                }
              }
            }
          } catch (err) {
            if (console && console.error) console.error(err);
          }
          return error;
        }
        prepareVisitors() {
          this.listeners = {};
          let add2 = (plugin2, type, cb) => {
            if (!this.listeners[type]) this.listeners[type] = [];
            this.listeners[type].push([plugin2, cb]);
          };
          for (let plugin2 of this.plugins) {
            if (typeof plugin2 === "object") {
              for (let event in plugin2) {
                if (!PLUGIN_PROPS[event] && /^[A-Z]/.test(event)) {
                  throw new Error(
                    `Unknown event ${event} in ${plugin2.postcssPlugin}. Try to update PostCSS (${this.processor.version} now).`
                  );
                }
                if (!NOT_VISITORS[event]) {
                  if (typeof plugin2[event] === "object") {
                    for (let filter2 in plugin2[event]) {
                      if (filter2 === "*") {
                        add2(plugin2, event, plugin2[event][filter2]);
                      } else {
                        add2(
                          plugin2,
                          event + "-" + filter2.toLowerCase(),
                          plugin2[event][filter2]
                        );
                      }
                    }
                  } else if (typeof plugin2[event] === "function") {
                    add2(plugin2, event, plugin2[event]);
                  }
                }
              }
            }
          }
          this.hasListener = Object.keys(this.listeners).length > 0;
        }
        async runAsync() {
          this.plugin = 0;
          for (let i = 0; i < this.plugins.length; i++) {
            let plugin2 = this.plugins[i];
            let promise = this.runOnRoot(plugin2);
            if (isPromise(promise)) {
              try {
                await promise;
              } catch (error) {
                throw this.handleError(error);
              }
            }
          }
          this.prepareVisitors();
          if (this.hasListener) {
            let root2 = this.result.root;
            while (!root2[isClean]) {
              root2[isClean] = true;
              let stack = [toStack(root2)];
              while (stack.length > 0) {
                let promise = this.visitTick(stack);
                if (isPromise(promise)) {
                  try {
                    await promise;
                  } catch (e) {
                    let node = stack[stack.length - 1].node;
                    throw this.handleError(e, node);
                  }
                }
              }
            }
            if (this.listeners.OnceExit) {
              for (let [plugin2, visitor] of this.listeners.OnceExit) {
                this.result.lastPlugin = plugin2;
                try {
                  if (root2.type === "document") {
                    let roots = root2.nodes.map(
                      (subRoot) => visitor(subRoot, this.helpers)
                    );
                    await Promise.all(roots);
                  } else {
                    await visitor(root2, this.helpers);
                  }
                } catch (e) {
                  throw this.handleError(e);
                }
              }
            }
          }
          this.processed = true;
          return this.stringify();
        }
        runOnRoot(plugin2) {
          this.result.lastPlugin = plugin2;
          try {
            if (typeof plugin2 === "object" && plugin2.Once) {
              if (this.result.root.type === "document") {
                let roots = this.result.root.nodes.map(
                  (root2) => plugin2.Once(root2, this.helpers)
                );
                if (isPromise(roots[0])) {
                  return Promise.all(roots);
                }
                return roots;
              }
              return plugin2.Once(this.result.root, this.helpers);
            } else if (typeof plugin2 === "function") {
              return plugin2(this.result.root, this.result);
            }
          } catch (error) {
            throw this.handleError(error);
          }
        }
        stringify() {
          if (this.error) throw this.error;
          if (this.stringified) return this.result;
          this.stringified = true;
          this.sync();
          let opts = this.result.opts;
          let str = stringify2;
          if (opts.syntax) str = opts.syntax.stringify;
          if (opts.stringifier) str = opts.stringifier;
          if (str.stringify) str = str.stringify;
          let rootSource = this.result.root.source;
          if (opts.map === void 0 && !(rootSource && rootSource.input && rootSource.input.map)) {
            let result = "";
            str(this.result.root, (i) => {
              result += i;
            });
            this.result.css = result;
            return this.result;
          }
          let map = new MapGenerator(str, this.result.root, this.result.opts);
          let data = map.generate();
          this.result.css = data[0];
          this.result.map = data[1];
          return this.result;
        }
        sync() {
          if (this.error) throw this.error;
          if (this.processed) return this.result;
          this.processed = true;
          if (this.processing) {
            throw this.getAsyncError();
          }
          for (let plugin2 of this.plugins) {
            let promise = this.runOnRoot(plugin2);
            if (isPromise(promise)) {
              throw this.getAsyncError();
            }
          }
          this.prepareVisitors();
          if (this.hasListener) {
            let root2 = this.result.root;
            while (!root2[isClean]) {
              root2[isClean] = true;
              this.walkSync(root2);
            }
            if (this.listeners.OnceExit) {
              if (root2.type === "document") {
                for (let subRoot of root2.nodes) {
                  this.visitSync(this.listeners.OnceExit, subRoot);
                }
              } else {
                this.visitSync(this.listeners.OnceExit, root2);
              }
            }
          }
          return this.result;
        }
        then(onFulfilled, onRejected) {
          if (process.env.NODE_ENV !== "production") {
            if (!("from" in this.opts)) {
              warnOnce(
                "Without `from` option PostCSS could generate wrong source map and will not find Browserslist config. Set it to CSS file path or to `undefined` to prevent this warning."
              );
            }
          }
          return this.async().then(onFulfilled, onRejected);
        }
        toString() {
          return this.css;
        }
        visitSync(visitors, node) {
          for (let [plugin2, visitor] of visitors) {
            this.result.lastPlugin = plugin2;
            let promise;
            try {
              promise = visitor(node, this.helpers);
            } catch (e) {
              throw this.handleError(e, node.proxyOf);
            }
            if (node.type !== "root" && node.type !== "document" && !node.parent) {
              return true;
            }
            if (isPromise(promise)) {
              throw this.getAsyncError();
            }
          }
        }
        visitTick(stack) {
          let visit = stack[stack.length - 1];
          let { node, visitors } = visit;
          if (node.type !== "root" && node.type !== "document" && !node.parent) {
            stack.pop();
            return;
          }
          if (visitors.length > 0 && visit.visitorIndex < visitors.length) {
            let [plugin2, visitor] = visitors[visit.visitorIndex];
            visit.visitorIndex += 1;
            if (visit.visitorIndex === visitors.length) {
              visit.visitors = [];
              visit.visitorIndex = 0;
            }
            this.result.lastPlugin = plugin2;
            try {
              return visitor(node.toProxy(), this.helpers);
            } catch (e) {
              throw this.handleError(e, node);
            }
          }
          if (visit.iterator !== 0) {
            let iterator = visit.iterator;
            let child;
            while (child = node.nodes[node.indexes[iterator]]) {
              node.indexes[iterator] += 1;
              if (!child[isClean]) {
                child[isClean] = true;
                stack.push(toStack(child));
                return;
              }
            }
            visit.iterator = 0;
            delete node.indexes[iterator];
          }
          let events = visit.events;
          while (visit.eventIndex < events.length) {
            let event = events[visit.eventIndex];
            visit.eventIndex += 1;
            if (event === CHILDREN) {
              if (node.nodes && node.nodes.length) {
                node[isClean] = true;
                visit.iterator = node.getIterator();
              }
              return;
            } else if (this.listeners[event]) {
              visit.visitors = this.listeners[event];
              return;
            }
          }
          stack.pop();
        }
        walkSync(node) {
          node[isClean] = true;
          let events = getEvents(node);
          for (let event of events) {
            if (event === CHILDREN) {
              if (node.nodes) {
                node.each((child) => {
                  if (!child[isClean]) this.walkSync(child);
                });
              }
            } else {
              let visitors = this.listeners[event];
              if (visitors) {
                if (this.visitSync(visitors, node.toProxy())) return;
              }
            }
          }
        }
        warnings() {
          return this.sync().warnings();
        }
      };
      LazyResult.registerPostcss = (dependant) => {
        postcss2 = dependant;
      };
      module.exports = LazyResult;
      LazyResult.default = LazyResult;
      Root3.registerLazyResult(LazyResult);
      Document6.registerLazyResult(LazyResult);
    }
  });

  // ../node_modules/.pnpm/postcss@8.5.16/node_modules/postcss/lib/no-work-result.js
  var require_no_work_result = __commonJS({
    "../node_modules/.pnpm/postcss@8.5.16/node_modules/postcss/lib/no-work-result.js"(exports, module) {
      "use strict";
      var MapGenerator = require_map_generator();
      var parse6 = require_parse2();
      var Result2 = require_result();
      var stringify2 = require_stringify();
      var warnOnce = require_warn_once();
      var NoWorkResult = class {
        get content() {
          return this.result.css;
        }
        get css() {
          return this.result.css;
        }
        get map() {
          return this.result.map;
        }
        get messages() {
          return [];
        }
        get opts() {
          return this.result.opts;
        }
        get processor() {
          return this.result.processor;
        }
        get root() {
          if (this._root) {
            return this._root;
          }
          let root2;
          let parser = parse6;
          try {
            root2 = parser(this._css, this._opts);
          } catch (error) {
            this.error = error;
          }
          if (this.error) {
            throw this.error;
          } else {
            this._root = root2;
            return root2;
          }
        }
        get [Symbol.toStringTag]() {
          return "NoWorkResult";
        }
        constructor(processor, css, opts) {
          css = css.toString();
          this.stringified = false;
          this._processor = processor;
          this._css = css;
          this._opts = opts;
          this._map = void 0;
          let str = stringify2;
          this.result = new Result2(this._processor, void 0, this._opts);
          this.result.css = css;
          let self = this;
          Object.defineProperty(this.result, "root", {
            get() {
              return self.root;
            }
          });
          let map = new MapGenerator(str, void 0, this._opts, css);
          if (map.isMap()) {
            let [generatedCSS, generatedMap] = map.generate();
            if (generatedCSS) {
              this.result.css = generatedCSS;
            }
            if (generatedMap) {
              this.result.map = generatedMap;
            }
          } else {
            map.clearAnnotation();
            this.result.css = map.css;
          }
        }
        async() {
          if (this.error) return Promise.reject(this.error);
          return Promise.resolve(this.result);
        }
        catch(onRejected) {
          return this.async().catch(onRejected);
        }
        finally(onFinally) {
          return this.async().then(onFinally, onFinally);
        }
        sync() {
          if (this.error) throw this.error;
          return this.result;
        }
        then(onFulfilled, onRejected) {
          if (process.env.NODE_ENV !== "production") {
            if (!("from" in this._opts)) {
              warnOnce(
                "Without `from` option PostCSS could generate wrong source map and will not find Browserslist config. Set it to CSS file path or to `undefined` to prevent this warning."
              );
            }
          }
          return this.async().then(onFulfilled, onRejected);
        }
        toString() {
          return this._css;
        }
        warnings() {
          return [];
        }
      };
      module.exports = NoWorkResult;
      NoWorkResult.default = NoWorkResult;
    }
  });

  // ../node_modules/.pnpm/postcss@8.5.16/node_modules/postcss/lib/processor.js
  var require_processor = __commonJS({
    "../node_modules/.pnpm/postcss@8.5.16/node_modules/postcss/lib/processor.js"(exports, module) {
      "use strict";
      var Document6 = require_document();
      var LazyResult = require_lazy_result();
      var NoWorkResult = require_no_work_result();
      var Root3 = require_root();
      var Processor2 = class {
        constructor(plugins = []) {
          this.version = "8.5.16";
          this.plugins = this.normalize(plugins);
        }
        normalize(plugins) {
          let normalized = [];
          for (let i of plugins) {
            if (i.postcss === true) {
              i = i();
            } else if (i.postcss) {
              i = i.postcss;
            }
            if (typeof i === "object" && Array.isArray(i.plugins)) {
              normalized = normalized.concat(i.plugins);
            } else if (typeof i === "object" && i.postcssPlugin) {
              normalized.push(i);
            } else if (typeof i === "function") {
              normalized.push(i);
            } else if (typeof i === "object" && (i.parse || i.stringify)) {
              if (process.env.NODE_ENV !== "production") {
                throw new Error(
                  "PostCSS syntaxes cannot be used as plugins. Instead, please use one of the syntax/parser/stringifier options as outlined in your PostCSS runner documentation."
                );
              }
            } else {
              throw new Error(i + " is not a PostCSS plugin");
            }
          }
          return normalized;
        }
        process(css, opts = {}) {
          if (!this.plugins.length && !opts.parser && !opts.stringifier && !opts.syntax) {
            return new NoWorkResult(this, css, opts);
          } else {
            return new LazyResult(this, css, opts);
          }
        }
        use(plugin2) {
          this.plugins = this.plugins.concat(this.normalize([plugin2]));
          return this;
        }
      };
      module.exports = Processor2;
      Processor2.default = Processor2;
      Root3.registerProcessor(Processor2);
      Document6.registerProcessor(Processor2);
    }
  });

  // ../node_modules/.pnpm/postcss@8.5.16/node_modules/postcss/lib/postcss.js
  var require_postcss = __commonJS({
    "../node_modules/.pnpm/postcss@8.5.16/node_modules/postcss/lib/postcss.js"(exports, module) {
      "use strict";
      var AtRule2 = require_at_rule();
      var Comment6 = require_comment();
      var Container2 = require_container();
      var CssSyntaxError2 = require_css_syntax_error();
      var Declaration2 = require_declaration();
      var Document6 = require_document();
      var fromJSON2 = require_fromJSON();
      var Input2 = require_input();
      var LazyResult = require_lazy_result();
      var list2 = require_list();
      var Node5 = require_node();
      var parse6 = require_parse2();
      var Processor2 = require_processor();
      var Result2 = require_result();
      var Root3 = require_root();
      var Rule2 = require_rule();
      var stringify2 = require_stringify();
      var Warning2 = require_warning();
      function postcss2(...plugins) {
        if (plugins.length === 1 && Array.isArray(plugins[0])) {
          plugins = plugins[0];
        }
        return new Processor2(plugins);
      }
      postcss2.plugin = function plugin2(name, initializer) {
        let warningPrinted = false;
        function creator(...args) {
          if (console && console.warn && !warningPrinted) {
            warningPrinted = true;
            console.warn(
              name + ": postcss.plugin was deprecated. Migration guide:\nhttps://evilmartians.com/chronicles/postcss-8-plugin-migration"
            );
            if (process.env.LANG && process.env.LANG.startsWith("cn")) {
              console.warn(
                name + ": \u91CC\u9762 postcss.plugin \u88AB\u5F03\u7528. \u8FC1\u79FB\u6307\u5357:\nhttps://www.w3ctech.com/topic/2226"
              );
            }
          }
          let transformer = initializer(...args);
          transformer.postcssPlugin = name;
          transformer.postcssVersion = new Processor2().version;
          return transformer;
        }
        let cache2;
        Object.defineProperty(creator, "postcss", {
          get() {
            if (!cache2) cache2 = creator();
            return cache2;
          }
        });
        creator.process = function(css, processOpts, pluginOpts) {
          return postcss2([creator(pluginOpts)]).process(css, processOpts);
        };
        return creator;
      };
      postcss2.stringify = stringify2;
      postcss2.parse = parse6;
      postcss2.fromJSON = fromJSON2;
      postcss2.list = list2;
      postcss2.comment = (defaults) => new Comment6(defaults);
      postcss2.atRule = (defaults) => new AtRule2(defaults);
      postcss2.decl = (defaults) => new Declaration2(defaults);
      postcss2.rule = (defaults) => new Rule2(defaults);
      postcss2.root = (defaults) => new Root3(defaults);
      postcss2.document = (defaults) => new Document6(defaults);
      postcss2.CssSyntaxError = CssSyntaxError2;
      postcss2.Declaration = Declaration2;
      postcss2.Container = Container2;
      postcss2.Processor = Processor2;
      postcss2.Document = Document6;
      postcss2.Comment = Comment6;
      postcss2.Warning = Warning2;
      postcss2.AtRule = AtRule2;
      postcss2.Result = Result2;
      postcss2.Input = Input2;
      postcss2.Rule = Rule2;
      postcss2.Root = Root3;
      postcss2.Node = Node5;
      LazyResult.registerPostcss(postcss2);
      module.exports = postcss2;
      postcss2.default = postcss2;
    }
  });

  // ../node_modules/.pnpm/postcss-selector-parser@7.1.4/node_modules/postcss-selector-parser/dist/util/unesc.js
  var require_unesc = __commonJS({
    "../node_modules/.pnpm/postcss-selector-parser@7.1.4/node_modules/postcss-selector-parser/dist/util/unesc.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.default = unesc;
      function gobbleHex(str) {
        var lower = str.toLowerCase();
        var hex = "";
        var spaceTerminated = false;
        for (var i = 0; i < 6 && lower[i] !== void 0; i++) {
          var code = lower.charCodeAt(i);
          var valid = code >= 97 && code <= 102 || code >= 48 && code <= 57;
          spaceTerminated = code === 32;
          if (!valid) {
            break;
          }
          hex += lower[i];
        }
        if (hex.length === 0) {
          return void 0;
        }
        var codePoint = parseInt(hex, 16);
        var isSurrogate = codePoint >= 55296 && codePoint <= 57343;
        if (isSurrogate || codePoint === 0 || codePoint > 1114111) {
          return ["\uFFFD", hex.length + (spaceTerminated ? 1 : 0)];
        }
        return [String.fromCodePoint(codePoint), hex.length + (spaceTerminated ? 1 : 0)];
      }
      var CONTAINS_ESCAPE = /\\/;
      function unesc(str) {
        var needToProcess = CONTAINS_ESCAPE.test(str);
        if (!needToProcess) {
          return str;
        }
        var ret = "";
        for (var i = 0; i < str.length; i++) {
          if (str[i] === "\\") {
            var gobbled = gobbleHex(str.slice(i + 1, i + 7));
            if (gobbled !== void 0) {
              ret += gobbled[0];
              i += gobbled[1];
              continue;
            }
            if (str[i + 1] === "\\") {
              ret += "\\";
              i++;
              continue;
            }
            if (str.length === i + 1) {
              ret += str[i];
            }
            continue;
          }
          ret += str[i];
        }
        return ret;
      }
    }
  });

  // ../node_modules/.pnpm/postcss-selector-parser@7.1.4/node_modules/postcss-selector-parser/dist/util/getProp.js
  var require_getProp = __commonJS({
    "../node_modules/.pnpm/postcss-selector-parser@7.1.4/node_modules/postcss-selector-parser/dist/util/getProp.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.default = getProp;
      function getProp(obj) {
        var props = [];
        for (var _i = 1; _i < arguments.length; _i++) {
          props[_i - 1] = arguments[_i];
        }
        while (props.length > 0) {
          var prop2 = props.shift();
          if (!obj[prop2]) {
            return void 0;
          }
          obj = obj[prop2];
        }
        return obj;
      }
    }
  });

  // ../node_modules/.pnpm/postcss-selector-parser@7.1.4/node_modules/postcss-selector-parser/dist/util/ensureObject.js
  var require_ensureObject = __commonJS({
    "../node_modules/.pnpm/postcss-selector-parser@7.1.4/node_modules/postcss-selector-parser/dist/util/ensureObject.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.default = ensureObject;
      function ensureObject(obj) {
        var props = [];
        for (var _i = 1; _i < arguments.length; _i++) {
          props[_i - 1] = arguments[_i];
        }
        while (props.length > 0) {
          var prop2 = props.shift();
          if (!obj[prop2]) {
            obj[prop2] = {};
          }
          obj = obj[prop2];
        }
      }
    }
  });

  // ../node_modules/.pnpm/postcss-selector-parser@7.1.4/node_modules/postcss-selector-parser/dist/util/stripComments.js
  var require_stripComments = __commonJS({
    "../node_modules/.pnpm/postcss-selector-parser@7.1.4/node_modules/postcss-selector-parser/dist/util/stripComments.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.default = stripComments;
      function stripComments(str) {
        var s = "";
        var commentStart = str.indexOf("/*");
        var lastEnd = 0;
        while (commentStart >= 0) {
          s = s + str.slice(lastEnd, commentStart);
          var commentEnd = str.indexOf("*/", commentStart + 2);
          if (commentEnd < 0) {
            return s;
          }
          lastEnd = commentEnd + 2;
          commentStart = str.indexOf("/*", lastEnd);
        }
        s = s + str.slice(lastEnd);
        return s;
      }
    }
  });

  // ../node_modules/.pnpm/postcss-selector-parser@7.1.4/node_modules/postcss-selector-parser/dist/util/maxNestingDepth.js
  var require_maxNestingDepth = __commonJS({
    "../node_modules/.pnpm/postcss-selector-parser@7.1.4/node_modules/postcss-selector-parser/dist/util/maxNestingDepth.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.MAX_NESTING_DEPTH = void 0;
      exports.default = resolveMaxNestingDepth;
      exports.MAX_NESTING_DEPTH = 256;
      function resolveMaxNestingDepth(value) {
        return Number.isSafeInteger(value) && value >= 0 ? value : exports.MAX_NESTING_DEPTH;
      }
    }
  });

  // ../node_modules/.pnpm/postcss-selector-parser@7.1.4/node_modules/postcss-selector-parser/dist/util/index.js
  var require_util2 = __commonJS({
    "../node_modules/.pnpm/postcss-selector-parser@7.1.4/node_modules/postcss-selector-parser/dist/util/index.js"(exports) {
      "use strict";
      var __importDefault = exports && exports.__importDefault || function(mod) {
        return mod && mod.__esModule ? mod : { "default": mod };
      };
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.MAX_NESTING_DEPTH = exports.resolveMaxNestingDepth = exports.stripComments = exports.ensureObject = exports.getProp = exports.unesc = void 0;
      var unesc_1 = require_unesc();
      Object.defineProperty(exports, "unesc", { enumerable: true, get: function() {
        return __importDefault(unesc_1).default;
      } });
      var getProp_1 = require_getProp();
      Object.defineProperty(exports, "getProp", { enumerable: true, get: function() {
        return __importDefault(getProp_1).default;
      } });
      var ensureObject_1 = require_ensureObject();
      Object.defineProperty(exports, "ensureObject", { enumerable: true, get: function() {
        return __importDefault(ensureObject_1).default;
      } });
      var stripComments_1 = require_stripComments();
      Object.defineProperty(exports, "stripComments", { enumerable: true, get: function() {
        return __importDefault(stripComments_1).default;
      } });
      var maxNestingDepth_1 = require_maxNestingDepth();
      Object.defineProperty(exports, "resolveMaxNestingDepth", { enumerable: true, get: function() {
        return __importDefault(maxNestingDepth_1).default;
      } });
      Object.defineProperty(exports, "MAX_NESTING_DEPTH", { enumerable: true, get: function() {
        return maxNestingDepth_1.MAX_NESTING_DEPTH;
      } });
    }
  });

  // ../node_modules/.pnpm/postcss-selector-parser@7.1.4/node_modules/postcss-selector-parser/dist/selectors/node.js
  var require_node2 = __commonJS({
    "../node_modules/.pnpm/postcss-selector-parser@7.1.4/node_modules/postcss-selector-parser/dist/selectors/node.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      var util_1 = require_util2();
      var cloneNode2 = function(obj, parent, depth) {
        if (depth === void 0) {
          depth = 0;
        }
        if (depth > util_1.MAX_NESTING_DEPTH) {
          throw new Error("Cannot clone selector: nesting depth exceeds the maximum of ".concat(util_1.MAX_NESTING_DEPTH, "."));
        }
        if (typeof obj !== "object" || obj === null) {
          return obj;
        }
        var cloned = new obj.constructor();
        for (var i in obj) {
          if (!obj.hasOwnProperty(i)) {
            continue;
          }
          var value = obj[i];
          var type = typeof value;
          if (i === "parent" && type === "object") {
            if (parent) {
              cloned[i] = parent;
            }
          } else if (value instanceof Array) {
            cloned[i] = value.map(function(j) {
              return cloneNode2(j, cloned, depth + 1);
            });
          } else {
            cloned[i] = cloneNode2(value, cloned, depth + 1);
          }
        }
        return cloned;
      };
      var Node5 = (
        /** @class */
        (function() {
          function Node6(opts) {
            if (opts === void 0) {
              opts = {};
            }
            Object.assign(this, opts);
            this.spaces = this.spaces || {};
            this.spaces.before = this.spaces.before || "";
            this.spaces.after = this.spaces.after || "";
          }
          Node6.prototype.remove = function() {
            if (this.parent) {
              this.parent.removeChild(this);
            }
            this.parent = void 0;
            return this;
          };
          Node6.prototype.replaceWith = function() {
            if (this.parent) {
              for (var index in arguments) {
                this.parent.insertBefore(this, arguments[index]);
              }
              this.remove();
            }
            return this;
          };
          Node6.prototype.next = function() {
            return this.parent.at(this.parent.index(this) + 1);
          };
          Node6.prototype.prev = function() {
            return this.parent.at(this.parent.index(this) - 1);
          };
          Node6.prototype.clone = function(overrides) {
            if (overrides === void 0) {
              overrides = {};
            }
            var cloned = cloneNode2(this);
            for (var name in overrides) {
              cloned[name] = overrides[name];
            }
            return cloned;
          };
          Node6.prototype.appendToPropertyAndEscape = function(name, value, valueEscaped) {
            if (!this.raws) {
              this.raws = {};
            }
            var originalValue = this[name];
            var originalEscaped = this.raws[name];
            this[name] = originalValue + value;
            if (originalEscaped || valueEscaped !== value) {
              this.raws[name] = (originalEscaped || originalValue) + valueEscaped;
            } else {
              delete this.raws[name];
            }
          };
          Node6.prototype.setPropertyAndEscape = function(name, value, valueEscaped) {
            if (!this.raws) {
              this.raws = {};
            }
            this[name] = value;
            this.raws[name] = valueEscaped;
          };
          Node6.prototype.setPropertyWithoutEscape = function(name, value) {
            this[name] = value;
            if (this.raws) {
              delete this.raws[name];
            }
          };
          Node6.prototype.isAtPosition = function(line, column) {
            if (this.source && this.source.start && this.source.end) {
              if (this.source.start.line > line) {
                return false;
              }
              if (this.source.end.line < line) {
                return false;
              }
              if (this.source.start.line === line && this.source.start.column > column) {
                return false;
              }
              if (this.source.end.line === line && this.source.end.column < column) {
                return false;
              }
              return true;
            }
            return void 0;
          };
          Node6.prototype.stringifyProperty = function(name) {
            return this.raws && this.raws[name] || this[name];
          };
          Object.defineProperty(Node6.prototype, "rawSpaceBefore", {
            get: function() {
              var rawSpace = this.raws && this.raws.spaces && this.raws.spaces.before;
              if (rawSpace === void 0) {
                rawSpace = this.spaces && this.spaces.before;
              }
              return rawSpace || "";
            },
            set: function(raw) {
              (0, util_1.ensureObject)(this, "raws", "spaces");
              this.raws.spaces.before = raw;
            },
            enumerable: false,
            configurable: true
          });
          Object.defineProperty(Node6.prototype, "rawSpaceAfter", {
            get: function() {
              var rawSpace = this.raws && this.raws.spaces && this.raws.spaces.after;
              if (rawSpace === void 0) {
                rawSpace = this.spaces.after;
              }
              return rawSpace || "";
            },
            set: function(raw) {
              (0, util_1.ensureObject)(this, "raws", "spaces");
              this.raws.spaces.after = raw;
            },
            enumerable: false,
            configurable: true
          });
          Node6.prototype.valueToString = function() {
            return String(this.stringifyProperty("value"));
          };
          Node6.prototype.toString = function() {
            return [this.rawSpaceBefore, this.valueToString(), this.rawSpaceAfter].join("");
          };
          Node6.prototype._stringify = function() {
            return this.toString();
          };
          return Node6;
        })()
      );
      exports.default = Node5;
    }
  });

  // ../node_modules/.pnpm/postcss-selector-parser@7.1.4/node_modules/postcss-selector-parser/dist/selectors/types.js
  var require_types = __commonJS({
    "../node_modules/.pnpm/postcss-selector-parser@7.1.4/node_modules/postcss-selector-parser/dist/selectors/types.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.UNIVERSAL = exports.ATTRIBUTE = exports.CLASS = exports.COMBINATOR = exports.COMMENT = exports.ID = exports.NESTING = exports.PSEUDO = exports.ROOT = exports.SELECTOR = exports.STRING = exports.TAG = void 0;
      exports.TAG = "tag";
      exports.STRING = "string";
      exports.SELECTOR = "selector";
      exports.ROOT = "root";
      exports.PSEUDO = "pseudo";
      exports.NESTING = "nesting";
      exports.ID = "id";
      exports.COMMENT = "comment";
      exports.COMBINATOR = "combinator";
      exports.CLASS = "class";
      exports.ATTRIBUTE = "attribute";
      exports.UNIVERSAL = "universal";
    }
  });

  // ../node_modules/.pnpm/postcss-selector-parser@7.1.4/node_modules/postcss-selector-parser/dist/selectors/container.js
  var require_container2 = __commonJS({
    "../node_modules/.pnpm/postcss-selector-parser@7.1.4/node_modules/postcss-selector-parser/dist/selectors/container.js"(exports) {
      "use strict";
      var __extends = exports && exports.__extends || /* @__PURE__ */ (function() {
        var extendStatics = function(d, b) {
          extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
            d2.__proto__ = b2;
          } || function(d2, b2) {
            for (var p in b2) if (Object.prototype.hasOwnProperty.call(b2, p)) d2[p] = b2[p];
          };
          return extendStatics(d, b);
        };
        return function(d, b) {
          if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
          extendStatics(d, b);
          function __() {
            this.constructor = d;
          }
          d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
        };
      })();
      var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
        if (k2 === void 0) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
          desc = { enumerable: true, get: function() {
            return m[k];
          } };
        }
        Object.defineProperty(o, k2, desc);
      }) : (function(o, m, k, k2) {
        if (k2 === void 0) k2 = k;
        o[k2] = m[k];
      }));
      var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? (function(o, v) {
        Object.defineProperty(o, "default", { enumerable: true, value: v });
      }) : function(o, v) {
        o["default"] = v;
      });
      var __importStar = exports && exports.__importStar || /* @__PURE__ */ (function() {
        var ownKeys = function(o) {
          ownKeys = Object.getOwnPropertyNames || function(o2) {
            var ar = [];
            for (var k in o2) if (Object.prototype.hasOwnProperty.call(o2, k)) ar[ar.length] = k;
            return ar;
          };
          return ownKeys(o);
        };
        return function(mod) {
          if (mod && mod.__esModule) return mod;
          var result = {};
          if (mod != null) {
            for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
          }
          __setModuleDefault(result, mod);
          return result;
        };
      })();
      var __values = exports && exports.__values || function(o) {
        var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
        if (m) return m.call(o);
        if (o && typeof o.length === "number") return {
          next: function() {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
          }
        };
        throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
      };
      var __read = exports && exports.__read || function(o, n) {
        var m = typeof Symbol === "function" && o[Symbol.iterator];
        if (!m) return o;
        var i = m.call(o), r, ar = [], e;
        try {
          while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
        } catch (error) {
          e = { error };
        } finally {
          try {
            if (r && !r.done && (m = i["return"])) m.call(i);
          } finally {
            if (e) throw e.error;
          }
        }
        return ar;
      };
      var __spreadArray = exports && exports.__spreadArray || function(to, from, pack) {
        if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
          if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
          }
        }
        return to.concat(ar || Array.prototype.slice.call(from));
      };
      var __importDefault = exports && exports.__importDefault || function(mod) {
        return mod && mod.__esModule ? mod : { "default": mod };
      };
      Object.defineProperty(exports, "__esModule", { value: true });
      var util_1 = require_util2();
      var node_1 = __importDefault(require_node2());
      var types = __importStar(require_types());
      var Container2 = (
        /** @class */
        (function(_super) {
          __extends(Container3, _super);
          function Container3(opts) {
            var _this = _super.call(this, opts) || this;
            if (!_this.nodes) {
              _this.nodes = [];
            }
            return _this;
          }
          Container3.prototype.append = function(selector) {
            selector.parent = this;
            this.nodes.push(selector);
            return this;
          };
          Container3.prototype.prepend = function(selector) {
            selector.parent = this;
            this.nodes.unshift(selector);
            for (var id in this.indexes) {
              this.indexes[id]++;
            }
            return this;
          };
          Container3.prototype.at = function(index) {
            return this.nodes[index];
          };
          Container3.prototype.index = function(child) {
            if (typeof child === "number") {
              return child;
            }
            return this.nodes.indexOf(child);
          };
          Object.defineProperty(Container3.prototype, "first", {
            get: function() {
              return this.at(0);
            },
            enumerable: false,
            configurable: true
          });
          Object.defineProperty(Container3.prototype, "last", {
            get: function() {
              return this.at(this.length - 1);
            },
            enumerable: false,
            configurable: true
          });
          Object.defineProperty(Container3.prototype, "length", {
            get: function() {
              return this.nodes.length;
            },
            enumerable: false,
            configurable: true
          });
          Container3.prototype.removeChild = function(child) {
            child = this.index(child);
            this.at(child).parent = void 0;
            this.nodes.splice(child, 1);
            var index;
            for (var id in this.indexes) {
              index = this.indexes[id];
              if (index >= child) {
                this.indexes[id] = index - 1;
              }
            }
            return this;
          };
          Container3.prototype.removeAll = function() {
            var e_1, _a3;
            try {
              for (var _b = __values(this.nodes), _c = _b.next(); !_c.done; _c = _b.next()) {
                var node = _c.value;
                node.parent = void 0;
              }
            } catch (e_1_1) {
              e_1 = { error: e_1_1 };
            } finally {
              try {
                if (_c && !_c.done && (_a3 = _b.return)) _a3.call(_b);
              } finally {
                if (e_1) throw e_1.error;
              }
            }
            this.nodes = [];
            return this;
          };
          Container3.prototype.empty = function() {
            return this.removeAll();
          };
          Container3.prototype.insertAfter = function(oldNode, newNode) {
            var _a3;
            newNode.parent = this;
            var oldIndex = this.index(oldNode);
            var resetNode = [];
            for (var i = 2; i < arguments.length; i++) {
              resetNode.push(arguments[i]);
            }
            (_a3 = this.nodes).splice.apply(_a3, __spreadArray([oldIndex + 1, 0, newNode], __read(resetNode), false));
            newNode.parent = this;
            var index;
            for (var id in this.indexes) {
              index = this.indexes[id];
              if (oldIndex < index) {
                this.indexes[id] = index + arguments.length - 1;
              }
            }
            return this;
          };
          Container3.prototype.insertBefore = function(oldNode, newNode) {
            var _a3;
            newNode.parent = this;
            var oldIndex = this.index(oldNode);
            var resetNode = [];
            for (var i = 2; i < arguments.length; i++) {
              resetNode.push(arguments[i]);
            }
            (_a3 = this.nodes).splice.apply(_a3, __spreadArray([oldIndex, 0, newNode], __read(resetNode), false));
            newNode.parent = this;
            var index;
            for (var id in this.indexes) {
              index = this.indexes[id];
              if (index >= oldIndex) {
                this.indexes[id] = index + arguments.length - 1;
              }
            }
            return this;
          };
          Container3.prototype._findChildAtPosition = function(line, col) {
            var found = void 0;
            this.each(function(node) {
              if (node.atPosition) {
                var foundChild = node.atPosition(line, col);
                if (foundChild) {
                  found = foundChild;
                  return false;
                }
              } else if (node.isAtPosition(line, col)) {
                found = node;
                return false;
              }
            });
            return found;
          };
          Container3.prototype.atPosition = function(line, col) {
            if (this.isAtPosition(line, col)) {
              return this._findChildAtPosition(line, col) || this;
            } else {
              return void 0;
            }
          };
          Container3.prototype._inferEndPosition = function() {
            if (this.last && this.last.source && this.last.source.end) {
              this.source = this.source || {};
              this.source.end = this.source.end || {};
              Object.assign(this.source.end, this.last.source.end);
            }
          };
          Container3.prototype.each = function(callback) {
            if (!this.lastEach) {
              this.lastEach = 0;
            }
            if (!this.indexes) {
              this.indexes = {};
            }
            this.lastEach++;
            var id = this.lastEach;
            this.indexes[id] = 0;
            if (!this.length) {
              return void 0;
            }
            var index, result;
            while (this.indexes[id] < this.length) {
              index = this.indexes[id];
              result = callback(this.at(index), index);
              if (result === false) {
                break;
              }
              this.indexes[id] += 1;
            }
            delete this.indexes[id];
            if (result === false) {
              return false;
            }
          };
          Container3.prototype.walk = function(callback, depth) {
            if (depth === void 0) {
              depth = 0;
            }
            if (depth > util_1.MAX_NESTING_DEPTH) {
              throw new Error("Cannot walk selector: nesting depth exceeds the maximum of ".concat(util_1.MAX_NESTING_DEPTH, "."));
            }
            return this.each(function(node, i) {
              var result = callback(node, i);
              if (result !== false && node.length) {
                result = node.walk(callback, depth + 1);
              }
              if (result === false) {
                return false;
              }
            });
          };
          Container3.prototype.walkAttributes = function(callback) {
            var _this = this;
            return this.walk(function(selector) {
              if (selector.type === types.ATTRIBUTE) {
                return callback.call(_this, selector);
              }
            });
          };
          Container3.prototype.walkClasses = function(callback) {
            var _this = this;
            return this.walk(function(selector) {
              if (selector.type === types.CLASS) {
                return callback.call(_this, selector);
              }
            });
          };
          Container3.prototype.walkCombinators = function(callback) {
            var _this = this;
            return this.walk(function(selector) {
              if (selector.type === types.COMBINATOR) {
                return callback.call(_this, selector);
              }
            });
          };
          Container3.prototype.walkComments = function(callback) {
            var _this = this;
            return this.walk(function(selector) {
              if (selector.type === types.COMMENT) {
                return callback.call(_this, selector);
              }
            });
          };
          Container3.prototype.walkIds = function(callback) {
            var _this = this;
            return this.walk(function(selector) {
              if (selector.type === types.ID) {
                return callback.call(_this, selector);
              }
            });
          };
          Container3.prototype.walkNesting = function(callback) {
            var _this = this;
            return this.walk(function(selector) {
              if (selector.type === types.NESTING) {
                return callback.call(_this, selector);
              }
            });
          };
          Container3.prototype.walkPseudos = function(callback) {
            var _this = this;
            return this.walk(function(selector) {
              if (selector.type === types.PSEUDO) {
                return callback.call(_this, selector);
              }
            });
          };
          Container3.prototype.walkTags = function(callback) {
            var _this = this;
            return this.walk(function(selector) {
              if (selector.type === types.TAG) {
                return callback.call(_this, selector);
              }
            });
          };
          Container3.prototype.walkUniversals = function(callback) {
            var _this = this;
            return this.walk(function(selector) {
              if (selector.type === types.UNIVERSAL) {
                return callback.call(_this, selector);
              }
            });
          };
          Container3.prototype.split = function(callback) {
            var _this = this;
            var current = [];
            return this.reduce(function(memo, node, index) {
              var split = callback.call(_this, node);
              current.push(node);
              if (split) {
                memo.push(current);
                current = [];
              } else if (index === _this.length - 1) {
                memo.push(current);
              }
              return memo;
            }, []);
          };
          Container3.prototype.map = function(callback) {
            return this.nodes.map(callback);
          };
          Container3.prototype.reduce = function(callback, memo) {
            return this.nodes.reduce(callback, memo);
          };
          Container3.prototype.every = function(callback) {
            return this.nodes.every(callback);
          };
          Container3.prototype.some = function(callback) {
            return this.nodes.some(callback);
          };
          Container3.prototype.filter = function(callback) {
            return this.nodes.filter(callback);
          };
          Container3.prototype.sort = function(callback) {
            return this.nodes.sort(callback);
          };
          Container3.prototype.toString = function(options) {
            if (options === void 0) {
              options = {};
            }
            return this._stringify(options, 0, (0, util_1.resolveMaxNestingDepth)(options.maxNestingDepth));
          };
          Container3.prototype._stringify = function(options, depth, max) {
            var _this = this;
            return this.map(function(child) {
              return _this._stringifyChild(child, options, depth, max);
            }).join("");
          };
          Container3.prototype._stringifyChild = function(child, options, depth, max) {
            return typeof child._stringify === "function" ? child._stringify(options, depth, max) : String(child);
          };
          return Container3;
        })(node_1.default)
      );
      exports.default = Container2;
    }
  });

  // ../node_modules/.pnpm/postcss-selector-parser@7.1.4/node_modules/postcss-selector-parser/dist/selectors/root.js
  var require_root2 = __commonJS({
    "../node_modules/.pnpm/postcss-selector-parser@7.1.4/node_modules/postcss-selector-parser/dist/selectors/root.js"(exports) {
      "use strict";
      var __extends = exports && exports.__extends || /* @__PURE__ */ (function() {
        var extendStatics = function(d, b) {
          extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
            d2.__proto__ = b2;
          } || function(d2, b2) {
            for (var p in b2) if (Object.prototype.hasOwnProperty.call(b2, p)) d2[p] = b2[p];
          };
          return extendStatics(d, b);
        };
        return function(d, b) {
          if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
          extendStatics(d, b);
          function __() {
            this.constructor = d;
          }
          d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
        };
      })();
      var __importDefault = exports && exports.__importDefault || function(mod) {
        return mod && mod.__esModule ? mod : { "default": mod };
      };
      Object.defineProperty(exports, "__esModule", { value: true });
      var container_1 = __importDefault(require_container2());
      var types_1 = require_types();
      var Root3 = (
        /** @class */
        (function(_super) {
          __extends(Root4, _super);
          function Root4(opts) {
            var _this = _super.call(this, opts) || this;
            _this.type = types_1.ROOT;
            return _this;
          }
          Root4.prototype._stringify = function(options, depth, max) {
            var _this = this;
            var str = this.reduce(function(memo, selector) {
              memo.push(_this._stringifyChild(selector, options, depth, max));
              return memo;
            }, []).join(",");
            return this.trailingComma ? str + "," : str;
          };
          Root4.prototype.error = function(message, options) {
            if (this._error) {
              return this._error(message, options);
            } else {
              return new Error(message);
            }
          };
          Object.defineProperty(Root4.prototype, "errorGenerator", {
            set: function(handler4) {
              this._error = handler4;
            },
            enumerable: false,
            configurable: true
          });
          return Root4;
        })(container_1.default)
      );
      exports.default = Root3;
    }
  });

  // ../node_modules/.pnpm/postcss-selector-parser@7.1.4/node_modules/postcss-selector-parser/dist/selectors/selector.js
  var require_selector = __commonJS({
    "../node_modules/.pnpm/postcss-selector-parser@7.1.4/node_modules/postcss-selector-parser/dist/selectors/selector.js"(exports) {
      "use strict";
      var __extends = exports && exports.__extends || /* @__PURE__ */ (function() {
        var extendStatics = function(d, b) {
          extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
            d2.__proto__ = b2;
          } || function(d2, b2) {
            for (var p in b2) if (Object.prototype.hasOwnProperty.call(b2, p)) d2[p] = b2[p];
          };
          return extendStatics(d, b);
        };
        return function(d, b) {
          if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
          extendStatics(d, b);
          function __() {
            this.constructor = d;
          }
          d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
        };
      })();
      var __importDefault = exports && exports.__importDefault || function(mod) {
        return mod && mod.__esModule ? mod : { "default": mod };
      };
      Object.defineProperty(exports, "__esModule", { value: true });
      var container_1 = __importDefault(require_container2());
      var types_1 = require_types();
      var Selector = (
        /** @class */
        (function(_super) {
          __extends(Selector2, _super);
          function Selector2(opts) {
            var _this = _super.call(this, opts) || this;
            _this.type = types_1.SELECTOR;
            return _this;
          }
          return Selector2;
        })(container_1.default)
      );
      exports.default = Selector;
    }
  });

  // ../node_modules/.pnpm/cssesc@3.0.0/node_modules/cssesc/cssesc.js
  var require_cssesc = __commonJS({
    "../node_modules/.pnpm/cssesc@3.0.0/node_modules/cssesc/cssesc.js"(exports, module) {
      "use strict";
      var object = {};
      var hasOwnProperty = object.hasOwnProperty;
      var merge = function merge2(options, defaults) {
        if (!options) {
          return defaults;
        }
        var result = {};
        for (var key2 in defaults) {
          result[key2] = hasOwnProperty.call(options, key2) ? options[key2] : defaults[key2];
        }
        return result;
      };
      var regexAnySingleEscape = /[ -,\.\/:-@\[-\^`\{-~]/;
      var regexSingleEscape = /[ -,\.\/:-@\[\]\^`\{-~]/;
      var regexExcessiveSpaces = /(^|\\+)?(\\[A-F0-9]{1,6})\x20(?![a-fA-F0-9\x20])/g;
      var cssesc = function cssesc2(string, options) {
        options = merge(options, cssesc2.options);
        if (options.quotes != "single" && options.quotes != "double") {
          options.quotes = "single";
        }
        var quote = options.quotes == "double" ? '"' : "'";
        var isIdentifier = options.isIdentifier;
        var firstChar = string.charAt(0);
        var output = "";
        var counter = 0;
        var length = string.length;
        while (counter < length) {
          var character = string.charAt(counter++);
          var codePoint = character.charCodeAt();
          var value = void 0;
          if (codePoint < 32 || codePoint > 126) {
            if (codePoint >= 55296 && codePoint <= 56319 && counter < length) {
              var extra = string.charCodeAt(counter++);
              if ((extra & 64512) == 56320) {
                codePoint = ((codePoint & 1023) << 10) + (extra & 1023) + 65536;
              } else {
                counter--;
              }
            }
            value = "\\" + codePoint.toString(16).toUpperCase() + " ";
          } else {
            if (options.escapeEverything) {
              if (regexAnySingleEscape.test(character)) {
                value = "\\" + character;
              } else {
                value = "\\" + codePoint.toString(16).toUpperCase() + " ";
              }
            } else if (/[\t\n\f\r\x0B]/.test(character)) {
              value = "\\" + codePoint.toString(16).toUpperCase() + " ";
            } else if (character == "\\" || !isIdentifier && (character == '"' && quote == character || character == "'" && quote == character) || isIdentifier && regexSingleEscape.test(character)) {
              value = "\\" + character;
            } else {
              value = character;
            }
          }
          output += value;
        }
        if (isIdentifier) {
          if (/^-[-\d]/.test(output)) {
            output = "\\-" + output.slice(1);
          } else if (/\d/.test(firstChar)) {
            output = "\\3" + firstChar + " " + output.slice(1);
          }
        }
        output = output.replace(regexExcessiveSpaces, function($0, $1, $2) {
          if ($1 && $1.length % 2) {
            return $0;
          }
          return ($1 || "") + $2;
        });
        if (!isIdentifier && options.wrap) {
          return quote + output + quote;
        }
        return output;
      };
      cssesc.options = {
        "escapeEverything": false,
        "isIdentifier": false,
        "quotes": "single",
        "wrap": false
      };
      cssesc.version = "3.0.0";
      module.exports = cssesc;
    }
  });

  // ../node_modules/.pnpm/postcss-selector-parser@7.1.4/node_modules/postcss-selector-parser/dist/selectors/className.js
  var require_className = __commonJS({
    "../node_modules/.pnpm/postcss-selector-parser@7.1.4/node_modules/postcss-selector-parser/dist/selectors/className.js"(exports) {
      "use strict";
      var __extends = exports && exports.__extends || /* @__PURE__ */ (function() {
        var extendStatics = function(d, b) {
          extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
            d2.__proto__ = b2;
          } || function(d2, b2) {
            for (var p in b2) if (Object.prototype.hasOwnProperty.call(b2, p)) d2[p] = b2[p];
          };
          return extendStatics(d, b);
        };
        return function(d, b) {
          if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
          extendStatics(d, b);
          function __() {
            this.constructor = d;
          }
          d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
        };
      })();
      var __importDefault = exports && exports.__importDefault || function(mod) {
        return mod && mod.__esModule ? mod : { "default": mod };
      };
      Object.defineProperty(exports, "__esModule", { value: true });
      var cssesc_1 = __importDefault(require_cssesc());
      var util_1 = require_util2();
      var node_1 = __importDefault(require_node2());
      var types_1 = require_types();
      var ClassName = (
        /** @class */
        (function(_super) {
          __extends(ClassName2, _super);
          function ClassName2(opts) {
            var _this = _super.call(this, opts) || this;
            _this.type = types_1.CLASS;
            _this._constructed = true;
            return _this;
          }
          Object.defineProperty(ClassName2.prototype, "value", {
            get: function() {
              return this._value;
            },
            set: function(v) {
              if (this._constructed) {
                var escaped = (0, cssesc_1.default)(v, { isIdentifier: true });
                if (escaped !== v) {
                  (0, util_1.ensureObject)(this, "raws");
                  this.raws.value = escaped;
                } else if (this.raws) {
                  delete this.raws.value;
                }
              }
              this._value = v;
            },
            enumerable: false,
            configurable: true
          });
          ClassName2.prototype.valueToString = function() {
            return "." + _super.prototype.valueToString.call(this);
          };
          return ClassName2;
        })(node_1.default)
      );
      exports.default = ClassName;
    }
  });

  // ../node_modules/.pnpm/postcss-selector-parser@7.1.4/node_modules/postcss-selector-parser/dist/selectors/comment.js
  var require_comment2 = __commonJS({
    "../node_modules/.pnpm/postcss-selector-parser@7.1.4/node_modules/postcss-selector-parser/dist/selectors/comment.js"(exports) {
      "use strict";
      var __extends = exports && exports.__extends || /* @__PURE__ */ (function() {
        var extendStatics = function(d, b) {
          extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
            d2.__proto__ = b2;
          } || function(d2, b2) {
            for (var p in b2) if (Object.prototype.hasOwnProperty.call(b2, p)) d2[p] = b2[p];
          };
          return extendStatics(d, b);
        };
        return function(d, b) {
          if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
          extendStatics(d, b);
          function __() {
            this.constructor = d;
          }
          d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
        };
      })();
      var __importDefault = exports && exports.__importDefault || function(mod) {
        return mod && mod.__esModule ? mod : { "default": mod };
      };
      Object.defineProperty(exports, "__esModule", { value: true });
      var node_1 = __importDefault(require_node2());
      var types_1 = require_types();
      var Comment6 = (
        /** @class */
        (function(_super) {
          __extends(Comment7, _super);
          function Comment7(opts) {
            var _this = _super.call(this, opts) || this;
            _this.type = types_1.COMMENT;
            return _this;
          }
          return Comment7;
        })(node_1.default)
      );
      exports.default = Comment6;
    }
  });

  // ../node_modules/.pnpm/postcss-selector-parser@7.1.4/node_modules/postcss-selector-parser/dist/selectors/id.js
  var require_id = __commonJS({
    "../node_modules/.pnpm/postcss-selector-parser@7.1.4/node_modules/postcss-selector-parser/dist/selectors/id.js"(exports) {
      "use strict";
      var __extends = exports && exports.__extends || /* @__PURE__ */ (function() {
        var extendStatics = function(d, b) {
          extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
            d2.__proto__ = b2;
          } || function(d2, b2) {
            for (var p in b2) if (Object.prototype.hasOwnProperty.call(b2, p)) d2[p] = b2[p];
          };
          return extendStatics(d, b);
        };
        return function(d, b) {
          if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
          extendStatics(d, b);
          function __() {
            this.constructor = d;
          }
          d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
        };
      })();
      var __importDefault = exports && exports.__importDefault || function(mod) {
        return mod && mod.__esModule ? mod : { "default": mod };
      };
      Object.defineProperty(exports, "__esModule", { value: true });
      var node_1 = __importDefault(require_node2());
      var types_1 = require_types();
      var ID = (
        /** @class */
        (function(_super) {
          __extends(ID2, _super);
          function ID2(opts) {
            var _this = _super.call(this, opts) || this;
            _this.type = types_1.ID;
            return _this;
          }
          ID2.prototype.valueToString = function() {
            return "#" + _super.prototype.valueToString.call(this);
          };
          return ID2;
        })(node_1.default)
      );
      exports.default = ID;
    }
  });

  // ../node_modules/.pnpm/postcss-selector-parser@7.1.4/node_modules/postcss-selector-parser/dist/selectors/namespace.js
  var require_namespace = __commonJS({
    "../node_modules/.pnpm/postcss-selector-parser@7.1.4/node_modules/postcss-selector-parser/dist/selectors/namespace.js"(exports) {
      "use strict";
      var __extends = exports && exports.__extends || /* @__PURE__ */ (function() {
        var extendStatics = function(d, b) {
          extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
            d2.__proto__ = b2;
          } || function(d2, b2) {
            for (var p in b2) if (Object.prototype.hasOwnProperty.call(b2, p)) d2[p] = b2[p];
          };
          return extendStatics(d, b);
        };
        return function(d, b) {
          if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
          extendStatics(d, b);
          function __() {
            this.constructor = d;
          }
          d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
        };
      })();
      var __importDefault = exports && exports.__importDefault || function(mod) {
        return mod && mod.__esModule ? mod : { "default": mod };
      };
      Object.defineProperty(exports, "__esModule", { value: true });
      var cssesc_1 = __importDefault(require_cssesc());
      var util_1 = require_util2();
      var node_1 = __importDefault(require_node2());
      var Namespace = (
        /** @class */
        (function(_super) {
          __extends(Namespace2, _super);
          function Namespace2() {
            return _super !== null && _super.apply(this, arguments) || this;
          }
          Object.defineProperty(Namespace2.prototype, "namespace", {
            get: function() {
              return this._namespace;
            },
            set: function(namespace) {
              if (namespace === true || namespace === "*" || namespace === "&") {
                this._namespace = namespace;
                if (this.raws) {
                  delete this.raws.namespace;
                }
                return;
              }
              var escaped = (0, cssesc_1.default)(namespace, { isIdentifier: true });
              this._namespace = namespace;
              if (escaped !== namespace) {
                (0, util_1.ensureObject)(this, "raws");
                this.raws.namespace = escaped;
              } else if (this.raws) {
                delete this.raws.namespace;
              }
            },
            enumerable: false,
            configurable: true
          });
          Object.defineProperty(Namespace2.prototype, "ns", {
            get: function() {
              return this._namespace;
            },
            set: function(namespace) {
              this.namespace = namespace;
            },
            enumerable: false,
            configurable: true
          });
          Object.defineProperty(Namespace2.prototype, "namespaceString", {
            get: function() {
              if (this.namespace) {
                var ns = this.stringifyProperty("namespace");
                if (ns === true) {
                  return "";
                } else {
                  return ns;
                }
              } else {
                return "";
              }
            },
            enumerable: false,
            configurable: true
          });
          Namespace2.prototype.qualifiedName = function(value) {
            if (this.namespace) {
              return "".concat(this.namespaceString, "|").concat(value);
            } else {
              return value;
            }
          };
          Namespace2.prototype.valueToString = function() {
            return this.qualifiedName(_super.prototype.valueToString.call(this));
          };
          return Namespace2;
        })(node_1.default)
      );
      exports.default = Namespace;
    }
  });

  // ../node_modules/.pnpm/postcss-selector-parser@7.1.4/node_modules/postcss-selector-parser/dist/selectors/tag.js
  var require_tag = __commonJS({
    "../node_modules/.pnpm/postcss-selector-parser@7.1.4/node_modules/postcss-selector-parser/dist/selectors/tag.js"(exports) {
      "use strict";
      var __extends = exports && exports.__extends || /* @__PURE__ */ (function() {
        var extendStatics = function(d, b) {
          extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
            d2.__proto__ = b2;
          } || function(d2, b2) {
            for (var p in b2) if (Object.prototype.hasOwnProperty.call(b2, p)) d2[p] = b2[p];
          };
          return extendStatics(d, b);
        };
        return function(d, b) {
          if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
          extendStatics(d, b);
          function __() {
            this.constructor = d;
          }
          d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
        };
      })();
      var __importDefault = exports && exports.__importDefault || function(mod) {
        return mod && mod.__esModule ? mod : { "default": mod };
      };
      Object.defineProperty(exports, "__esModule", { value: true });
      var namespace_1 = __importDefault(require_namespace());
      var types_1 = require_types();
      var Tag2 = (
        /** @class */
        (function(_super) {
          __extends(Tag3, _super);
          function Tag3(opts) {
            var _this = _super.call(this, opts) || this;
            _this.type = types_1.TAG;
            return _this;
          }
          return Tag3;
        })(namespace_1.default)
      );
      exports.default = Tag2;
    }
  });

  // ../node_modules/.pnpm/postcss-selector-parser@7.1.4/node_modules/postcss-selector-parser/dist/selectors/string.js
  var require_string = __commonJS({
    "../node_modules/.pnpm/postcss-selector-parser@7.1.4/node_modules/postcss-selector-parser/dist/selectors/string.js"(exports) {
      "use strict";
      var __extends = exports && exports.__extends || /* @__PURE__ */ (function() {
        var extendStatics = function(d, b) {
          extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
            d2.__proto__ = b2;
          } || function(d2, b2) {
            for (var p in b2) if (Object.prototype.hasOwnProperty.call(b2, p)) d2[p] = b2[p];
          };
          return extendStatics(d, b);
        };
        return function(d, b) {
          if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String2(b) + " is not a constructor or null");
          extendStatics(d, b);
          function __() {
            this.constructor = d;
          }
          d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
        };
      })();
      var __importDefault = exports && exports.__importDefault || function(mod) {
        return mod && mod.__esModule ? mod : { "default": mod };
      };
      Object.defineProperty(exports, "__esModule", { value: true });
      var node_1 = __importDefault(require_node2());
      var types_1 = require_types();
      var String2 = (
        /** @class */
        (function(_super) {
          __extends(String3, _super);
          function String3(opts) {
            var _this = _super.call(this, opts) || this;
            _this.type = types_1.STRING;
            return _this;
          }
          return String3;
        })(node_1.default)
      );
      exports.default = String2;
    }
  });

  // ../node_modules/.pnpm/postcss-selector-parser@7.1.4/node_modules/postcss-selector-parser/dist/selectors/pseudo.js
  var require_pseudo = __commonJS({
    "../node_modules/.pnpm/postcss-selector-parser@7.1.4/node_modules/postcss-selector-parser/dist/selectors/pseudo.js"(exports) {
      "use strict";
      var __extends = exports && exports.__extends || /* @__PURE__ */ (function() {
        var extendStatics = function(d, b) {
          extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
            d2.__proto__ = b2;
          } || function(d2, b2) {
            for (var p in b2) if (Object.prototype.hasOwnProperty.call(b2, p)) d2[p] = b2[p];
          };
          return extendStatics(d, b);
        };
        return function(d, b) {
          if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
          extendStatics(d, b);
          function __() {
            this.constructor = d;
          }
          d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
        };
      })();
      var __importDefault = exports && exports.__importDefault || function(mod) {
        return mod && mod.__esModule ? mod : { "default": mod };
      };
      Object.defineProperty(exports, "__esModule", { value: true });
      var container_1 = __importDefault(require_container2());
      var types_1 = require_types();
      var Pseudo = (
        /** @class */
        (function(_super) {
          __extends(Pseudo2, _super);
          function Pseudo2(opts) {
            var _this = _super.call(this, opts) || this;
            _this.type = types_1.PSEUDO;
            return _this;
          }
          Pseudo2.prototype._stringify = function(options, depth, max) {
            var _this = this;
            if (depth >= max) {
              throw new Error("Cannot serialize selector: nesting depth exceeds the maximum of ".concat(max, "."));
            }
            var params = this.length ? "(" + this.map(function(child) {
              return _this._stringifyChild(child, options, depth + 1, max);
            }).join(",") + ")" : "";
            return [this.rawSpaceBefore, this.stringifyProperty("value"), params, this.rawSpaceAfter].join("");
          };
          return Pseudo2;
        })(container_1.default)
      );
      exports.default = Pseudo;
    }
  });

  // ../node_modules/.pnpm/util-deprecate@1.0.2/node_modules/util-deprecate/browser.js
  var require_browser = __commonJS({
    "../node_modules/.pnpm/util-deprecate@1.0.2/node_modules/util-deprecate/browser.js"(exports, module) {
      module.exports = deprecate;
      function deprecate(fn, msg) {
        if (config("noDeprecation")) {
          return fn;
        }
        var warned = false;
        function deprecated() {
          if (!warned) {
            if (config("throwDeprecation")) {
              throw new Error(msg);
            } else if (config("traceDeprecation")) {
              console.trace(msg);
            } else {
              console.warn(msg);
            }
            warned = true;
          }
          return fn.apply(this, arguments);
        }
        return deprecated;
      }
      function config(name) {
        try {
          if (!global.localStorage) return false;
        } catch (_) {
          return false;
        }
        var val = global.localStorage[name];
        if (null == val) return false;
        return String(val).toLowerCase() === "true";
      }
    }
  });

  // ../node_modules/.pnpm/postcss-selector-parser@7.1.4/node_modules/postcss-selector-parser/dist/selectors/attribute.js
  var require_attribute = __commonJS({
    "../node_modules/.pnpm/postcss-selector-parser@7.1.4/node_modules/postcss-selector-parser/dist/selectors/attribute.js"(exports) {
      "use strict";
      var __extends = exports && exports.__extends || /* @__PURE__ */ (function() {
        var extendStatics = function(d, b) {
          extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
            d2.__proto__ = b2;
          } || function(d2, b2) {
            for (var p in b2) if (Object.prototype.hasOwnProperty.call(b2, p)) d2[p] = b2[p];
          };
          return extendStatics(d, b);
        };
        return function(d, b) {
          if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
          extendStatics(d, b);
          function __() {
            this.constructor = d;
          }
          d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
        };
      })();
      var __importDefault = exports && exports.__importDefault || function(mod) {
        return mod && mod.__esModule ? mod : { "default": mod };
      };
      var _a3;
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.unescapeValue = unescapeValue;
      var cssesc_1 = __importDefault(require_cssesc());
      var unesc_1 = __importDefault(require_unesc());
      var namespace_1 = __importDefault(require_namespace());
      var types_1 = require_types();
      var deprecate = require_browser();
      var WRAPPED_IN_QUOTES = /^('|")([^]*)\1$/;
      var warnOfDeprecatedValueAssignment = deprecate(function() {
      }, "Assigning an attribute a value containing characters that might need to be escaped is deprecated. Call attribute.setValue() instead.");
      var warnOfDeprecatedQuotedAssignment = deprecate(function() {
      }, "Assigning attr.quoted is deprecated and has no effect. Assign to attr.quoteMark instead.");
      var warnOfDeprecatedConstructor = deprecate(function() {
      }, "Constructing an Attribute selector with a value without specifying quoteMark is deprecated. Note: The value should be unescaped now.");
      function unescapeValue(value) {
        var deprecatedUsage = false;
        var quoteMark = null;
        var unescaped = value;
        var m = unescaped.match(WRAPPED_IN_QUOTES);
        if (m) {
          quoteMark = m[1];
          unescaped = m[2];
        }
        unescaped = (0, unesc_1.default)(unescaped);
        if (unescaped !== value) {
          deprecatedUsage = true;
        }
        return {
          deprecatedUsage,
          unescaped,
          quoteMark
        };
      }
      function handleDeprecatedContructorOpts(opts) {
        if (opts.quoteMark !== void 0) {
          return opts;
        }
        if (opts.value === void 0) {
          return opts;
        }
        warnOfDeprecatedConstructor();
        var _a4 = unescapeValue(opts.value), quoteMark = _a4.quoteMark, unescaped = _a4.unescaped;
        if (!opts.raws) {
          opts.raws = {};
        }
        if (opts.raws.value === void 0) {
          opts.raws.value = opts.value;
        }
        opts.value = unescaped;
        opts.quoteMark = quoteMark;
        return opts;
      }
      var Attribute = (
        /** @class */
        (function(_super) {
          __extends(Attribute2, _super);
          function Attribute2(opts) {
            if (opts === void 0) {
              opts = {};
            }
            var _this = _super.call(this, handleDeprecatedContructorOpts(opts)) || this;
            _this.type = types_1.ATTRIBUTE;
            _this.raws = _this.raws || {};
            Object.defineProperty(_this.raws, "unquoted", {
              get: deprecate(function() {
                return _this.value;
              }, "attr.raws.unquoted is deprecated. Call attr.value instead."),
              set: deprecate(function() {
                return _this.value;
              }, "Setting attr.raws.unquoted is deprecated and has no effect. attr.value is unescaped by default now.")
            });
            _this._constructed = true;
            return _this;
          }
          Attribute2.prototype.getQuotedValue = function(options) {
            if (options === void 0) {
              options = {};
            }
            var quoteMark = this._determineQuoteMark(options);
            var cssescopts = CSSESC_QUOTE_OPTIONS[quoteMark];
            var escaped = (0, cssesc_1.default)(this._value, cssescopts);
            return escaped;
          };
          Attribute2.prototype._determineQuoteMark = function(options) {
            return options.smart ? this.smartQuoteMark(options) : this.preferredQuoteMark(options);
          };
          Attribute2.prototype.setValue = function(value, options) {
            if (options === void 0) {
              options = {};
            }
            this._value = value;
            this._quoteMark = this._determineQuoteMark(options);
            this._syncRawValue();
          };
          Attribute2.prototype.smartQuoteMark = function(options) {
            var v = this.value;
            var numSingleQuotes = v.replace(/[^']/g, "").length;
            var numDoubleQuotes = v.replace(/[^"]/g, "").length;
            if (numSingleQuotes + numDoubleQuotes === 0) {
              var escaped = (0, cssesc_1.default)(v, { isIdentifier: true });
              if (escaped === v) {
                return Attribute2.NO_QUOTE;
              } else {
                var pref = this.preferredQuoteMark(options);
                if (pref === Attribute2.NO_QUOTE) {
                  var quote = this.quoteMark || options.quoteMark || Attribute2.DOUBLE_QUOTE;
                  var opts = CSSESC_QUOTE_OPTIONS[quote];
                  var quoteValue = (0, cssesc_1.default)(v, opts);
                  if (quoteValue.length < escaped.length) {
                    return quote;
                  }
                }
                return pref;
              }
            } else if (numDoubleQuotes === numSingleQuotes) {
              return this.preferredQuoteMark(options);
            } else if (numDoubleQuotes < numSingleQuotes) {
              return Attribute2.DOUBLE_QUOTE;
            } else {
              return Attribute2.SINGLE_QUOTE;
            }
          };
          Attribute2.prototype.preferredQuoteMark = function(options) {
            var quoteMark = options.preferCurrentQuoteMark ? this.quoteMark : options.quoteMark;
            if (quoteMark === void 0) {
              quoteMark = options.preferCurrentQuoteMark ? options.quoteMark : this.quoteMark;
            }
            if (quoteMark === void 0) {
              quoteMark = Attribute2.DOUBLE_QUOTE;
            }
            return quoteMark;
          };
          Object.defineProperty(Attribute2.prototype, "quoted", {
            get: function() {
              var qm = this.quoteMark;
              return qm === "'" || qm === '"';
            },
            set: function(value) {
              warnOfDeprecatedQuotedAssignment();
            },
            enumerable: false,
            configurable: true
          });
          Object.defineProperty(Attribute2.prototype, "quoteMark", {
            /**
             * returns a single (`'`) or double (`"`) quote character if the value is quoted.
             * returns `null` if the value is not quoted.
             * returns `undefined` if the quotation state is unknown (this can happen when
             * the attribute is constructed without specifying a quote mark.)
             */
            get: function() {
              return this._quoteMark;
            },
            /**
             * Set the quote mark to be used by this attribute's value.
             * If the quote mark changes, the raw (escaped) value at `attr.raws.value` of the attribute
             * value is updated accordingly.
             *
             * @param {"'" | '"' | null} quoteMark The quote mark or `null` if the value should be unquoted.
             */
            set: function(quoteMark) {
              if (!this._constructed) {
                this._quoteMark = quoteMark;
                return;
              }
              if (this._quoteMark !== quoteMark) {
                this._quoteMark = quoteMark;
                this._syncRawValue();
              }
            },
            enumerable: false,
            configurable: true
          });
          Attribute2.prototype._syncRawValue = function() {
            var rawValue = (0, cssesc_1.default)(this._value, CSSESC_QUOTE_OPTIONS[this.quoteMark]);
            if (rawValue === this._value) {
              if (this.raws) {
                delete this.raws.value;
              }
            } else {
              this.raws.value = rawValue;
            }
          };
          Object.defineProperty(Attribute2.prototype, "qualifiedAttribute", {
            get: function() {
              return this.qualifiedName(this.raws.attribute || this.attribute);
            },
            enumerable: false,
            configurable: true
          });
          Object.defineProperty(Attribute2.prototype, "insensitiveFlag", {
            get: function() {
              return this.insensitive ? "i" : "";
            },
            enumerable: false,
            configurable: true
          });
          Object.defineProperty(Attribute2.prototype, "value", {
            get: function() {
              return this._value;
            },
            /**
             * Before 3.0, the value had to be set to an escaped value including any wrapped
             * quote marks. In 3.0, the semantics of `Attribute.value` changed so that the value
             * is unescaped during parsing and any quote marks are removed.
             *
             * Because the ambiguity of this semantic change, if you set `attr.value = newValue`,
             * a deprecation warning is raised when the new value contains any characters that would
             * require escaping (including if it contains wrapped quotes).
             *
             * Instead, you should call `attr.setValue(newValue, opts)` and pass options that describe
             * how the new value is quoted.
             */
            set: function(v) {
              if (this._constructed) {
                var _a4 = unescapeValue(v), deprecatedUsage = _a4.deprecatedUsage, unescaped = _a4.unescaped, quoteMark = _a4.quoteMark;
                if (deprecatedUsage) {
                  warnOfDeprecatedValueAssignment();
                }
                if (unescaped === this._value && quoteMark === this._quoteMark) {
                  return;
                }
                this._value = unescaped;
                this._quoteMark = quoteMark;
                this._syncRawValue();
              } else {
                this._value = v;
              }
            },
            enumerable: false,
            configurable: true
          });
          Object.defineProperty(Attribute2.prototype, "insensitive", {
            get: function() {
              return this._insensitive;
            },
            /**
             * Set the case insensitive flag.
             * If the case insensitive flag changes, the raw (escaped) value at `attr.raws.insensitiveFlag`
             * of the attribute is updated accordingly.
             *
             * @param {true | false} insensitive true if the attribute should match case-insensitively.
             */
            set: function(insensitive) {
              if (!insensitive) {
                this._insensitive = false;
                if (this.raws && (this.raws.insensitiveFlag === "I" || this.raws.insensitiveFlag === "i")) {
                  this.raws.insensitiveFlag = void 0;
                }
              }
              this._insensitive = insensitive;
            },
            enumerable: false,
            configurable: true
          });
          Object.defineProperty(Attribute2.prototype, "attribute", {
            get: function() {
              return this._attribute;
            },
            set: function(name) {
              this._handleEscapes("attribute", name);
              this._attribute = name;
            },
            enumerable: false,
            configurable: true
          });
          Attribute2.prototype._handleEscapes = function(prop2, value) {
            if (this._constructed) {
              var escaped = (0, cssesc_1.default)(value, { isIdentifier: true });
              if (escaped !== value) {
                this.raws[prop2] = escaped;
              } else {
                delete this.raws[prop2];
              }
            }
          };
          Attribute2.prototype._spacesFor = function(name) {
            var attrSpaces = { before: "", after: "" };
            var spaces = this.spaces[name] || {};
            var rawSpaces = this.raws.spaces && this.raws.spaces[name] || {};
            return Object.assign(attrSpaces, spaces, rawSpaces);
          };
          Attribute2.prototype._stringFor = function(name, spaceName, concat) {
            if (spaceName === void 0) {
              spaceName = name;
            }
            if (concat === void 0) {
              concat = defaultAttrConcat;
            }
            var attrSpaces = this._spacesFor(spaceName);
            return concat(this.stringifyProperty(name), attrSpaces);
          };
          Attribute2.prototype.offsetOf = function(name) {
            var count = 1;
            var attributeSpaces = this._spacesFor("attribute");
            count += attributeSpaces.before.length;
            if (name === "namespace" || name === "ns") {
              return this.namespace ? count : -1;
            }
            if (name === "attributeNS") {
              return count;
            }
            count += this.namespaceString.length;
            if (this.namespace) {
              count += 1;
            }
            if (name === "attribute") {
              return count;
            }
            count += this.stringifyProperty("attribute").length;
            count += attributeSpaces.after.length;
            var operatorSpaces = this._spacesFor("operator");
            count += operatorSpaces.before.length;
            var operator = this.stringifyProperty("operator");
            if (name === "operator") {
              return operator ? count : -1;
            }
            count += operator.length;
            count += operatorSpaces.after.length;
            var valueSpaces = this._spacesFor("value");
            count += valueSpaces.before.length;
            var value = this.stringifyProperty("value");
            if (name === "value") {
              return value ? count : -1;
            }
            count += value.length;
            count += valueSpaces.after.length;
            var insensitiveSpaces = this._spacesFor("insensitive");
            count += insensitiveSpaces.before.length;
            if (name === "insensitive") {
              return this.insensitive ? count : -1;
            }
            return -1;
          };
          Attribute2.prototype.toString = function() {
            var _this = this;
            var selector = [this.rawSpaceBefore, "["];
            selector.push(this._stringFor("qualifiedAttribute", "attribute"));
            if (this.operator && (this.value || this.value === "")) {
              selector.push(this._stringFor("operator"));
              selector.push(this._stringFor("value"));
              selector.push(this._stringFor("insensitiveFlag", "insensitive", function(attrValue, attrSpaces) {
                if (attrValue.length > 0 && !_this.quoted && attrSpaces.before.length === 0 && !(_this.spaces.value && _this.spaces.value.after)) {
                  attrSpaces.before = " ";
                }
                return defaultAttrConcat(attrValue, attrSpaces);
              }));
            }
            selector.push("]");
            selector.push(this.rawSpaceAfter);
            return selector.join("");
          };
          Attribute2.NO_QUOTE = null;
          Attribute2.SINGLE_QUOTE = "'";
          Attribute2.DOUBLE_QUOTE = '"';
          return Attribute2;
        })(namespace_1.default)
      );
      exports.default = Attribute;
      var CSSESC_QUOTE_OPTIONS = (_a3 = {
        "'": { quotes: "single", wrap: true },
        '"': { quotes: "double", wrap: true }
      }, _a3[null] = { isIdentifier: true }, _a3);
      function defaultAttrConcat(attrValue, attrSpaces) {
        return "".concat(attrSpaces.before).concat(attrValue).concat(attrSpaces.after);
      }
    }
  });

  // ../node_modules/.pnpm/postcss-selector-parser@7.1.4/node_modules/postcss-selector-parser/dist/selectors/universal.js
  var require_universal = __commonJS({
    "../node_modules/.pnpm/postcss-selector-parser@7.1.4/node_modules/postcss-selector-parser/dist/selectors/universal.js"(exports) {
      "use strict";
      var __extends = exports && exports.__extends || /* @__PURE__ */ (function() {
        var extendStatics = function(d, b) {
          extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
            d2.__proto__ = b2;
          } || function(d2, b2) {
            for (var p in b2) if (Object.prototype.hasOwnProperty.call(b2, p)) d2[p] = b2[p];
          };
          return extendStatics(d, b);
        };
        return function(d, b) {
          if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
          extendStatics(d, b);
          function __() {
            this.constructor = d;
          }
          d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
        };
      })();
      var __importDefault = exports && exports.__importDefault || function(mod) {
        return mod && mod.__esModule ? mod : { "default": mod };
      };
      Object.defineProperty(exports, "__esModule", { value: true });
      var namespace_1 = __importDefault(require_namespace());
      var types_1 = require_types();
      var Universal = (
        /** @class */
        (function(_super) {
          __extends(Universal2, _super);
          function Universal2(opts) {
            var _this = _super.call(this, opts) || this;
            _this.type = types_1.UNIVERSAL;
            _this.value = "*";
            return _this;
          }
          return Universal2;
        })(namespace_1.default)
      );
      exports.default = Universal;
    }
  });

  // ../node_modules/.pnpm/postcss-selector-parser@7.1.4/node_modules/postcss-selector-parser/dist/selectors/combinator.js
  var require_combinator = __commonJS({
    "../node_modules/.pnpm/postcss-selector-parser@7.1.4/node_modules/postcss-selector-parser/dist/selectors/combinator.js"(exports) {
      "use strict";
      var __extends = exports && exports.__extends || /* @__PURE__ */ (function() {
        var extendStatics = function(d, b) {
          extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
            d2.__proto__ = b2;
          } || function(d2, b2) {
            for (var p in b2) if (Object.prototype.hasOwnProperty.call(b2, p)) d2[p] = b2[p];
          };
          return extendStatics(d, b);
        };
        return function(d, b) {
          if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
          extendStatics(d, b);
          function __() {
            this.constructor = d;
          }
          d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
        };
      })();
      var __importDefault = exports && exports.__importDefault || function(mod) {
        return mod && mod.__esModule ? mod : { "default": mod };
      };
      Object.defineProperty(exports, "__esModule", { value: true });
      var node_1 = __importDefault(require_node2());
      var types_1 = require_types();
      var Combinator = (
        /** @class */
        (function(_super) {
          __extends(Combinator2, _super);
          function Combinator2(opts) {
            var _this = _super.call(this, opts) || this;
            _this.type = types_1.COMBINATOR;
            return _this;
          }
          return Combinator2;
        })(node_1.default)
      );
      exports.default = Combinator;
    }
  });

  // ../node_modules/.pnpm/postcss-selector-parser@7.1.4/node_modules/postcss-selector-parser/dist/selectors/nesting.js
  var require_nesting = __commonJS({
    "../node_modules/.pnpm/postcss-selector-parser@7.1.4/node_modules/postcss-selector-parser/dist/selectors/nesting.js"(exports) {
      "use strict";
      var __extends = exports && exports.__extends || /* @__PURE__ */ (function() {
        var extendStatics = function(d, b) {
          extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
            d2.__proto__ = b2;
          } || function(d2, b2) {
            for (var p in b2) if (Object.prototype.hasOwnProperty.call(b2, p)) d2[p] = b2[p];
          };
          return extendStatics(d, b);
        };
        return function(d, b) {
          if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
          extendStatics(d, b);
          function __() {
            this.constructor = d;
          }
          d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
        };
      })();
      var __importDefault = exports && exports.__importDefault || function(mod) {
        return mod && mod.__esModule ? mod : { "default": mod };
      };
      Object.defineProperty(exports, "__esModule", { value: true });
      var node_1 = __importDefault(require_node2());
      var types_1 = require_types();
      var Nesting = (
        /** @class */
        (function(_super) {
          __extends(Nesting2, _super);
          function Nesting2(opts) {
            var _this = _super.call(this, opts) || this;
            _this.type = types_1.NESTING;
            _this.value = "&";
            return _this;
          }
          return Nesting2;
        })(node_1.default)
      );
      exports.default = Nesting;
    }
  });

  // ../node_modules/.pnpm/postcss-selector-parser@7.1.4/node_modules/postcss-selector-parser/dist/sortAscending.js
  var require_sortAscending = __commonJS({
    "../node_modules/.pnpm/postcss-selector-parser@7.1.4/node_modules/postcss-selector-parser/dist/sortAscending.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.default = sortAscending;
      function sortAscending(list2) {
        return list2.sort(function(a, b) {
          return a - b;
        });
      }
    }
  });

  // ../node_modules/.pnpm/postcss-selector-parser@7.1.4/node_modules/postcss-selector-parser/dist/tokenTypes.js
  var require_tokenTypes = __commonJS({
    "../node_modules/.pnpm/postcss-selector-parser@7.1.4/node_modules/postcss-selector-parser/dist/tokenTypes.js"(exports) {
      "use strict";
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.combinator = exports.word = exports.comment = exports.str = exports.tab = exports.newline = exports.feed = exports.cr = exports.backslash = exports.bang = exports.slash = exports.doubleQuote = exports.singleQuote = exports.space = exports.greaterThan = exports.pipe = exports.equals = exports.plus = exports.caret = exports.tilde = exports.dollar = exports.closeSquare = exports.openSquare = exports.closeParenthesis = exports.openParenthesis = exports.semicolon = exports.colon = exports.comma = exports.at = exports.asterisk = exports.ampersand = void 0;
      exports.ampersand = 38;
      exports.asterisk = 42;
      exports.at = 64;
      exports.comma = 44;
      exports.colon = 58;
      exports.semicolon = 59;
      exports.openParenthesis = 40;
      exports.closeParenthesis = 41;
      exports.openSquare = 91;
      exports.closeSquare = 93;
      exports.dollar = 36;
      exports.tilde = 126;
      exports.caret = 94;
      exports.plus = 43;
      exports.equals = 61;
      exports.pipe = 124;
      exports.greaterThan = 62;
      exports.space = 32;
      exports.singleQuote = 39;
      exports.doubleQuote = 34;
      exports.slash = 47;
      exports.bang = 33;
      exports.backslash = 92;
      exports.cr = 13;
      exports.feed = 12;
      exports.newline = 10;
      exports.tab = 9;
      exports.str = exports.singleQuote;
      exports.comment = -1;
      exports.word = -2;
      exports.combinator = -3;
    }
  });

  // ../node_modules/.pnpm/postcss-selector-parser@7.1.4/node_modules/postcss-selector-parser/dist/tokenize.js
  var require_tokenize2 = __commonJS({
    "../node_modules/.pnpm/postcss-selector-parser@7.1.4/node_modules/postcss-selector-parser/dist/tokenize.js"(exports) {
      "use strict";
      var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
        if (k2 === void 0) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
          desc = { enumerable: true, get: function() {
            return m[k];
          } };
        }
        Object.defineProperty(o, k2, desc);
      }) : (function(o, m, k, k2) {
        if (k2 === void 0) k2 = k;
        o[k2] = m[k];
      }));
      var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? (function(o, v) {
        Object.defineProperty(o, "default", { enumerable: true, value: v });
      }) : function(o, v) {
        o["default"] = v;
      });
      var __importStar = exports && exports.__importStar || /* @__PURE__ */ (function() {
        var ownKeys = function(o) {
          ownKeys = Object.getOwnPropertyNames || function(o2) {
            var ar = [];
            for (var k in o2) if (Object.prototype.hasOwnProperty.call(o2, k)) ar[ar.length] = k;
            return ar;
          };
          return ownKeys(o);
        };
        return function(mod) {
          if (mod && mod.__esModule) return mod;
          var result = {};
          if (mod != null) {
            for (var k = ownKeys(mod), i2 = 0; i2 < k.length; i2++) if (k[i2] !== "default") __createBinding(result, mod, k[i2]);
          }
          __setModuleDefault(result, mod);
          return result;
        };
      })();
      var _a3;
      var _b;
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.FIELDS = void 0;
      exports.default = tokenize;
      var t = __importStar(require_tokenTypes());
      var unescapable = (_a3 = {}, _a3[t.tab] = true, _a3[t.newline] = true, _a3[t.cr] = true, _a3[t.feed] = true, _a3);
      var wordDelimiters = (_b = {}, _b[t.space] = true, _b[t.tab] = true, _b[t.newline] = true, _b[t.cr] = true, _b[t.feed] = true, _b[t.ampersand] = true, _b[t.asterisk] = true, _b[t.bang] = true, _b[t.comma] = true, _b[t.colon] = true, _b[t.semicolon] = true, _b[t.openParenthesis] = true, _b[t.closeParenthesis] = true, _b[t.openSquare] = true, _b[t.closeSquare] = true, _b[t.singleQuote] = true, _b[t.doubleQuote] = true, _b[t.plus] = true, _b[t.pipe] = true, _b[t.tilde] = true, _b[t.greaterThan] = true, _b[t.equals] = true, _b[t.dollar] = true, _b[t.caret] = true, _b[t.slash] = true, _b);
      var hex = {};
      var hexChars = "0123456789abcdefABCDEF";
      for (i = 0; i < hexChars.length; i++) {
        hex[hexChars.charCodeAt(i)] = true;
      }
      var i;
      function consumeWord(css, start) {
        var next = start;
        var code;
        do {
          code = css.charCodeAt(next);
          if (wordDelimiters[code]) {
            return next - 1;
          } else if (code === t.backslash) {
            next = consumeEscape(css, next) + 1;
          } else {
            next++;
          }
        } while (next < css.length);
        return next - 1;
      }
      function consumeEscape(css, start) {
        var next = start;
        var code = css.charCodeAt(next + 1);
        if (unescapable[code]) {
        } else if (hex[code]) {
          var hexDigits = 0;
          do {
            next++;
            hexDigits++;
            code = css.charCodeAt(next + 1);
          } while (hex[code] && hexDigits < 6);
          if (hexDigits < 6 && code === t.space) {
            next++;
          }
        } else {
          next++;
        }
        return next;
      }
      exports.FIELDS = {
        TYPE: 0,
        START_LINE: 1,
        START_COL: 2,
        END_LINE: 3,
        END_COL: 4,
        START_POS: 5,
        END_POS: 6
      };
      function tokenize(input) {
        var tokens = [];
        var css = input.css.valueOf();
        var length = css.length;
        var offset = -1;
        var line = 1;
        var start = 0;
        var end = 0;
        var code, content, endColumn, endLine, escaped, escapePos, last, lines, next, nextLine, nextOffset, quote, tokenType;
        function unclosed(what, fix) {
          if (input.safe) {
            css += fix;
            next = css.length - 1;
          } else {
            throw input.error("Unclosed " + what, line, start - offset, start);
          }
        }
        while (start < length) {
          code = css.charCodeAt(start);
          if (code === t.newline) {
            offset = start;
            line += 1;
          }
          switch (code) {
            case t.space:
            case t.tab:
            case t.newline:
            case t.cr:
            case t.feed:
              next = start;
              do {
                next += 1;
                code = css.charCodeAt(next);
                if (code === t.newline) {
                  offset = next;
                  line += 1;
                }
              } while (code === t.space || code === t.newline || code === t.tab || code === t.cr || code === t.feed);
              tokenType = t.space;
              endLine = line;
              endColumn = next - offset - 1;
              end = next;
              break;
            case t.plus:
            case t.greaterThan:
            case t.tilde:
            case t.pipe:
              next = start;
              do {
                next += 1;
                code = css.charCodeAt(next);
              } while (code === t.plus || code === t.greaterThan || code === t.tilde || code === t.pipe);
              tokenType = t.combinator;
              endLine = line;
              endColumn = start - offset;
              end = next;
              break;
            // Consume these characters as single tokens.
            case t.asterisk:
            case t.ampersand:
            case t.bang:
            case t.comma:
            case t.equals:
            case t.dollar:
            case t.caret:
            case t.openSquare:
            case t.closeSquare:
            case t.colon:
            case t.semicolon:
            case t.openParenthesis:
            case t.closeParenthesis:
              next = start;
              tokenType = code;
              endLine = line;
              endColumn = start - offset;
              end = next + 1;
              break;
            case t.singleQuote:
            case t.doubleQuote:
              quote = code === t.singleQuote ? "'" : '"';
              next = start;
              do {
                escaped = false;
                next = css.indexOf(quote, next + 1);
                if (next === -1) {
                  unclosed("quote", quote);
                }
                escapePos = next;
                while (css.charCodeAt(escapePos - 1) === t.backslash) {
                  escapePos -= 1;
                  escaped = !escaped;
                }
              } while (escaped);
              tokenType = t.str;
              endLine = line;
              endColumn = start - offset;
              end = next + 1;
              break;
            default:
              if (code === t.slash && css.charCodeAt(start + 1) === t.asterisk) {
                next = css.indexOf("*/", start + 2) + 1;
                if (next === 0) {
                  unclosed("comment", "*/");
                }
                content = css.slice(start, next + 1);
                lines = content.split("\n");
                last = lines.length - 1;
                if (last > 0) {
                  nextLine = line + last;
                  nextOffset = next - lines[last].length;
                } else {
                  nextLine = line;
                  nextOffset = offset;
                }
                tokenType = t.comment;
                line = nextLine;
                endLine = nextLine;
                endColumn = next - nextOffset;
              } else if (code === t.slash) {
                next = start;
                tokenType = code;
                endLine = line;
                endColumn = start - offset;
                end = next + 1;
              } else {
                next = consumeWord(css, start);
                tokenType = t.word;
                endLine = line;
                endColumn = next - offset;
              }
              end = next + 1;
              break;
          }
          tokens.push([
            tokenType,
            // [0] Token type
            line,
            // [1] Starting line
            start - offset,
            // [2] Starting column
            endLine,
            // [3] Ending line
            endColumn,
            // [4] Ending column
            start,
            // [5] Start position / Source index
            end
            // [6] End position
          ]);
          if (nextOffset) {
            offset = nextOffset;
            nextOffset = null;
          }
          start = end;
        }
        return tokens;
      }
    }
  });

  // ../node_modules/.pnpm/postcss-selector-parser@7.1.4/node_modules/postcss-selector-parser/dist/parser.js
  var require_parser2 = __commonJS({
    "../node_modules/.pnpm/postcss-selector-parser@7.1.4/node_modules/postcss-selector-parser/dist/parser.js"(exports) {
      "use strict";
      var __assign = exports && exports.__assign || function() {
        __assign = Object.assign || function(t) {
          for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
              t[p] = s[p];
          }
          return t;
        };
        return __assign.apply(this, arguments);
      };
      var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
        if (k2 === void 0) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
          desc = { enumerable: true, get: function() {
            return m[k];
          } };
        }
        Object.defineProperty(o, k2, desc);
      }) : (function(o, m, k, k2) {
        if (k2 === void 0) k2 = k;
        o[k2] = m[k];
      }));
      var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? (function(o, v) {
        Object.defineProperty(o, "default", { enumerable: true, value: v });
      }) : function(o, v) {
        o["default"] = v;
      });
      var __importStar = exports && exports.__importStar || /* @__PURE__ */ (function() {
        var ownKeys = function(o) {
          ownKeys = Object.getOwnPropertyNames || function(o2) {
            var ar = [];
            for (var k in o2) if (Object.prototype.hasOwnProperty.call(o2, k)) ar[ar.length] = k;
            return ar;
          };
          return ownKeys(o);
        };
        return function(mod) {
          if (mod && mod.__esModule) return mod;
          var result = {};
          if (mod != null) {
            for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
          }
          __setModuleDefault(result, mod);
          return result;
        };
      })();
      var __read = exports && exports.__read || function(o, n) {
        var m = typeof Symbol === "function" && o[Symbol.iterator];
        if (!m) return o;
        var i = m.call(o), r, ar = [], e;
        try {
          while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
        } catch (error) {
          e = { error };
        } finally {
          try {
            if (r && !r.done && (m = i["return"])) m.call(i);
          } finally {
            if (e) throw e.error;
          }
        }
        return ar;
      };
      var __spreadArray = exports && exports.__spreadArray || function(to, from, pack) {
        if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
          if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
          }
        }
        return to.concat(ar || Array.prototype.slice.call(from));
      };
      var __importDefault = exports && exports.__importDefault || function(mod) {
        return mod && mod.__esModule ? mod : { "default": mod };
      };
      var _a3;
      var _b;
      Object.defineProperty(exports, "__esModule", { value: true });
      var root_1 = __importDefault(require_root2());
      var selector_1 = __importDefault(require_selector());
      var className_1 = __importDefault(require_className());
      var comment_1 = __importDefault(require_comment2());
      var id_1 = __importDefault(require_id());
      var tag_1 = __importDefault(require_tag());
      var string_1 = __importDefault(require_string());
      var pseudo_1 = __importDefault(require_pseudo());
      var attribute_1 = __importStar(require_attribute());
      var universal_1 = __importDefault(require_universal());
      var combinator_1 = __importDefault(require_combinator());
      var nesting_1 = __importDefault(require_nesting());
      var sortAscending_1 = __importDefault(require_sortAscending());
      var tokenize_1 = __importStar(require_tokenize2());
      var tokens = __importStar(require_tokenTypes());
      var types = __importStar(require_types());
      var util_1 = require_util2();
      var WHITESPACE_TOKENS = (_a3 = {}, _a3[tokens.space] = true, _a3[tokens.cr] = true, _a3[tokens.feed] = true, _a3[tokens.newline] = true, _a3[tokens.tab] = true, _a3);
      var WHITESPACE_EQUIV_TOKENS = __assign(__assign({}, WHITESPACE_TOKENS), (_b = {}, _b[tokens.comment] = true, _b));
      function tokenStart(token) {
        return {
          line: token[tokenize_1.FIELDS.START_LINE],
          column: token[tokenize_1.FIELDS.START_COL]
        };
      }
      function tokenEnd(token) {
        return {
          line: token[tokenize_1.FIELDS.END_LINE],
          column: token[tokenize_1.FIELDS.END_COL]
        };
      }
      function getSource(startLine, startColumn, endLine, endColumn) {
        return {
          start: {
            line: startLine,
            column: startColumn
          },
          end: {
            line: endLine,
            column: endColumn
          }
        };
      }
      function getTokenSource(token) {
        return getSource(token[tokenize_1.FIELDS.START_LINE], token[tokenize_1.FIELDS.START_COL], token[tokenize_1.FIELDS.END_LINE], token[tokenize_1.FIELDS.END_COL]);
      }
      function getTokenSourceSpan(startToken, endToken) {
        if (!startToken) {
          return void 0;
        }
        return getSource(startToken[tokenize_1.FIELDS.START_LINE], startToken[tokenize_1.FIELDS.START_COL], endToken[tokenize_1.FIELDS.END_LINE], endToken[tokenize_1.FIELDS.END_COL]);
      }
      function unescapeProp(node, prop2) {
        var value = node[prop2];
        if (typeof value !== "string") {
          return;
        }
        if (value.indexOf("\\") !== -1) {
          (0, util_1.ensureObject)(node, "raws");
          node[prop2] = (0, util_1.unesc)(value);
          if (node.raws[prop2] === void 0) {
            node.raws[prop2] = value;
          }
        }
        return node;
      }
      function indexesOf(array, item) {
        var i = -1;
        var indexes = [];
        while ((i = array.indexOf(item, i + 1)) !== -1) {
          indexes.push(i);
        }
        return indexes;
      }
      function uniqs() {
        var list2 = Array.prototype.concat.apply([], arguments);
        return list2.filter(function(item, i) {
          return i === list2.indexOf(item);
        });
      }
      var Parser3 = (
        /** @class */
        (function() {
          function Parser4(rule2, options) {
            if (options === void 0) {
              options = {};
            }
            this.rule = rule2;
            this.options = Object.assign({ lossy: false, safe: false }, options);
            this.position = 0;
            this.nestingDepth = 0;
            this.maxNestingDepth = (0, util_1.resolveMaxNestingDepth)(this.options.maxNestingDepth);
            this.css = typeof this.rule === "string" ? this.rule : this.rule.selector;
            this.tokens = (0, tokenize_1.default)({
              css: this.css,
              error: this._errorGenerator(),
              safe: this.options.safe
            });
            var rootSource = getTokenSourceSpan(this.tokens[0], this.tokens[this.tokens.length - 1]);
            this.root = new root_1.default({ source: rootSource });
            this.root.errorGenerator = this._errorGenerator();
            var selector = new selector_1.default({
              source: { start: { line: 1, column: 1 } },
              sourceIndex: 0
            });
            this.root.append(selector);
            this.current = selector;
            this.loop();
          }
          Parser4.prototype._errorGenerator = function() {
            var _this = this;
            return function(message, errorOptions) {
              if (typeof _this.rule === "string") {
                return new Error(message);
              }
              return _this.rule.error(message, errorOptions);
            };
          };
          Parser4.prototype.attribute = function() {
            var attr = [];
            var startingToken = this.currToken;
            this.position++;
            while (this.position < this.tokens.length && this.currToken[tokenize_1.FIELDS.TYPE] !== tokens.closeSquare) {
              attr.push(this.currToken);
              this.position++;
            }
            if (this.currToken[tokenize_1.FIELDS.TYPE] !== tokens.closeSquare) {
              return this.expected("closing square bracket", this.currToken[tokenize_1.FIELDS.START_POS]);
            }
            var len = attr.length;
            var node = {
              source: getSource(startingToken[1], startingToken[2], this.currToken[3], this.currToken[4]),
              sourceIndex: startingToken[tokenize_1.FIELDS.START_POS]
            };
            if (len === 1 && !~[tokens.word].indexOf(attr[0][tokenize_1.FIELDS.TYPE])) {
              return this.expected("attribute", attr[0][tokenize_1.FIELDS.START_POS]);
            }
            var pos = 0;
            var spaceBefore = "";
            var commentBefore = "";
            var lastAdded = null;
            var spaceAfterMeaningfulToken = false;
            while (pos < len) {
              var token = attr[pos];
              var content = this.content(token);
              var next = attr[pos + 1];
              switch (token[tokenize_1.FIELDS.TYPE]) {
                case tokens.space:
                  spaceAfterMeaningfulToken = true;
                  if (this.options.lossy) {
                    break;
                  }
                  if (lastAdded) {
                    (0, util_1.ensureObject)(node, "spaces", lastAdded);
                    var prevContent = node.spaces[lastAdded].after || "";
                    node.spaces[lastAdded].after = prevContent + content;
                    var existingComment = (0, util_1.getProp)(node, "raws", "spaces", lastAdded, "after") || null;
                    if (existingComment) {
                      node.raws.spaces[lastAdded].after = existingComment + content;
                    }
                  } else {
                    spaceBefore = spaceBefore + content;
                    commentBefore = commentBefore + content;
                  }
                  break;
                case tokens.asterisk:
                  if (next[tokenize_1.FIELDS.TYPE] === tokens.equals) {
                    node.operator = content;
                    lastAdded = "operator";
                  } else if ((!node.namespace || lastAdded === "namespace" && !spaceAfterMeaningfulToken) && next) {
                    if (spaceBefore) {
                      (0, util_1.ensureObject)(node, "spaces", "attribute");
                      node.spaces.attribute.before = spaceBefore;
                      spaceBefore = "";
                    }
                    if (commentBefore) {
                      (0, util_1.ensureObject)(node, "raws", "spaces", "attribute");
                      node.raws.spaces.attribute.before = spaceBefore;
                      commentBefore = "";
                    }
                    node.namespace = (node.namespace || "") + content;
                    var rawValue = (0, util_1.getProp)(node, "raws", "namespace") || null;
                    if (rawValue) {
                      node.raws.namespace += content;
                    }
                    lastAdded = "namespace";
                  }
                  spaceAfterMeaningfulToken = false;
                  break;
                case tokens.dollar:
                  if (lastAdded === "value") {
                    var oldRawValue = (0, util_1.getProp)(node, "raws", "value");
                    node.value += "$";
                    if (oldRawValue) {
                      node.raws.value = oldRawValue + "$";
                    }
                    break;
                  }
                // Falls through
                case tokens.caret:
                  if (next[tokenize_1.FIELDS.TYPE] === tokens.equals) {
                    node.operator = content;
                    lastAdded = "operator";
                  }
                  spaceAfterMeaningfulToken = false;
                  break;
                case tokens.combinator:
                  if (content === "~" && next[tokenize_1.FIELDS.TYPE] === tokens.equals) {
                    node.operator = content;
                    lastAdded = "operator";
                  }
                  if (content !== "|") {
                    spaceAfterMeaningfulToken = false;
                    break;
                  }
                  if (next[tokenize_1.FIELDS.TYPE] === tokens.equals) {
                    node.operator = content;
                    lastAdded = "operator";
                  } else if (!node.namespace && !node.attribute) {
                    node.namespace = true;
                  }
                  spaceAfterMeaningfulToken = false;
                  break;
                case tokens.word:
                  if (next && this.content(next) === "|" && attr[pos + 2] && attr[pos + 2][tokenize_1.FIELDS.TYPE] !== tokens.equals && // this look-ahead probably fails with comment nodes involved.
                  !node.operator && !node.namespace) {
                    node.namespace = content;
                    lastAdded = "namespace";
                  } else if (!node.attribute || lastAdded === "attribute" && !spaceAfterMeaningfulToken) {
                    if (spaceBefore) {
                      (0, util_1.ensureObject)(node, "spaces", "attribute");
                      node.spaces.attribute.before = spaceBefore;
                      spaceBefore = "";
                    }
                    if (commentBefore) {
                      (0, util_1.ensureObject)(node, "raws", "spaces", "attribute");
                      node.raws.spaces.attribute.before = commentBefore;
                      commentBefore = "";
                    }
                    node.attribute = (node.attribute || "") + content;
                    var rawValue = (0, util_1.getProp)(node, "raws", "attribute") || null;
                    if (rawValue) {
                      node.raws.attribute += content;
                    }
                    lastAdded = "attribute";
                  } else if (!node.value && node.value !== "" || lastAdded === "value" && !(spaceAfterMeaningfulToken || node.quoteMark)) {
                    var unescaped_1 = (0, util_1.unesc)(content);
                    var oldRawValue = (0, util_1.getProp)(node, "raws", "value") || "";
                    var oldValue = node.value || "";
                    node.value = oldValue + unescaped_1;
                    node.quoteMark = null;
                    if (unescaped_1 !== content || oldRawValue) {
                      (0, util_1.ensureObject)(node, "raws");
                      node.raws.value = (oldRawValue || oldValue) + content;
                    }
                    lastAdded = "value";
                  } else {
                    var insensitive = content === "i" || content === "I";
                    if ((node.value || node.value === "") && (node.quoteMark || spaceAfterMeaningfulToken)) {
                      node.insensitive = insensitive;
                      if (!insensitive || content === "I") {
                        (0, util_1.ensureObject)(node, "raws");
                        node.raws.insensitiveFlag = content;
                      }
                      lastAdded = "insensitive";
                      if (spaceBefore) {
                        (0, util_1.ensureObject)(node, "spaces", "insensitive");
                        node.spaces.insensitive.before = spaceBefore;
                        spaceBefore = "";
                      }
                      if (commentBefore) {
                        (0, util_1.ensureObject)(node, "raws", "spaces", "insensitive");
                        node.raws.spaces.insensitive.before = commentBefore;
                        commentBefore = "";
                      }
                    } else if (node.value || node.value === "") {
                      lastAdded = "value";
                      node.value += content;
                      if (node.raws.value) {
                        node.raws.value += content;
                      }
                    }
                  }
                  spaceAfterMeaningfulToken = false;
                  break;
                case tokens.str:
                  if (!node.attribute || !node.operator) {
                    return this.error("Expected an attribute followed by an operator preceding the string.", {
                      index: token[tokenize_1.FIELDS.START_POS]
                    });
                  }
                  var _a4 = (0, attribute_1.unescapeValue)(content), unescaped = _a4.unescaped, quoteMark = _a4.quoteMark;
                  node.value = unescaped;
                  node.quoteMark = quoteMark;
                  lastAdded = "value";
                  (0, util_1.ensureObject)(node, "raws");
                  node.raws.value = content;
                  spaceAfterMeaningfulToken = false;
                  break;
                case tokens.equals:
                  if (!node.attribute) {
                    return this.expected("attribute", token[tokenize_1.FIELDS.START_POS], content);
                  }
                  if (node.value) {
                    return this.error('Unexpected "=" found; an operator was already defined.', {
                      index: token[tokenize_1.FIELDS.START_POS]
                    });
                  }
                  node.operator = node.operator ? node.operator + content : content;
                  lastAdded = "operator";
                  spaceAfterMeaningfulToken = false;
                  break;
                case tokens.comment:
                  if (lastAdded) {
                    if (spaceAfterMeaningfulToken || next && next[tokenize_1.FIELDS.TYPE] === tokens.space || lastAdded === "insensitive") {
                      var lastComment = (0, util_1.getProp)(node, "spaces", lastAdded, "after") || "";
                      var rawLastComment = (0, util_1.getProp)(node, "raws", "spaces", lastAdded, "after") || lastComment;
                      (0, util_1.ensureObject)(node, "raws", "spaces", lastAdded);
                      node.raws.spaces[lastAdded].after = rawLastComment + content;
                    } else {
                      var lastValue = node[lastAdded] || "";
                      var rawLastValue = (0, util_1.getProp)(node, "raws", lastAdded) || lastValue;
                      (0, util_1.ensureObject)(node, "raws");
                      node.raws[lastAdded] = rawLastValue + content;
                    }
                  } else {
                    commentBefore = commentBefore + content;
                  }
                  break;
                default:
                  return this.error('Unexpected "'.concat(content, '" found.'), { index: token[tokenize_1.FIELDS.START_POS] });
              }
              pos++;
            }
            unescapeProp(node, "attribute");
            unescapeProp(node, "namespace");
            this.newNode(new attribute_1.default(node));
            this.position++;
          };
          Parser4.prototype.parseWhitespaceEquivalentTokens = function(stopPosition) {
            if (stopPosition < 0) {
              stopPosition = this.tokens.length;
            }
            var startPosition = this.position;
            var nodes = [];
            var space = "";
            var lastComment = void 0;
            do {
              if (WHITESPACE_TOKENS[this.currToken[tokenize_1.FIELDS.TYPE]]) {
                if (!this.options.lossy) {
                  space += this.content();
                }
              } else if (this.currToken[tokenize_1.FIELDS.TYPE] === tokens.comment) {
                var spaces = {};
                if (space) {
                  spaces.before = space;
                  space = "";
                }
                lastComment = new comment_1.default({
                  value: this.content(),
                  source: getTokenSource(this.currToken),
                  sourceIndex: this.currToken[tokenize_1.FIELDS.START_POS],
                  spaces
                });
                nodes.push(lastComment);
              }
            } while (++this.position < stopPosition);
            if (space) {
              if (lastComment) {
                lastComment.spaces.after = space;
              } else if (!this.options.lossy) {
                var firstToken = this.tokens[startPosition];
                var lastToken = this.tokens[this.position - 1];
                nodes.push(new string_1.default({
                  value: "",
                  source: getSource(firstToken[tokenize_1.FIELDS.START_LINE], firstToken[tokenize_1.FIELDS.START_COL], lastToken[tokenize_1.FIELDS.END_LINE], lastToken[tokenize_1.FIELDS.END_COL]),
                  sourceIndex: firstToken[tokenize_1.FIELDS.START_POS],
                  spaces: { before: space, after: "" }
                }));
              }
            }
            return nodes;
          };
          Parser4.prototype.convertWhitespaceNodesToSpace = function(nodes, requiredSpace) {
            var _this = this;
            if (requiredSpace === void 0) {
              requiredSpace = false;
            }
            var space = "";
            var rawSpace = "";
            nodes.forEach(function(n) {
              var spaceBefore = _this.lossySpace(n.spaces.before, requiredSpace);
              var rawSpaceBefore = _this.lossySpace(n.rawSpaceBefore, requiredSpace);
              space += spaceBefore + _this.lossySpace(n.spaces.after, requiredSpace && spaceBefore.length === 0);
              rawSpace += spaceBefore + n.value + _this.lossySpace(n.rawSpaceAfter, requiredSpace && rawSpaceBefore.length === 0);
            });
            if (rawSpace === space) {
              rawSpace = void 0;
            }
            var result = { space, rawSpace };
            return result;
          };
          Parser4.prototype.isNamedCombinator = function(position) {
            if (position === void 0) {
              position = this.position;
            }
            return this.tokens[position + 0] && this.tokens[position + 0][tokenize_1.FIELDS.TYPE] === tokens.slash && this.tokens[position + 1] && this.tokens[position + 1][tokenize_1.FIELDS.TYPE] === tokens.word && this.tokens[position + 2] && this.tokens[position + 2][tokenize_1.FIELDS.TYPE] === tokens.slash;
          };
          Parser4.prototype.namedCombinator = function() {
            if (this.isNamedCombinator()) {
              var nameRaw = this.content(this.tokens[this.position + 1]);
              var name = (0, util_1.unesc)(nameRaw).toLowerCase();
              var raws = {};
              if (name !== nameRaw) {
                raws.value = "/".concat(nameRaw, "/");
              }
              var node = new combinator_1.default({
                value: "/".concat(name, "/"),
                source: getSource(this.currToken[tokenize_1.FIELDS.START_LINE], this.currToken[tokenize_1.FIELDS.START_COL], this.tokens[this.position + 2][tokenize_1.FIELDS.END_LINE], this.tokens[this.position + 2][tokenize_1.FIELDS.END_COL]),
                sourceIndex: this.currToken[tokenize_1.FIELDS.START_POS],
                raws
              });
              this.position = this.position + 3;
              return node;
            } else {
              this.unexpected();
            }
          };
          Parser4.prototype.combinator = function() {
            var _this = this;
            if (this.content() === "|") {
              return this.namespace();
            }
            var nextSigTokenPos = this.locateNextMeaningfulToken(this.position);
            if (nextSigTokenPos < 0 || this.tokens[nextSigTokenPos][tokenize_1.FIELDS.TYPE] === tokens.comma || this.tokens[nextSigTokenPos][tokenize_1.FIELDS.TYPE] === tokens.closeParenthesis) {
              var nodes = this.parseWhitespaceEquivalentTokens(nextSigTokenPos);
              if (nodes.length > 0) {
                var last = this.current.last;
                if (last) {
                  var _a4 = this.convertWhitespaceNodesToSpace(nodes), space = _a4.space, rawSpace = _a4.rawSpace;
                  if (rawSpace !== void 0) {
                    last.rawSpaceAfter += rawSpace;
                  }
                  last.spaces.after += space;
                } else {
                  nodes.forEach(function(n) {
                    return _this.newNode(n);
                  });
                }
              }
              return;
            }
            var firstToken = this.currToken;
            var spaceOrDescendantSelectorNodes = void 0;
            if (nextSigTokenPos > this.position) {
              spaceOrDescendantSelectorNodes = this.parseWhitespaceEquivalentTokens(nextSigTokenPos);
            }
            var node;
            if (this.isNamedCombinator()) {
              node = this.namedCombinator();
            } else if (this.currToken[tokenize_1.FIELDS.TYPE] === tokens.combinator) {
              node = new combinator_1.default({
                value: this.content(),
                source: getTokenSource(this.currToken),
                sourceIndex: this.currToken[tokenize_1.FIELDS.START_POS]
              });
              this.position++;
            } else if (WHITESPACE_TOKENS[this.currToken[tokenize_1.FIELDS.TYPE]]) {
            } else if (!spaceOrDescendantSelectorNodes) {
              this.unexpected();
            }
            if (node) {
              if (spaceOrDescendantSelectorNodes) {
                var _b2 = this.convertWhitespaceNodesToSpace(spaceOrDescendantSelectorNodes), space = _b2.space, rawSpace = _b2.rawSpace;
                node.spaces.before = space;
                node.rawSpaceBefore = rawSpace;
              }
            } else {
              var _c = this.convertWhitespaceNodesToSpace(spaceOrDescendantSelectorNodes, true), space = _c.space, rawSpace = _c.rawSpace;
              if (!rawSpace) {
                rawSpace = space;
              }
              var spaces = {};
              var raws = { spaces: {} };
              if (space.endsWith(" ") && rawSpace.endsWith(" ")) {
                spaces.before = space.slice(0, space.length - 1);
                raws.spaces.before = rawSpace.slice(0, rawSpace.length - 1);
              } else if (space[0] === " " && rawSpace[0] === " ") {
                spaces.after = space.slice(1);
                raws.spaces.after = rawSpace.slice(1);
              } else {
                raws.value = rawSpace;
              }
              node = new combinator_1.default({
                value: " ",
                source: getTokenSourceSpan(firstToken, this.tokens[this.position - 1]),
                sourceIndex: firstToken[tokenize_1.FIELDS.START_POS],
                spaces,
                raws
              });
            }
            if (this.currToken && this.currToken[tokenize_1.FIELDS.TYPE] === tokens.space) {
              node.spaces.after = this.optionalSpace(this.content());
              this.position++;
            }
            return this.newNode(node);
          };
          Parser4.prototype.comma = function() {
            if (this.position === this.tokens.length - 1) {
              this.root.trailingComma = true;
              this.position++;
              return;
            }
            this.current._inferEndPosition();
            var selector = new selector_1.default({
              source: {
                start: tokenStart(this.tokens[this.position + 1])
              },
              sourceIndex: this.tokens[this.position + 1][tokenize_1.FIELDS.START_POS]
            });
            this.current.parent.append(selector);
            this.current = selector;
            this.position++;
          };
          Parser4.prototype.comment = function() {
            var current = this.currToken;
            this.newNode(new comment_1.default({
              value: this.content(),
              source: getTokenSource(current),
              sourceIndex: current[tokenize_1.FIELDS.START_POS]
            }));
            this.position++;
          };
          Parser4.prototype.error = function(message, opts) {
            throw this.root.error(message, opts);
          };
          Parser4.prototype.missingBackslash = function() {
            return this.error("Expected a backslash preceding the semicolon.", {
              index: this.currToken[tokenize_1.FIELDS.START_POS]
            });
          };
          Parser4.prototype.missingParenthesis = function() {
            return this.expected("opening parenthesis", this.currToken[tokenize_1.FIELDS.START_POS]);
          };
          Parser4.prototype.missingSquareBracket = function() {
            return this.expected("opening square bracket", this.currToken[tokenize_1.FIELDS.START_POS]);
          };
          Parser4.prototype.unexpected = function() {
            return this.error("Unexpected '".concat(this.content(), "'. Escaping special characters with \\ may help."), this.currToken[tokenize_1.FIELDS.START_POS]);
          };
          Parser4.prototype.unexpectedPipe = function() {
            return this.error("Unexpected '|'.", this.currToken[tokenize_1.FIELDS.START_POS]);
          };
          Parser4.prototype.namespace = function() {
            var before2 = this.prevToken && this.content(this.prevToken) || true;
            if (this.nextToken[tokenize_1.FIELDS.TYPE] === tokens.word) {
              this.position++;
              return this.word(before2);
            } else if (this.nextToken[tokenize_1.FIELDS.TYPE] === tokens.asterisk) {
              this.position++;
              return this.universal(before2);
            }
            this.unexpectedPipe();
          };
          Parser4.prototype.nesting = function() {
            if (this.nextToken) {
              var nextContent = this.content(this.nextToken);
              if (nextContent === "|") {
                this.position++;
                return;
              }
            }
            var current = this.currToken;
            this.newNode(new nesting_1.default({
              value: this.content(),
              source: getTokenSource(current),
              sourceIndex: current[tokenize_1.FIELDS.START_POS]
            }));
            this.position++;
          };
          Parser4.prototype.parentheses = function() {
            var last = this.current.last;
            var unbalanced = 1;
            this.position++;
            if (last && last.type === types.PSEUDO) {
              var selector = new selector_1.default({
                source: { start: tokenStart(this.tokens[this.position]) },
                sourceIndex: this.tokens[this.position][tokenize_1.FIELDS.START_POS]
              });
              var cache2 = this.current;
              last.append(selector);
              this.current = selector;
              this.nestingDepth++;
              try {
                if (this.nestingDepth > this.maxNestingDepth) {
                  this.error("Cannot parse selector: nesting depth exceeds the maximum of ".concat(this.maxNestingDepth, "."), { index: this.currToken[tokenize_1.FIELDS.START_POS] });
                }
                while (this.position < this.tokens.length && unbalanced) {
                  if (this.currToken[tokenize_1.FIELDS.TYPE] === tokens.openParenthesis) {
                    unbalanced++;
                  }
                  if (this.currToken[tokenize_1.FIELDS.TYPE] === tokens.closeParenthesis) {
                    unbalanced--;
                  }
                  if (unbalanced) {
                    this.parse();
                  } else {
                    this.current.source.end = tokenEnd(this.currToken);
                    this.current.parent.source.end = tokenEnd(this.currToken);
                    this.position++;
                  }
                }
              } finally {
                this.nestingDepth--;
              }
              this.current = cache2;
            } else {
              var parenStart = this.currToken;
              var parenValue = "(";
              var parenEnd = void 0;
              while (this.position < this.tokens.length && unbalanced) {
                if (this.currToken[tokenize_1.FIELDS.TYPE] === tokens.openParenthesis) {
                  unbalanced++;
                }
                if (this.currToken[tokenize_1.FIELDS.TYPE] === tokens.closeParenthesis) {
                  unbalanced--;
                }
                parenEnd = this.currToken;
                parenValue += this.parseParenthesisToken(this.currToken);
                this.position++;
              }
              if (last) {
                last.appendToPropertyAndEscape("value", parenValue, parenValue);
              } else {
                this.newNode(new string_1.default({
                  value: parenValue,
                  source: getSource(parenStart[tokenize_1.FIELDS.START_LINE], parenStart[tokenize_1.FIELDS.START_COL], parenEnd[tokenize_1.FIELDS.END_LINE], parenEnd[tokenize_1.FIELDS.END_COL]),
                  sourceIndex: parenStart[tokenize_1.FIELDS.START_POS]
                }));
              }
            }
            if (unbalanced) {
              return this.expected("closing parenthesis", this.currToken[tokenize_1.FIELDS.START_POS]);
            }
          };
          Parser4.prototype.pseudo = function() {
            var _this = this;
            var pseudoStr = "";
            var startingToken = this.currToken;
            while (this.currToken && this.currToken[tokenize_1.FIELDS.TYPE] === tokens.colon) {
              pseudoStr += this.content();
              this.position++;
            }
            if (!this.currToken) {
              return this.expected(["pseudo-class", "pseudo-element"], this.position - 1);
            }
            if (this.currToken[tokenize_1.FIELDS.TYPE] === tokens.word) {
              this.splitWord(false, function(first, length) {
                pseudoStr += first;
                _this.newNode(new pseudo_1.default({
                  value: pseudoStr,
                  source: getTokenSourceSpan(startingToken, _this.currToken),
                  sourceIndex: startingToken[tokenize_1.FIELDS.START_POS]
                }));
                if (length > 1 && _this.nextToken && _this.nextToken[tokenize_1.FIELDS.TYPE] === tokens.openParenthesis) {
                  _this.error("Misplaced parenthesis.", {
                    index: _this.nextToken[tokenize_1.FIELDS.START_POS]
                  });
                }
              });
            } else {
              return this.expected(["pseudo-class", "pseudo-element"], this.currToken[tokenize_1.FIELDS.START_POS]);
            }
          };
          Parser4.prototype.space = function() {
            var content = this.content();
            if (this.position === 0 || this.prevToken[tokenize_1.FIELDS.TYPE] === tokens.comma || this.prevToken[tokenize_1.FIELDS.TYPE] === tokens.openParenthesis || this.current.nodes.every(function(node) {
              return node.type === "comment";
            })) {
              this.spaces = this.optionalSpace(content);
              this.position++;
            } else if (this.position === this.tokens.length - 1 || this.nextToken[tokenize_1.FIELDS.TYPE] === tokens.comma || this.nextToken[tokenize_1.FIELDS.TYPE] === tokens.closeParenthesis) {
              this.current.last.spaces.after = this.optionalSpace(content);
              this.position++;
            } else {
              this.combinator();
            }
          };
          Parser4.prototype.string = function() {
            var current = this.currToken;
            this.newNode(new string_1.default({
              value: this.content(),
              source: getTokenSource(current),
              sourceIndex: current[tokenize_1.FIELDS.START_POS]
            }));
            this.position++;
          };
          Parser4.prototype.universal = function(namespace) {
            var nextToken = this.nextToken;
            if (nextToken && this.content(nextToken) === "|") {
              this.position++;
              return this.namespace();
            }
            var current = this.currToken;
            this.newNode(new universal_1.default({
              value: this.content(),
              source: getTokenSource(current),
              sourceIndex: current[tokenize_1.FIELDS.START_POS]
            }), namespace);
            this.position++;
          };
          Parser4.prototype.splitWord = function(namespace, firstCallback) {
            var _this = this;
            var nextToken = this.nextToken;
            var word = this.content();
            while (nextToken && ~[tokens.dollar, tokens.caret, tokens.equals, tokens.word].indexOf(nextToken[tokenize_1.FIELDS.TYPE])) {
              this.position++;
              var current = this.content();
              word += current;
              if (current.lastIndexOf("\\") === current.length - 1) {
                var next = this.nextToken;
                if (next && next[tokenize_1.FIELDS.TYPE] === tokens.space) {
                  word += this.requiredSpace(this.content(next));
                  this.position++;
                }
              }
              nextToken = this.nextToken;
            }
            var hasClass = indexesOf(word, ".").filter(function(i) {
              var escapedDot = word[i - 1] === "\\";
              var isKeyframesPercent = /^\d+\.\d+%$/.test(word);
              return !escapedDot && !isKeyframesPercent;
            });
            var hasId = indexesOf(word, "#").filter(function(i) {
              return word[i - 1] !== "\\";
            });
            var interpolations = indexesOf(word, "#{");
            if (interpolations.length) {
              hasId = hasId.filter(function(hashIndex) {
                return !~interpolations.indexOf(hashIndex);
              });
            }
            var indices = (0, sortAscending_1.default)(uniqs(__spreadArray(__spreadArray([0], __read(hasClass), false), __read(hasId), false)));
            indices.forEach(function(ind, i) {
              var index = indices[i + 1] || word.length;
              var value = word.slice(ind, index);
              if (i === 0 && firstCallback) {
                return firstCallback.call(_this, value, indices.length);
              }
              var node;
              var current2 = _this.currToken;
              var sourceIndex = current2[tokenize_1.FIELDS.START_POS] + indices[i];
              var source = getSource(current2[1], current2[2] + ind, current2[3], current2[2] + (index - 1));
              if (~hasClass.indexOf(ind)) {
                var classNameOpts = {
                  value: value.slice(1),
                  source,
                  sourceIndex
                };
                node = new className_1.default(unescapeProp(classNameOpts, "value"));
              } else if (~hasId.indexOf(ind)) {
                var idOpts = {
                  value: value.slice(1),
                  source,
                  sourceIndex
                };
                node = new id_1.default(unescapeProp(idOpts, "value"));
              } else {
                var tagOpts = {
                  value,
                  source,
                  sourceIndex
                };
                unescapeProp(tagOpts, "value");
                node = new tag_1.default(tagOpts);
              }
              _this.newNode(node, namespace);
              namespace = null;
            });
            this.position++;
          };
          Parser4.prototype.word = function(namespace) {
            var nextToken = this.nextToken;
            if (nextToken && this.content(nextToken) === "|") {
              this.position++;
              return this.namespace();
            }
            return this.splitWord(namespace);
          };
          Parser4.prototype.loop = function() {
            while (this.position < this.tokens.length) {
              this.parse(true);
            }
            this.current._inferEndPosition();
            return this.root;
          };
          Parser4.prototype.parse = function(throwOnParenthesis) {
            switch (this.currToken[tokenize_1.FIELDS.TYPE]) {
              case tokens.space:
                this.space();
                break;
              case tokens.comment:
                this.comment();
                break;
              case tokens.openParenthesis:
                this.parentheses();
                break;
              case tokens.closeParenthesis:
                if (throwOnParenthesis) {
                  this.missingParenthesis();
                }
                break;
              case tokens.openSquare:
                this.attribute();
                break;
              case tokens.dollar:
              case tokens.caret:
              case tokens.equals:
              case tokens.word:
                this.word();
                break;
              case tokens.colon:
                this.pseudo();
                break;
              case tokens.comma:
                this.comma();
                break;
              case tokens.asterisk:
                this.universal();
                break;
              case tokens.ampersand:
                this.nesting();
                break;
              case tokens.slash:
              case tokens.combinator:
                this.combinator();
                break;
              case tokens.str:
                this.string();
                break;
              // These cases throw; no break needed.
              case tokens.closeSquare:
                this.missingSquareBracket();
              case tokens.semicolon:
                this.missingBackslash();
              default:
                this.unexpected();
            }
          };
          Parser4.prototype.expected = function(description, index, found) {
            if (Array.isArray(description)) {
              var last = description.pop();
              description = "".concat(description.join(", "), " or ").concat(last);
            }
            var an = /^[aeiou]/.test(description[0]) ? "an" : "a";
            if (!found) {
              return this.error("Expected ".concat(an, " ").concat(description, "."), { index });
            }
            return this.error("Expected ".concat(an, " ").concat(description, ', found "').concat(found, '" instead.'), { index });
          };
          Parser4.prototype.requiredSpace = function(space) {
            return this.options.lossy ? " " : space;
          };
          Parser4.prototype.optionalSpace = function(space) {
            return this.options.lossy ? "" : space;
          };
          Parser4.prototype.lossySpace = function(space, required) {
            if (this.options.lossy) {
              return required ? " " : "";
            } else {
              return space;
            }
          };
          Parser4.prototype.parseParenthesisToken = function(token) {
            var content = this.content(token);
            if (token[tokenize_1.FIELDS.TYPE] === tokens.space) {
              return this.requiredSpace(content);
            } else {
              return content;
            }
          };
          Parser4.prototype.newNode = function(node, namespace) {
            if (namespace) {
              if (/^ +$/.test(namespace)) {
                if (!this.options.lossy) {
                  this.spaces = (this.spaces || "") + namespace;
                }
                namespace = true;
              }
              node.namespace = namespace;
              unescapeProp(node, "namespace");
            }
            if (this.spaces) {
              node.spaces.before = this.spaces;
              this.spaces = "";
            }
            return this.current.append(node);
          };
          Parser4.prototype.content = function(token) {
            if (token === void 0) {
              token = this.currToken;
            }
            return this.css.slice(token[tokenize_1.FIELDS.START_POS], token[tokenize_1.FIELDS.END_POS]);
          };
          Object.defineProperty(Parser4.prototype, "currToken", {
            get: function() {
              return this.tokens[this.position];
            },
            enumerable: false,
            configurable: true
          });
          Object.defineProperty(Parser4.prototype, "nextToken", {
            get: function() {
              return this.tokens[this.position + 1];
            },
            enumerable: false,
            configurable: true
          });
          Object.defineProperty(Parser4.prototype, "prevToken", {
            get: function() {
              return this.tokens[this.position - 1];
            },
            enumerable: false,
            configurable: true
          });
          Parser4.prototype.locateNextMeaningfulToken = function(startPosition) {
            if (startPosition === void 0) {
              startPosition = this.position + 1;
            }
            var searchPosition = startPosition;
            while (searchPosition < this.tokens.length) {
              if (WHITESPACE_EQUIV_TOKENS[this.tokens[searchPosition][tokenize_1.FIELDS.TYPE]]) {
                searchPosition++;
                continue;
              } else {
                return searchPosition;
              }
            }
            return -1;
          };
          return Parser4;
        })()
      );
      exports.default = Parser3;
    }
  });

  // ../node_modules/.pnpm/postcss-selector-parser@7.1.4/node_modules/postcss-selector-parser/dist/processor.js
  var require_processor2 = __commonJS({
    "../node_modules/.pnpm/postcss-selector-parser@7.1.4/node_modules/postcss-selector-parser/dist/processor.js"(exports) {
      "use strict";
      var __importDefault = exports && exports.__importDefault || function(mod) {
        return mod && mod.__esModule ? mod : { "default": mod };
      };
      Object.defineProperty(exports, "__esModule", { value: true });
      var parser_1 = __importDefault(require_parser2());
      var Processor2 = (
        /** @class */
        (function() {
          function Processor3(func, options) {
            this.func = func || function noop() {
            };
            this.funcRes = null;
            this.options = options;
          }
          Processor3.prototype._shouldUpdateSelector = function(rule2, options) {
            if (options === void 0) {
              options = {};
            }
            var merged = Object.assign({}, this.options, options);
            if (merged.updateSelector === false) {
              return false;
            } else {
              return typeof rule2 !== "string";
            }
          };
          Processor3.prototype._isLossy = function(options) {
            if (options === void 0) {
              options = {};
            }
            var merged = Object.assign({}, this.options, options);
            if (merged.lossless === false) {
              return true;
            } else {
              return false;
            }
          };
          Processor3.prototype._root = function(rule2, options) {
            if (options === void 0) {
              options = {};
            }
            var parser = new parser_1.default(rule2, this._parseOptions(options));
            return parser.root;
          };
          Processor3.prototype._parseOptions = function(options) {
            var merged = Object.assign({}, this.options, options);
            return {
              lossy: this._isLossy(merged),
              maxNestingDepth: merged.maxNestingDepth
            };
          };
          Processor3.prototype._stringifyOptions = function(options) {
            var merged = Object.assign({}, this.options, options);
            return {
              maxNestingDepth: merged.maxNestingDepth
            };
          };
          Processor3.prototype._run = function(rule2, options) {
            var _this = this;
            if (options === void 0) {
              options = {};
            }
            return new Promise(function(resolve, reject) {
              try {
                var root_1 = _this._root(rule2, options);
                Promise.resolve(_this.func(root_1)).then(function(transform) {
                  var string = void 0;
                  if (_this._shouldUpdateSelector(rule2, options)) {
                    string = root_1.toString(_this._stringifyOptions(options));
                    rule2.selector = string;
                  }
                  return { transform, root: root_1, string };
                }).then(resolve, reject);
              } catch (e) {
                reject(e);
                return;
              }
            });
          };
          Processor3.prototype._runSync = function(rule2, options) {
            if (options === void 0) {
              options = {};
            }
            var root2 = this._root(rule2, options);
            var transform = this.func(root2);
            if (transform && typeof transform.then === "function") {
              throw new Error("Selector processor returned a promise to a synchronous call.");
            }
            var string = void 0;
            if (options.updateSelector && typeof rule2 !== "string") {
              string = root2.toString(this._stringifyOptions(options));
              rule2.selector = string;
            }
            return { transform, root: root2, string };
          };
          Processor3.prototype.ast = function(rule2, options) {
            return this._run(rule2, options).then(function(result) {
              return result.root;
            });
          };
          Processor3.prototype.astSync = function(rule2, options) {
            return this._runSync(rule2, options).root;
          };
          Processor3.prototype.transform = function(rule2, options) {
            return this._run(rule2, options).then(function(result) {
              return result.transform;
            });
          };
          Processor3.prototype.transformSync = function(rule2, options) {
            return this._runSync(rule2, options).transform;
          };
          Processor3.prototype.process = function(rule2, options) {
            var _this = this;
            return this._run(rule2, options).then(function(result) {
              return result.string || result.root.toString(_this._stringifyOptions(options));
            });
          };
          Processor3.prototype.processSync = function(rule2, options) {
            var result = this._runSync(rule2, options);
            return result.string || result.root.toString(this._stringifyOptions(options));
          };
          return Processor3;
        })()
      );
      exports.default = Processor2;
    }
  });

  // ../node_modules/.pnpm/postcss-selector-parser@7.1.4/node_modules/postcss-selector-parser/dist/selectors/constructors.js
  var require_constructors = __commonJS({
    "../node_modules/.pnpm/postcss-selector-parser@7.1.4/node_modules/postcss-selector-parser/dist/selectors/constructors.js"(exports) {
      "use strict";
      var __importDefault = exports && exports.__importDefault || function(mod) {
        return mod && mod.__esModule ? mod : { "default": mod };
      };
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.universal = exports.tag = exports.string = exports.selector = exports.root = exports.pseudo = exports.nesting = exports.id = exports.comment = exports.combinator = exports.className = exports.attribute = void 0;
      var attribute_1 = __importDefault(require_attribute());
      var className_1 = __importDefault(require_className());
      var combinator_1 = __importDefault(require_combinator());
      var comment_1 = __importDefault(require_comment2());
      var id_1 = __importDefault(require_id());
      var nesting_1 = __importDefault(require_nesting());
      var pseudo_1 = __importDefault(require_pseudo());
      var root_1 = __importDefault(require_root2());
      var selector_1 = __importDefault(require_selector());
      var string_1 = __importDefault(require_string());
      var tag_1 = __importDefault(require_tag());
      var universal_1 = __importDefault(require_universal());
      var attribute2 = function(opts) {
        return new attribute_1.default(opts);
      };
      exports.attribute = attribute2;
      var className = function(opts) {
        return new className_1.default(opts);
      };
      exports.className = className;
      var combinator = function(opts) {
        return new combinator_1.default(opts);
      };
      exports.combinator = combinator;
      var comment2 = function(opts) {
        return new comment_1.default(opts);
      };
      exports.comment = comment2;
      var id = function(opts) {
        return new id_1.default(opts);
      };
      exports.id = id;
      var nesting = function(opts) {
        return new nesting_1.default(opts);
      };
      exports.nesting = nesting;
      var pseudo = function(opts) {
        return new pseudo_1.default(opts);
      };
      exports.pseudo = pseudo;
      var root2 = function(opts) {
        return new root_1.default(opts);
      };
      exports.root = root2;
      var selector = function(opts) {
        return new selector_1.default(opts);
      };
      exports.selector = selector;
      var string = function(opts) {
        return new string_1.default(opts);
      };
      exports.string = string;
      var tag = function(opts) {
        return new tag_1.default(opts);
      };
      exports.tag = tag;
      var universal = function(opts) {
        return new universal_1.default(opts);
      };
      exports.universal = universal;
    }
  });

  // ../node_modules/.pnpm/postcss-selector-parser@7.1.4/node_modules/postcss-selector-parser/dist/selectors/guards.js
  var require_guards = __commonJS({
    "../node_modules/.pnpm/postcss-selector-parser@7.1.4/node_modules/postcss-selector-parser/dist/selectors/guards.js"(exports) {
      "use strict";
      var _a3;
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.isUniversal = exports.isTag = exports.isString = exports.isSelector = exports.isRoot = exports.isPseudo = exports.isNesting = exports.isIdentifier = exports.isComment = exports.isCombinator = exports.isClassName = exports.isAttribute = void 0;
      exports.isNode = isNode2;
      exports.isPseudoElement = isPseudoElement;
      exports.isPseudoClass = isPseudoClass;
      exports.isContainer = isContainer;
      exports.isNamespace = isNamespace;
      var types_1 = require_types();
      var IS_TYPE = (_a3 = {}, _a3[types_1.ATTRIBUTE] = true, _a3[types_1.CLASS] = true, _a3[types_1.COMBINATOR] = true, _a3[types_1.COMMENT] = true, _a3[types_1.ID] = true, _a3[types_1.NESTING] = true, _a3[types_1.PSEUDO] = true, _a3[types_1.ROOT] = true, _a3[types_1.SELECTOR] = true, _a3[types_1.STRING] = true, _a3[types_1.TAG] = true, _a3[types_1.UNIVERSAL] = true, _a3);
      function isNode2(node) {
        return typeof node === "object" && IS_TYPE[node.type];
      }
      function isNodeType(type, node) {
        return isNode2(node) && node.type === type;
      }
      exports.isAttribute = isNodeType.bind(null, types_1.ATTRIBUTE);
      exports.isClassName = isNodeType.bind(null, types_1.CLASS);
      exports.isCombinator = isNodeType.bind(null, types_1.COMBINATOR);
      exports.isComment = isNodeType.bind(null, types_1.COMMENT);
      exports.isIdentifier = isNodeType.bind(null, types_1.ID);
      exports.isNesting = isNodeType.bind(null, types_1.NESTING);
      exports.isPseudo = isNodeType.bind(null, types_1.PSEUDO);
      exports.isRoot = isNodeType.bind(null, types_1.ROOT);
      exports.isSelector = isNodeType.bind(null, types_1.SELECTOR);
      exports.isString = isNodeType.bind(null, types_1.STRING);
      exports.isTag = isNodeType.bind(null, types_1.TAG);
      exports.isUniversal = isNodeType.bind(null, types_1.UNIVERSAL);
      function isPseudoElement(node) {
        return (0, exports.isPseudo)(node) && node.value && (node.value.startsWith("::") || node.value.toLowerCase() === ":before" || node.value.toLowerCase() === ":after" || node.value.toLowerCase() === ":first-letter" || node.value.toLowerCase() === ":first-line");
      }
      function isPseudoClass(node) {
        return (0, exports.isPseudo)(node) && !isPseudoElement(node);
      }
      function isContainer(node) {
        return !!(isNode2(node) && node.walk);
      }
      function isNamespace(node) {
        return (0, exports.isAttribute)(node) || (0, exports.isTag)(node);
      }
    }
  });

  // ../node_modules/.pnpm/postcss-selector-parser@7.1.4/node_modules/postcss-selector-parser/dist/selectors/index.js
  var require_selectors = __commonJS({
    "../node_modules/.pnpm/postcss-selector-parser@7.1.4/node_modules/postcss-selector-parser/dist/selectors/index.js"(exports) {
      "use strict";
      var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
        if (k2 === void 0) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
          desc = { enumerable: true, get: function() {
            return m[k];
          } };
        }
        Object.defineProperty(o, k2, desc);
      }) : (function(o, m, k, k2) {
        if (k2 === void 0) k2 = k;
        o[k2] = m[k];
      }));
      var __exportStar = exports && exports.__exportStar || function(m, exports2) {
        for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports2, p)) __createBinding(exports2, m, p);
      };
      Object.defineProperty(exports, "__esModule", { value: true });
      __exportStar(require_types(), exports);
      __exportStar(require_constructors(), exports);
      __exportStar(require_guards(), exports);
    }
  });

  // ../node_modules/.pnpm/postcss-selector-parser@7.1.4/node_modules/postcss-selector-parser/dist/index.js
  var require_dist = __commonJS({
    "../node_modules/.pnpm/postcss-selector-parser@7.1.4/node_modules/postcss-selector-parser/dist/index.js"(exports, module) {
      "use strict";
      var __createBinding = exports && exports.__createBinding || (Object.create ? (function(o, m, k, k2) {
        if (k2 === void 0) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
          desc = { enumerable: true, get: function() {
            return m[k];
          } };
        }
        Object.defineProperty(o, k2, desc);
      }) : (function(o, m, k, k2) {
        if (k2 === void 0) k2 = k;
        o[k2] = m[k];
      }));
      var __setModuleDefault = exports && exports.__setModuleDefault || (Object.create ? (function(o, v) {
        Object.defineProperty(o, "default", { enumerable: true, value: v });
      }) : function(o, v) {
        o["default"] = v;
      });
      var __importStar = exports && exports.__importStar || /* @__PURE__ */ (function() {
        var ownKeys = function(o) {
          ownKeys = Object.getOwnPropertyNames || function(o2) {
            var ar = [];
            for (var k in o2) if (Object.prototype.hasOwnProperty.call(o2, k)) ar[ar.length] = k;
            return ar;
          };
          return ownKeys(o);
        };
        return function(mod) {
          if (mod && mod.__esModule) return mod;
          var result = {};
          if (mod != null) {
            for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
          }
          __setModuleDefault(result, mod);
          return result;
        };
      })();
      var __importDefault = exports && exports.__importDefault || function(mod) {
        return mod && mod.__esModule ? mod : { "default": mod };
      };
      var processor_1 = __importDefault(require_processor2());
      var selectors = __importStar(require_selectors());
      var parser = function(processor) {
        return new processor_1.default(processor);
      };
      Object.assign(parser, selectors);
      delete parser.__esModule;
      module.exports = parser;
    }
  });

  // render-entry.mjs
  var render_entry_exports = {};
  __export(render_entry_exports, {
    run: () => run
  });

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/shared/symbols.js
  var CHANGED = /* @__PURE__ */ Symbol("changed");
  var CLASS_LIST = /* @__PURE__ */ Symbol("classList");
  var CUSTOM_ELEMENTS = /* @__PURE__ */ Symbol("CustomElements");
  var CONTENT = /* @__PURE__ */ Symbol("content");
  var DATASET = /* @__PURE__ */ Symbol("dataset");
  var DOCTYPE = /* @__PURE__ */ Symbol("doctype");
  var DOM_PARSER = /* @__PURE__ */ Symbol("DOMParser");
  var END = /* @__PURE__ */ Symbol("end");
  var EVENT_TARGET = /* @__PURE__ */ Symbol("EventTarget");
  var GLOBALS = /* @__PURE__ */ Symbol("globals");
  var IMAGE = /* @__PURE__ */ Symbol("image");
  var MIME = /* @__PURE__ */ Symbol("mime");
  var MUTATION_OBSERVER = /* @__PURE__ */ Symbol("MutationObserver");
  var NEXT = /* @__PURE__ */ Symbol("next");
  var OWNER_ELEMENT = /* @__PURE__ */ Symbol("ownerElement");
  var PREV = /* @__PURE__ */ Symbol("prev");
  var PRIVATE = /* @__PURE__ */ Symbol("private");
  var SHEET = /* @__PURE__ */ Symbol("sheet");
  var START = /* @__PURE__ */ Symbol("start");
  var STYLE = /* @__PURE__ */ Symbol("style");
  var UPGRADE = /* @__PURE__ */ Symbol("upgrade");
  var VALUE = /* @__PURE__ */ Symbol("value");

  // ../node_modules/.pnpm/htmlparser2@10.1.0/node_modules/htmlparser2/dist/esm/index.js
  var esm_exports3 = {};
  __export(esm_exports3, {
    DefaultHandler: () => DomHandler,
    DomHandler: () => DomHandler,
    DomUtils: () => esm_exports2,
    ElementType: () => esm_exports,
    Parser: () => Parser,
    QuoteType: () => QuoteType,
    Tokenizer: () => Tokenizer,
    createDocumentStream: () => createDocumentStream,
    createDomStream: () => createDomStream,
    getFeed: () => getFeed,
    parseDOM: () => parseDOM,
    parseDocument: () => parseDocument,
    parseFeed: () => parseFeed
  });

  // ../node_modules/.pnpm/entities@7.0.1/node_modules/entities/dist/esm/decode-codepoint.js
  var _a;
  var decodeMap = /* @__PURE__ */ new Map([
    [0, 65533],
    // C1 Unicode control character reference replacements
    [128, 8364],
    [130, 8218],
    [131, 402],
    [132, 8222],
    [133, 8230],
    [134, 8224],
    [135, 8225],
    [136, 710],
    [137, 8240],
    [138, 352],
    [139, 8249],
    [140, 338],
    [142, 381],
    [145, 8216],
    [146, 8217],
    [147, 8220],
    [148, 8221],
    [149, 8226],
    [150, 8211],
    [151, 8212],
    [152, 732],
    [153, 8482],
    [154, 353],
    [155, 8250],
    [156, 339],
    [158, 382],
    [159, 376]
  ]);
  var fromCodePoint = (
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, n/no-unsupported-features/es-builtins
    (_a = String.fromCodePoint) !== null && _a !== void 0 ? _a : ((codePoint) => {
      let output = "";
      if (codePoint > 65535) {
        codePoint -= 65536;
        output += String.fromCharCode(codePoint >>> 10 & 1023 | 55296);
        codePoint = 56320 | codePoint & 1023;
      }
      output += String.fromCharCode(codePoint);
      return output;
    })
  );
  function replaceCodePoint(codePoint) {
    var _a3;
    if (codePoint >= 55296 && codePoint <= 57343 || codePoint > 1114111) {
      return 65533;
    }
    return (_a3 = decodeMap.get(codePoint)) !== null && _a3 !== void 0 ? _a3 : codePoint;
  }

  // ../node_modules/.pnpm/entities@7.0.1/node_modules/entities/dist/esm/internal/decode-shared.js
  function decodeBase64(input) {
    const binary = (
      // eslint-disable-next-line n/no-unsupported-features/node-builtins
      typeof atob === "function" ? (
        // Browser (and Node >=16)
        // eslint-disable-next-line n/no-unsupported-features/node-builtins
        atob(input)
      ) : (
        // Older Node versions (<16)
        // eslint-disable-next-line n/no-unsupported-features/node-builtins
        typeof Buffer.from === "function" ? (
          // eslint-disable-next-line n/no-unsupported-features/node-builtins
          Buffer.from(input, "base64").toString("binary")
        ) : (
          // eslint-disable-next-line unicorn/no-new-buffer, n/no-deprecated-api
          new Buffer(input, "base64").toString("binary")
        )
      )
    );
    const evenLength = binary.length & ~1;
    const out = new Uint16Array(evenLength / 2);
    for (let index = 0, outIndex = 0; index < evenLength; index += 2) {
      const lo = binary.charCodeAt(index);
      const hi = binary.charCodeAt(index + 1);
      out[outIndex++] = lo | hi << 8;
    }
    return out;
  }

  // ../node_modules/.pnpm/entities@7.0.1/node_modules/entities/dist/esm/generated/decode-data-html.js
  var htmlDecodeTree = /* @__PURE__ */ decodeBase64("QR08ALkAAgH6AYsDNQR2BO0EPgXZBQEGLAbdBxMISQrvCmQLfQurDKQNLw4fD4YPpA+6D/IPAAAAAAAAAAAAAAAAKhBMEY8TmxUWF2EYLBkxGuAa3RsJHDscWR8YIC8jSCSIJcMl6ie3Ku8rEC0CLjoupS7kLgAIRU1hYmNmZ2xtbm9wcnN0dVQAWgBeAGUAaQBzAHcAfgCBAIQAhwCSAJoAoACsALMAbABpAGcAO4DGAMZAUAA7gCYAJkBjAHUAdABlADuAwQDBQHIiZXZlAAJhAAFpeW0AcgByAGMAO4DCAMJAEGRyAADgNdgE3XIAYQB2AGUAO4DAAMBA8CFoYZFj4SFjcgBhZAAAoFMqAAFncIsAjgBvAG4ABGFmAADgNdg43fAlbHlGdW5jdGlvbgCgYSBpAG4AZwA7gMUAxUAAAWNzpACoAHIAAOA12Jzc6SFnbgCgVCJpAGwAZABlADuAwwDDQG0AbAA7gMQAxEAABGFjZWZvcnN1xQDYANoA7QDxAPYA+QD8AAABY3LJAM8AayNzbGFzaAAAoBYidgHTANUAAKDnKmUAZAAAoAYjeQARZIABY3J0AOAA5QDrAGEidXNlAACgNSLuI291bGxpcwCgLCFhAJJjcgAA4DXYBd1wAGYAAOA12Dnd5SF2ZdhiYwDyAOoAbSJwZXEAAKBOIgAHSE9hY2RlZmhpbG9yc3UXARoBHwE6AVIBVQFiAWQBZgGCAakB6QHtAfIBYwB5ACdkUABZADuAqQCpQIABY3B5ACUBKAE1AfUhdGUGYWmg0iJ0KGFsRGlmZmVyZW50aWFsRAAAoEUhbCJleXMAAKAtIQACYWVpb0EBRAFKAU0B8iFvbgxhZABpAGwAO4DHAMdAcgBjAAhhbiJpbnQAAKAwIm8AdAAKYQABZG5ZAV0BaSJsbGEAuGB0I2VyRG90ALdg8gA5AWkAp2NyImNsZQAAAkRNUFRwAXQBeQF9AW8AdAAAoJkiaSJudXMAAKCWIuwhdXMAoJUiaSJtZXMAAKCXIm8AAAFjc4cBlAFrKndpc2VDb250b3VySW50ZWdyYWwAAKAyImUjQ3VybHkAAAFEUZwBpAFvJXVibGVRdW90ZQAAoB0gdSJvdGUAAKAZIAACbG5wdbABtgHNAdgBbwBuAGWgNyIAoHQqgAFnaXQAvAHBAcUB8iJ1ZW50AKBhIm4AdAAAoC8i7yV1ckludGVncmFsAKAuIgABZnLRAdMBAKACIe8iZHVjdACgECJuLnRlckNsb2Nrd2lzZUNvbnRvdXJJbnRlZ3JhbAAAoDMi7yFzcwCgLypjAHIAAOA12J7ccABDoNMiYQBwAACgTSKABURKU1phY2VmaW9zAAsCEgIVAhgCGwIsAjQCOQI9AnMCfwNvoEUh9CJyYWhkAKARKWMAeQACZGMAeQAFZGMAeQAPZIABZ3JzACECJQIoAuchZXIAoCEgcgAAoKEhaAB2AACg5CoAAWF5MAIzAvIhb24OYRRkbAB0oAciYQCUY3IAAOA12AfdAAFhZkECawIAAWNtRQJnAvIjaXRpY2FsAAJBREdUUAJUAl8CYwJjInV0ZQC0YG8AdAFZAloC2WJiJGxlQWN1dGUA3WJyImF2ZQBgYGkibGRlANxi7yFuZACgxCJmJWVyZW50aWFsRAAAoEYhcAR9AgAAAAAAAIECjgIAABoDZgAA4DXYO91EoagAhQKJAm8AdAAAoNwgcSJ1YWwAAKBQIuIhbGUAA0NETFJVVpkCqAK1Au8C/wIRA28AbgB0AG8AdQByAEkAbgB0AGUAZwByAGEA7ADEAW8AdAKvAgAAAACwAqhgbiNBcnJvdwAAoNMhAAFlb7kC0AJmAHQAgAFBUlQAwQLGAs0CciJyb3cAAKDQIekkZ2h0QXJyb3cAoNQhZQDlACsCbgBnAAABTFLWAugC5SFmdAABQVLcAuECciJyb3cAAKD4J+kkZ2h0QXJyb3cAoPon6SRnaHRBcnJvdwCg+SdpImdodAAAAUFU9gL7AnIicm93AACg0iFlAGUAAKCoInAAQQIGAwAAAAALA3Iicm93AACg0SFvJHduQXJyb3cAAKDVIWUlcnRpY2FsQmFyAACgJSJuAAADQUJMUlRhJAM2AzoDWgNxA3oDciJyb3cAAKGTIUJVLAMwA2EAcgAAoBMpcCNBcnJvdwAAoPUhciJldmUAEWPlIWZ00gJDAwAASwMAAFIDaSVnaHRWZWN0b3IAAKBQKWUkZVZlY3RvcgAAoF4p5SJjdG9yQqC9IWEAcgAAoFYpaSJnaHQA1AFiAwAAaQNlJGVWZWN0b3IAAKBfKeUiY3RvckKgwSFhAHIAAKBXKWUAZQBBoKQiciJyb3cAAKCnIXIAcgBvAPcAtAIAAWN0gwOHA3IAAOA12J/c8iFvaxBhAAhOVGFjZGZnbG1vcHFzdHV4owOlA6kDsAO/A8IDxgPNA9ID8gP9AwEEFAQeBCAEJQRHAEphSAA7gNAA0EBjAHUAdABlADuAyQDJQIABYWl5ALYDuQO+A/Ihb24aYXIAYwA7gMoAykAtZG8AdAAWYXIAAOA12AjdcgBhAHYAZQA7gMgAyEDlIm1lbnQAoAgiAAFhcNYD2QNjAHIAEmF0AHkAUwLhAwAAAADpA20lYWxsU3F1YXJlAACg+yVlJ3J5U21hbGxTcXVhcmUAAKCrJQABZ3D2A/kDbwBuABhhZgAA4DXYPN3zImlsb26VY3UAAAFhaQYEDgRsAFSgdSppImxkZQAAoEIi7CNpYnJpdW0AoMwhAAFjaRgEGwRyAACgMCFtAACgcyphAJdjbQBsADuAywDLQAABaXApBC0E8yF0cwCgAyLvJG5lbnRpYWxFAKBHIYACY2Zpb3MAPQQ/BEMEXQRyBHkAJGRyAADgNdgJ3WwibGVkAFMCTAQAAAAAVARtJWFsbFNxdWFyZQAAoPwlZSdyeVNtYWxsU3F1YXJlAACgqiVwA2UEAABpBAAAAABtBGYAAOA12D3dwSFsbACgACLyI2llcnRyZgCgMSFjAPIAcQQABkpUYWJjZGZnb3JzdIgEiwSOBJMElwSkBKcEqwStBLIE5QTqBGMAeQADZDuAPgA+QO0hbWFkoJMD3GNyImV2ZQAeYYABZWl5AJ0EoASjBOQhaWwiYXIAYwAcYRNkbwB0ACBhcgAA4DXYCt0AoNkicABmAADgNdg+3eUiYXRlcgADRUZHTFNUvwTIBM8E1QTZBOAEcSJ1YWwATKBlIuUhc3MAoNsidSRsbEVxdWFsAACgZyJyI2VhdGVyAACgoirlIXNzAKB3IuwkYW50RXF1YWwAoH4qaSJsZGUAAKBzImMAcgAA4DXYotwAoGsiAARBYWNmaW9zdfkE/QQFBQgFCwUTBSIFKwVSIkRjeQAqZAABY3QBBQQFZQBrAMdiXmDpIXJjJGFyAACgDCFsJWJlcnRTcGFjZQAAoAsh8AEYBQAAGwVmAACgDSHpJXpvbnRhbExpbmUAoAAlAAFjdCYFKAXyABIF8iFvayZhbQBwAEQBMQU5BW8AdwBuAEgAdQBtAPAAAAFxInVhbAAAoE8iAAdFSk9hY2RmZ21ub3N0dVMFVgVZBVwFYwVtBXAFcwV6BZAFtgXFBckFzQVjAHkAFWTsIWlnMmFjAHkAAWRjAHUAdABlADuAzQDNQAABaXlnBWwFcgBjADuAzgDOQBhkbwB0ADBhcgAAoBEhcgBhAHYAZQA7gMwAzEAAoREhYXB/BYsFAAFjZ4MFhQVyACphaSNuYXJ5SQAAoEghbABpAGUA8wD6AvQBlQUAAKUFZaAsIgABZ3KaBZ4F8iFhbACgKyLzI2VjdGlvbgCgwiJpI3NpYmxlAAABQ1SsBbEFbyJtbWEAAKBjIGkibWVzAACgYiCAAWdwdAC8Bb8FwwVvAG4ALmFmAADgNdhA3WEAmWNjAHIAAKAQIWkibGRlAChh6wHSBQAA1QVjAHkABmRsADuAzwDPQIACY2Zvc3UA4QXpBe0F8gX9BQABaXnlBegFcgBjADRhGWRyAADgNdgN3XAAZgAA4DXYQd3jAfcFAAD7BXIAAOA12KXc8iFjeQhk6yFjeQRkgANISmFjZm9zAAwGDwYSBhUGHQYhBiYGYwB5ACVkYwB5AAxk8CFwYZpjAAFleRkGHAbkIWlsNmEaZHIAAOA12A7dcABmAADgNdhC3WMAcgAA4DXYptyABUpUYWNlZmxtb3N0AD0GQAZDBl4GawZkB2gHcAd0B80H2gdjAHkACWQ7gDwAPECAAmNtbnByAEwGTwZSBlUGWwb1IXRlOWHiIWRhm2NnAACg6ifsI2FjZXRyZgCgEiFyAACgniGAAWFleQBkBmcGagbyIW9uPWHkIWlsO2EbZAABZnNvBjQHdAAABUFDREZSVFVWYXKABp4GpAbGBssG3AYDByEHwQIqBwABbnKEBowGZyVsZUJyYWNrZXQAAKDoJ/Ihb3cAoZAhQlKTBpcGYQByAACg5CHpJGdodEFycm93AKDGIWUjaWxpbmcAAKAII28A9QGqBgAAsgZiJWxlQnJhY2tldAAAoOYnbgDUAbcGAAC+BmUkZVZlY3RvcgAAoGEp5SJjdG9yQqDDIWEAcgAAoFkpbCJvb3IAAKAKI2kiZ2h0AAABQVbSBtcGciJyb3cAAKCUIeUiY3RvcgCgTikAAWVy4AbwBmUAAKGjIkFW5gbrBnIicm93AACgpCHlImN0b3IAoFopaSNhbmdsZQBCorIi+wYAAAAA/wZhAHIAAKDPKXEidWFsAACgtCJwAIABRFRWAAoHEQcYB+8kd25WZWN0b3IAoFEpZSRlVmVjdG9yAACgYCnlImN0b3JCoL8hYQByAACgWCnlImN0b3JCoLwhYQByAACgUilpAGcAaAB0AGEAcgByAG8A9wDMAnMAAANFRkdMU1Q/B0cHTgdUB1gHXwfxJXVhbEdyZWF0ZXIAoNoidSRsbEVxdWFsAACgZiJyI2VhdGVyAACgdiLlIXNzAKChKuwkYW50RXF1YWwAoH0qaSJsZGUAAKByInIAAOA12A/dZaDYIuYjdGFycm93AKDaIWkiZG90AD9hgAFucHcAege1B7kHZwAAAkxSbHKCB5QHmwerB+UhZnQAAUFSiAeNB3Iicm93AACg9SfpJGdodEFycm93AKD3J+kkZ2h0QXJyb3cAoPYn5SFmdAABYXLcAqEHaQBnAGgAdABhAHIAcgBvAPcA5wJpAGcAaAB0AGEAcgByAG8A9wDuAmYAAOA12EPdZQByAAABTFK/B8YHZSRmdEFycm93AACgmSHpJGdodEFycm93AKCYIYABY2h0ANMH1QfXB/IAWgYAoLAh8iFva0FhAKBqIgAEYWNlZmlvc3XpB+wH7gf/BwMICQgOCBEIcAAAoAUpeQAcZAABZGzyB/kHaSR1bVNwYWNlAACgXyBsI2ludHJmAACgMyFyAADgNdgQ3e4jdXNQbHVzAKATInAAZgAA4DXYRN1jAPIA/gecY4AESmFjZWZvc3R1ACEIJAgoCDUIgQiFCDsKQApHCmMAeQAKZGMidXRlAENhgAFhZXkALggxCDQI8iFvbkdh5CFpbEVhHWSAAWdzdwA7CGEIfQjhInRpdmWAAU1UVgBECEwIWQhlJWRpdW1TcGFjZQAAoAsgaABpAAABY25SCFMIawBTAHAAYQBjAOUASwhlAHIAeQBUAGgAaQDuAFQI9CFlZAABR0xnCHUIcgBlAGEAdABlAHIARwByAGUAYQB0AGUA8gDrBGUAcwBzAEwAZQBzAPMA2wdMImluZQAKYHIAAOA12BHdAAJCbnB0jAiRCJkInAhyImVhawAAoGAgwiZyZWFraW5nU3BhY2WgYGYAAKAVIUOq7CqzCMIIzQgAAOcIGwkAAAAAAAAtCQAAbwkAAIcJAACdCcAJGQoAADQKAAFvdbYIvAjuI2dydWVudACgYiJwIkNhcAAAoG0ibyh1YmxlVmVydGljYWxCYXIAAKAmIoABbHF4ANII1wjhCOUibWVudACgCSL1IWFsVKBgImkibGRlAADgQiI4A2kic3RzAACgBCJyI2VhdGVyAACjbyJFRkdMU1T1CPoIAgkJCQ0JFQlxInVhbAAAoHEidSRsbEVxdWFsAADgZyI4A3IjZWF0ZXIAAOBrIjgD5SFzcwCgeSLsJGFudEVxdWFsAOB+KjgDaSJsZGUAAKB1IvUhbXBEASAJJwnvI3duSHVtcADgTiI4A3EidWFsAADgTyI4A2UAAAFmczEJRgn0JFRyaWFuZ2xlQqLqIj0JAAAAAEIJYQByAADgzyk4A3EidWFsAACg7CJzAICibiJFR0xTVABRCVYJXAlhCWkJcSJ1YWwAAKBwInIjZWF0ZXIAAKB4IuUhc3MA4GoiOAPsJGFudEVxdWFsAOB9KjgDaSJsZGUAAKB0IuUic3RlZAABR0x1CX8J8iZlYXRlckdyZWF0ZXIA4KIqOAPlI3NzTGVzcwDgoSo4A/IjZWNlZGVzAKGAIkVTjwmVCXEidWFsAADgryo4A+wkYW50RXF1YWwAoOAiAAFlaaAJqQl2JmVyc2VFbGVtZW50AACgDCLnJWh0VHJpYW5nbGVCousitgkAAAAAuwlhAHIAAODQKTgDcSJ1YWwAAKDtIgABcXXDCeAJdSNhcmVTdQAAAWJwywnVCfMhZXRF4I8iOANxInVhbAAAoOIi5SJyc2V0ReCQIjgDcSJ1YWwAAKDjIoABYmNwAOYJ8AkNCvMhZXRF4IIi0iBxInVhbAAAoIgi4yJlZWRzgKGBIkVTVAD6CQAKBwpxInVhbAAA4LAqOAPsJGFudEVxdWFsAKDhImkibGRlAADgfyI4A+UicnNldEXggyLSIHEidWFsAACgiSJpImxkZQCAoUEiRUZUACIKJwouCnEidWFsAACgRCJ1JGxsRXF1YWwAAKBHImkibGRlAACgSSJlJXJ0aWNhbEJhcgAAoCQiYwByAADgNdip3GkAbABkAGUAO4DRANFAnWMAB0VhY2RmZ21vcHJzdHV2XgphCmgKcgp2CnoKgQqRCpYKqwqtCrsKyArNCuwhaWdSYWMAdQB0AGUAO4DTANNAAAFpeWwKcQpyAGMAO4DUANRAHmRiImxhYwBQYXIAAOA12BLdcgBhAHYAZQA7gNIA0kCAAWFlaQCHCooKjQpjAHIATGFnAGEAqWNjInJvbgCfY3AAZgAA4DXYRt3lI25DdXJseQABRFGeCqYKbyV1YmxlUXVvdGUAAKAcIHUib3RlAACgGCAAoFQqAAFjbLEKtQpyAADgNdiq3GEAcwBoADuA2ADYQGkAbAHACsUKZABlADuA1QDVQGUAcwAAoDcqbQBsADuA1gDWQGUAcgAAAUJQ0wrmCgABYXLXCtoKcgAAoD4gYQBjAAABZWvgCuIKAKDeI2UAdAAAoLQjYSVyZW50aGVzaXMAAKDcI4AEYWNmaGlsb3JzAP0KAwsFCwkLCwsMCxELIwtaC3IjdGlhbEQAAKACInkAH2RyAADgNdgT3WkApmOgY/Ujc01pbnVzsWAAAWlwFQsgC24AYwBhAHIAZQBwAGwAYQBuAOUACgVmAACgGSGAobsqZWlvACoLRQtJC+MiZWRlc4CheiJFU1QANAs5C0ALcSJ1YWwAAKCvKuwkYW50RXF1YWwAoHwiaSJsZGUAAKB+Im0AZQAAoDMgAAFkcE0LUQv1IWN0AKAPIm8jcnRpb24AYaA3ImwAAKAdIgABY2leC2ILcgAA4DXYq9yoYwACVWZvc2oLbwtzC3cLTwBUADuAIgAiQHIAAOA12BTdcABmAACgGiFjAHIAAOA12KzcAAZCRWFjZWZoaW9yc3WPC5MLlwupC7YL2AvbC90LhQyTDJoMowzhIXJyAKAQKUcAO4CuAK5AgAFjbnIAnQugC6ML9SF0ZVRhZwAAoOsncgB0oKAhbAAAoBYpgAFhZXkArwuyC7UL8iFvblhh5CFpbFZhIGR2oBwhZSJyc2UAAAFFVb8LzwsAAWxxwwvIC+UibWVudACgCyL1JGlsaWJyaXVtAKDLIXAmRXF1aWxpYnJpdW0AAKBvKXIAAKAcIW8AoWPnIWh0AARBQ0RGVFVWYewLCgwQDDIMNwxeDHwM9gIAAW5y8Av4C2clbGVCcmFja2V0AACg6SfyIW93AKGSIUJM/wsDDGEAcgAAoOUhZSRmdEFycm93AACgxCFlI2lsaW5nAACgCSNvAPUBFgwAAB4MYiVsZUJyYWNrZXQAAKDnJ24A1AEjDAAAKgxlJGVWZWN0b3IAAKBdKeUiY3RvckKgwiFhAHIAAKBVKWwib29yAACgCyMAAWVyOwxLDGUAAKGiIkFWQQxGDHIicm93AACgpiHlImN0b3IAoFspaSNhbmdsZQBCorMiVgwAAAAAWgxhAHIAAKDQKXEidWFsAACgtSJwAIABRFRWAGUMbAxzDO8kd25WZWN0b3IAoE8pZSRlVmVjdG9yAACgXCnlImN0b3JCoL4hYQByAACgVCnlImN0b3JCoMAhYQByAACgUykAAXB1iQyMDGYAAKAdIe4kZEltcGxpZXMAoHAp6SRnaHRhcnJvdwCg2yEAAWNongyhDHIAAKAbIQCgsSHsJGVEZWxheWVkAKD0KYAGSE9hY2ZoaW1vcXN0dQC/DMgMzAzQDOIM5gwKDQ0NFA0ZDU8NVA1YDQABQ2PDDMYMyCFjeSlkeQAoZEYiVGN5ACxkYyJ1dGUAWmEAorwqYWVpedgM2wzeDOEM8iFvbmBh5CFpbF5hcgBjAFxhIWRyAADgNdgW3e8hcnQAAkRMUlXvDPYM/QwEDW8kd25BcnJvdwAAoJMhZSRmdEFycm93AACgkCHpJGdodEFycm93AKCSIXAjQXJyb3cAAKCRIechbWGjY+EkbGxDaXJjbGUAoBgicABmAADgNdhK3XICHw0AAAAAIg10AACgGiLhIXJlgKGhJUlTVQAqDTINSg3uJXRlcnNlY3Rpb24AoJMidQAAAWJwNw1ADfMhZXRFoI8icSJ1YWwAAKCRIuUicnNldEWgkCJxInVhbAAAoJIibiJpb24AAKCUImMAcgAA4DXYrtxhAHIAAKDGIgACYmNtcF8Nag2ODZANc6DQImUAdABFoNAicSJ1YWwAAKCGIgABY2huDYkNZSJlZHMAgKF7IkVTVAB4DX0NhA1xInVhbAAAoLAq7CRhbnRFcXVhbACgfSJpImxkZQAAoH8iVABoAGEA9ADHCwCgESIAodEiZXOVDZ8NciJzZXQARaCDInEidWFsAACghyJlAHQAAKDRIoAFSFJTYWNmaGlvcnMAtQ27Db8NyA3ODdsN3w3+DRgOHQ4jDk8AUgBOADuA3gDeQMEhREUAoCIhAAFIY8MNxg1jAHkAC2R5ACZkAAFidcwNzQ0JYKRjgAFhZXkA1A3XDdoN8iFvbmRh5CFpbGJhImRyAADgNdgX3QABZWnjDe4N8gHoDQAA7Q3lImZvcmUAoDQiYQCYYwABY27yDfkNayNTcGFjZQAA4F8gCiDTInBhY2UAoAkg7CFkZYChPCJFRlQABw4MDhMOcSJ1YWwAAKBDInUkbGxFcXVhbAAAoEUiaSJsZGUAAKBIInAAZgAA4DXYS93pI3BsZURvdACg2yAAAWN0Jw4rDnIAAOA12K/c8iFva2Zh4QpFDlYOYA5qDgAAbg5yDgAAAAAAAAAAAAB5DnwOqA6zDgAADg8RDxYPGg8AAWNySA5ODnUAdABlADuA2gDaQHIAb6CfIeMhaXIAoEkpcgDjAVsOAABdDnkADmR2AGUAbGEAAWl5Yw5oDnIAYwA7gNsA20AjZGIibGFjAHBhcgAA4DXYGN1yAGEAdgBlADuA2QDZQOEhY3JqYQABZGl/Dp8OZQByAAABQlCFDpcOAAFhcokOiw5yAF9gYQBjAAABZWuRDpMOAKDfI2UAdAAAoLUjYSVyZW50aGVzaXMAAKDdI28AbgBQoMMi7CF1cwCgjiIAAWdwqw6uDm8AbgByYWYAAOA12EzdAARBREVUYWRwc78O0g7ZDuEOBQPqDvMOBw9yInJvdwDCoZEhyA4AAMwOYQByAACgEilvJHduQXJyb3cAAKDFIW8kd25BcnJvdwAAoJUhcSV1aWxpYnJpdW0AAKBuKWUAZQBBoKUiciJyb3cAAKClIW8AdwBuAGEAcgByAG8A9wAQA2UAcgAAAUxS+Q4AD2UkZnRBcnJvdwAAoJYh6SRnaHRBcnJvdwCglyFpAGyg0gNvAG4ApWPpIW5nbmFjAHIAAOA12LDcaSJsZGUAaGFtAGwAO4DcANxAgAREYmNkZWZvc3YALQ8xDzUPNw89D3IPdg97D4AP4SFzaACgqyJhAHIAAKDrKnkAEmThIXNobKCpIgCg5ioAAWVyQQ9DDwCgwSKAAWJ0eQBJD00Paw9hAHIAAKAWIGmgFiDjIWFsAAJCTFNUWA9cD18PZg9hAHIAAKAjIukhbmV8YGUkcGFyYXRvcgAAoFgnaSJsZGUAAKBAItQkaGluU3BhY2UAoAogcgAA4DXYGd1wAGYAAOA12E3dYwByAADgNdix3GQiYXNoAACgqiKAAmNlZm9zAI4PkQ+VD5kPng/pIXJjdGHkIWdlAKDAInIAAOA12BrdcABmAADgNdhO3WMAcgAA4DXYstwAAmZpb3OqD64Prw+0D3IAAOA12BvdnmNwAGYAAOA12E/dYwByAADgNdiz3IAEQUlVYWNmb3N1AMgPyw/OD9EP2A/gD+QP6Q/uD2MAeQAvZGMAeQAHZGMAeQAuZGMAdQB0AGUAO4DdAN1AAAFpedwP3w9yAGMAdmErZHIAAOA12BzdcABmAADgNdhQ3WMAcgAA4DXYtNxtAGwAeGEABEhhY2RlZm9z/g8BEAUQDRAQEB0QIBAkEGMAeQAWZGMidXRlAHlhAAFheQkQDBDyIW9ufWEXZG8AdAB7YfIBFRAAABwQbwBXAGkAZAB0AOgAVAhhAJZjcgAAoCghcABmAACgJCFjAHIAAOA12LXc4QtCEEkQTRAAAGcQbRByEAAAAAAAAAAAeRCKEJcQ8hD9EAAAGxEhETIROREAAD4RYwB1AHQAZQA7gOEA4UByImV2ZQADYYCiPiJFZGl1eQBWEFkQWxBgEGUQAOA+IjMDAKA/InIAYwA7gOIA4kB0AGUAO4C0ALRAMGRsAGkAZwA7gOYA5kByoGEgAOA12B7dcgBhAHYAZQA7gOAA4EAAAWVwfBCGEAABZnCAEIQQ8yF5bQCgNSHoAIMQaABhALFjAAFhcI0QWwAAAWNskRCTEHIAAWFnAACgPypkApwQAAAAALEQAKInImFkc3ajEKcQqRCuEG4AZAAAoFUqAKBcKmwib3BlAACgWCoAoFoqAKMgImVsbXJzersQvRDAEN0Q5RDtEACgpCllAACgICJzAGQAYaAhImEEzhDQENIQ1BDWENgQ2hDcEACgqCkAoKkpAKCqKQCgqykAoKwpAKCtKQCgrikAoK8pdAB2oB8iYgBkoL4iAKCdKQABcHTpEOwQaAAAoCIixWDhIXJyAKB8IwABZ3D1EPgQbwBuAAVhZgAA4DXYUt0Ao0giRWFlaW9wBxEJEQ0RDxESERQRAKBwKuMhaXIAoG8qAKBKImQAAKBLInMAJ2DyIW94ZaBIIvEADhFpAG4AZwA7gOUA5UCAAWN0eQAmESoRKxFyAADgNdi23CpgbQBwAGWgSCLxAPgBaQBsAGQAZQA7gOMA40BtAGwAO4DkAORAAAFjaUERRxFvAG4AaQBuAPQA6AFuAHQAAKARKgAITmFiY2RlZmlrbG5vcHJzdWQRaBGXEZ8RpxGrEdIR1hErEjASexKKEn0RThNbE3oTbwB0AACg7SoAAWNybBGJEWsAAAJjZXBzdBF4EX0RghHvIW5nAKBMInAjc2lsb24A9mNyImltZQAAoDUgaQBtAGWgPSJxAACgzSJ2AY0RkRFlAGUAAKC9ImUAZABnoAUjZQAAoAUjcgBrAHSgtSPiIXJrAKC2IwABb3mjEaYRbgDnAHcRMWTxIXVvAKAeIIACY21wcnQAtBG5Eb4RwRHFEeEhdXPloDUi5ABwInR5dgAAoLApcwDpAH0RbgBvAPUA6gCAAWFodwDLEcwRzhGyYwCgNiHlIWVuAKBsInIAAOA12B/dZwCAA2Nvc3R1dncA4xHyEQUSEhIhEiYSKRKAAWFpdQDpEesR7xHwAKMFcgBjAACg7yVwAACgwyKAAWRwdAD4EfwRABJvAHQAAKAAKuwhdXMAoAEqaSJtZXMAAKACKnECCxIAAAAADxLjIXVwAKAGKmEAcgAAoAUm8iNpYW5nbGUAAWR1GhIeEu8hd24AoL0lcAAAoLMlcCJsdXMAAKAEKmUA5QBCD+UAkg9hInJvdwAAoA0pgAFha28ANhJoEncSAAFjbjoSZRJrAIABbHN0AEESRxJNEm8jemVuZ2UAAKDrKXEAdQBhAHIA5QBcBPIjaWFuZ2xlgKG0JWRscgBYElwSYBLvIXduAKC+JeUhZnQAoMIlaSJnaHQAAKC4JWsAAKAjJLEBbRIAAHUSsgFxEgAAcxIAoJIlAKCRJTQAAKCTJWMAawAAoIglAAFlb38ShxJx4D0A5SD1IWl2AOBhIuUgdAAAoBAjAAJwdHd4kRKVEpsSnxJmAADgNdhT3XSgpSJvAG0AAKClIvQhaWUAoMgiAAZESFVWYmRobXB0dXayEsES0RLgEvcS+xIKExoTHxMjEygTNxMAAkxSbHK5ErsSvRK/EgCgVyUAoFQlAKBWJQCgUyUAolAlRFVkdckSyxLNEs8SAKBmJQCgaSUAoGQlAKBnJQACTFJsctgS2hLcEt4SAKBdJQCgWiUAoFwlAKBZJQCjUSVITFJobHLrEu0S7xLxEvMS9RIAoGwlAKBjJQCgYCUAoGslAKBiJQCgXyVvAHgAAKDJKQACTFJscgITBBMGEwgTAKBVJQCgUiUAoBAlAKAMJQCiACVEVWR1EhMUExYTGBMAoGUlAKBoJQCgLCUAoDQlaSJudXMAAKCfIuwhdXMAoJ4iaSJtZXMAAKCgIgACTFJsci8TMRMzEzUTAKBbJQCgWCUAoBglAKAUJQCjAiVITFJobHJCE0QTRhNIE0oTTBMAoGolAKBhJQCgXiUAoDwlAKAkJQCgHCUAAWV2UhNVE3YA5QD5AGIAYQByADuApgCmQAACY2Vpb2ITZhNqE24TcgAA4DXYt9xtAGkAAKBPIG0A5aA9IogRbAAAoVwAYmh0E3YTAKDFKfMhdWIAoMgnbAF+E4QTbABloCIgdAAAoCIgcAAAoU4iRWWJE4sTAKCuKvGgTyI8BeEMqRMAAN8TABQDFB8UAAAjFDQUAAAAAIUUAAAAAI0UAAAAANcU4xT3FPsUAACIFQAAlhWAAWNwcgCuE7ET1RP1IXRlB2GAoikiYWJjZHMAuxO/E8QTzhPSE24AZAAAoEQqciJjdXAAAKBJKgABYXXIE8sTcAAAoEsqcAAAoEcqbwB0AACgQCoA4CkiAP4AAWVv2RPcE3QAAKBBIO4ABAUAAmFlaXXlE+8T9RP4E/AB6hMAAO0TcwAAoE0qbwBuAA1hZABpAGwAO4DnAOdAcgBjAAlhcABzAHOgTCptAACgUCpvAHQAC2GAAWRtbgAIFA0UEhRpAGwAO4C4ALhAcCJ0eXYAAKCyKXQAAIGiADtlGBQZFKJAcgBkAG8A9ABiAXIAAOA12CDdgAFjZWkAKBQqFDIUeQBHZGMAawBtoBMn4SFyawCgEyfHY3IAAKPLJUVjZWZtcz8UQRRHFHcUfBSAFACgwykAocYCZWxGFEkUcQAAoFciZQBhAlAUAAAAAGAUciJyb3cAAAFsclYUWhTlIWZ0AKC6IWkiZ2h0AACguyGAAlJTYWNkAGgUaRRrFG8UcxSuYACgyCRzAHQAAKCbIukhcmMAoJoi4SFzaACgnSJuImludAAAoBAqaQBkAACg7yrjIWlyAKDCKfUhYnN1oGMmaQB0AACgYybsApMUmhS2FAAAwxRvAG4AZaA6APGgVCKrAG0CnxQAAAAAoxRhAHSgLABAYAChASJmbKcUqRTuABMNZQAAAW14rhSyFOUhbnQAoAEiZQDzANIB5wG6FAAAwBRkoEUibwB0AACgbSpuAPQAzAGAAWZyeQDIFMsUzhQA4DXYVN1vAOQA1wEAgakAO3MeAdMUcgAAoBchAAFhb9oU3hRyAHIAAKC1IXMAcwAAoBcnAAFjdeYU6hRyAADgNdi43AABYnDuFPIUZaDPKgCg0SploNAqAKDSKuQhb3QAoO8igANkZWxwcnZ3AAYVEBUbFSEVRBVlFYQV4SFycgABbHIMFQ4VAKA4KQCgNSlwAhYVAAAAABkVcgAAoN4iYwAAoN8i4SFycnCgtiEAoD0pgKIqImJjZG9zACsVMBU6FT4VQRVyImNhcAAAoEgqAAFhdTQVNxVwAACgRipwAACgSipvAHQAAKCNInIAAKBFKgDgKiIA/gACYWxydksVURVuFXMVcgByAG2gtyEAoDwpeQCAAWV2dwBYFWUVaRVxAHACXxUAAAAAYxVyAGUA4wAXFXUA4wAZFWUAZQAAoM4iZSJkZ2UAAKDPImUAbgA7gKQApEBlI2Fycm93AAABbHJ7FX8V5SFmdACgtiFpImdodAAAoLchZQDkAG0VAAFjaYsVkRVvAG4AaQBuAPQAkwFuAHQAAKAxImwiY3R5AACgLSOACUFIYWJjZGVmaGlqbG9yc3R1d3oAuBW7Fb8V1RXgFegV+RUKFhUWHxZUFlcWZRbFFtsW7xb7FgUXChdyAPIAtAJhAHIAAKBlKQACZ2xyc8YVyhXOFdAV5yFlcgCgICDlIXRoAKA4IfIA9QxoAHagECAAoKMiawHZFd4VYSJyb3cAAKAPKWEA4wBfAgABYXnkFecV8iFvbg9hNGQAoUYhYW/tFfQVAAFnciEC8RVyAACgyiF0InNlcQAAoHcqgAFnbG0A/xUCFgUWO4CwALBAdABhALRjcCJ0eXYAAKCxKQABaXIOFhIW8yFodACgfykA4DXYId1hAHIAAAFschsWHRYAoMMhAKDCIYACYWVnc3YAKBauAjYWOhY+Fm0AAKHEIm9zLhY0Fm4AZABzoMQi9SFpdACgZiZhIm1tYQDdY2kAbgAAoPIiAKH3AGlvQxZRFmQAZQAAgfcAO29KFksW90BuI3RpbWVzAACgxyJuAPgAUBZjAHkAUmRjAG8CXhYAAAAAYhZyAG4AAKAeI28AcAAAoA0jgAJscHR1dwBuFnEWdRaSFp4W7CFhciRgZgAA4DXYVd0AotkCZW1wc30WhBaJFo0WcQBkoFAibwB0AACgUSJpIm51cwAAoDgi7CF1cwCgFCLxInVhcmUAoKEiYgBsAGUAYgBhAHIAdwBlAGQAZwDlANcAbgCAAWFkaAClFqoWtBZyAHIAbwD3APUMbwB3AG4AYQByAHIAbwB3APMA8xVhI3Jwb29uAAABbHK8FsAWZQBmAPQAHBZpAGcAaAD0AB4WYgHJFs8WawBhAHIAbwD3AJILbwLUFgAAAADYFnIAbgAAoB8jbwBwAACgDCOAAWNvdADhFukW7BYAAXJ55RboFgDgNdi53FVkbAAAoPYp8iFvaxFhAAFkcvMW9xZvAHQAAKDxImkA5qC/JVsSAAFhaP8WAhdyAPIANQNhAPIA1wvhIm5nbGUAoKYpAAFjaQ4XEBd5AF9k5yJyYXJyAKD/JwAJRGFjZGVmZ2xtbm9wcXJzdHV4MRc4F0YXWxcyBF4XaRd5F40XrBe0F78X2RcVGCEYLRg1GEAYAAFEbzUXgRZvAPQA+BUAAWNzPBdCF3UAdABlADuA6QDpQPQhZXIAoG4qAAJhaW95TRdQF1YXWhfyIW9uG2FyAGOgViI7gOoA6kDsIW9uAKBVIk1kbwB0ABdhAAFEcmIXZhdvAHQAAKBSIgDgNdgi3XKhmipuF3QXYQB2AGUAO4DoAOhAZKCWKm8AdAAAoJgqgKGZKmlscwCAF4UXhxfuInRlcnMAoOcjAKATIWSglSpvAHQAAKCXKoABYXBzAJMXlheiF2MAcgATYXQAeQBzogUinxcAAAAAoRdlAHQAAKAFInAAMaADIDMBqRerFwCgBCAAoAUgAAFnc7AXsRdLYXAAAKACIAABZ3C4F7sXbwBuABlhZgAA4DXYVt2AAWFscwDFF8sXzxdyAHOg1SJsAACg4yl1AHMAAKBxKmkAAKG1A2x21RfYF28AbgC1Y/VjAAJjc3V24BfoF/0XEBgAAWlv5BdWF3IAYwAAoFYiaQLuFwAAAADwF+0ADQThIW50AAFnbPUX+Rd0AHIAAKCWKuUhc3MAoJUqgAFhZWkAAxgGGAoYbABzAD1gcwB0AACgXyJ2AESgYSJEAACgeCrwImFyc2wAoOUpAAFEYRkYHRhvAHQAAKBTInIAcgAAoHEpgAFjZGkAJxgqGO0XcgAAoC8hbwD0AIwCAAFhaDEYMhi3YzuA8ADwQAABbXI5GD0YbAA7gOsA60BvAACgrCCAAWNpcABGGEgYSxhsACFgcwD0ACwEAAFlb08YVxhjAHQAYQB0AGkAbwDuABoEbgBlAG4AdABpAGEAbADlADME4Ql1GAAAgRgAAIMYiBgAAAAAoRilGAAAqhgAALsYvhjRGAAA1xgnGWwAbABpAG4AZwBkAG8AdABzAGUA8QBlF3kARGRtImFsZQAAoEAmgAFpbHIAjRiRGJ0Y7CFpZwCgA/tpApcYAAAAAJoYZwAAoAD7aQBnAACgBPsA4DXYI93sIWlnAKAB++whaWcA4GYAagCAAWFsdACvGLIYthh0AACgbSZpAGcAAKAC+24AcwAAoLElbwBmAJJh8AHCGAAAxhhmAADgNdhX3QABYWvJGMwYbADsAGsEdqDUIgCg2SphI3J0aW50AACgDSoAAWFv2hgiGQABY3PeGB8ZsQPnGP0YBRkSGRUZAAAdGbID7xjyGPQY9xj5GAAA+xg7gL0AvUAAoFMhO4C8ALxAAKBVIQCgWSEAoFshswEBGQAAAxkAoFQhAKBWIbQCCxkOGQAAAAAQGTuAvgC+QACgVyEAoFwhNQAAoFghtgEZGQAAGxkAoFohAKBdITgAAKBeIWwAAKBEIHcAbgAAoCIjYwByAADgNdi73IAIRWFiY2RlZmdpamxub3JzdHYARhlKGVoZXhlmGWkZkhmWGZkZnRmgGa0ZxhnLGc8Z4BkjGmygZyIAoIwqgAFjbXAAUBlTGVgZ9SF0ZfVhbQBhAOSgswM6FgCghipyImV2ZQAfYQABaXliGWUZcgBjAB1hM2RvAHQAIWGAoWUibHFzAMYEcBl6GfGhZSLOBAAAdhlsAGEAbgD0AN8EgKF+KmNkbACBGYQZjBljAACgqSpvAHQAb6CAKmyggioAoIQqZeDbIgD+cwAAoJQqcgAA4DXYJN3noGsirATtIWVsAKA3IWMAeQBTZIChdyJFYWoApxmpGasZAKCSKgCgpSoAoKQqAAJFYWVztBm2Gb0ZwhkAoGkicABwoIoq8iFveACgiipxoIgq8aCIKrUZaQBtAACg5yJwAGYAAOA12FjdYQB2AOUAYwIAAWNp0xnWGXIAAKAKIW0AAKFzImVs3BneGQCgjioAoJAqAIM+ADtjZGxxco0E6xn0GfgZ/BkBGgABY2nvGfEZAKCnKnIAAKB6Km8AdAAAoNci0CFhcgCglSl1ImVzdAAAoHwqgAJhZGVscwAKGvQZFhrVBCAa8AEPGgAAFBpwAHIAbwD4AFkZcgAAoHgpcQAAAWxxxAQbGmwAZQBzAPMASRlpAO0A5AQAAWVuJxouGnIjdG5lcXEAAOBpIgD+xQAsGgAFQWFiY2Vma29zeUAaQxpmGmoabRqDGocalhrCGtMacgDyAMwCAAJpbG1yShpOGlAaVBpyAHMA8ABxD2YAvWBpAGwA9AASBQABZHJYGlsaYwB5AEpkAKGUIWN3YBpkGmkAcgAAoEgpAKCtIWEAcgAAoA8h6SFyYyVhgAFhbHIAcxp7Gn8a8iF0c3WgZSZpAHQAAKBlJuwhaXAAoCYg4yFvbgCguSJyAADgNdgl3XMAAAFld4wakRphInJvdwAAoCUpYSJyb3cAAKAmKYACYW1vcHIAnxqjGqcauhq+GnIAcgAAoP8h9CFodACgOyJrAAABbHKsGrMaZSRmdGFycm93AACgqSHpJGdodGFycm93AKCqIWYAAOA12Fnd4iFhcgCgFSCAAWNsdADIGswa0BpyAADgNdi93GEAcwDoAGka8iFvaydhAAFicNca2xr1IWxsAKBDIOghZW4AoBAg4Qr2GgAA/RoAAAgbExsaGwAAIRs7GwAAAAA+G2IbmRuVG6sbAACyG80b0htjAHUAdABlADuA7QDtQAChYyBpeQEbBhtyAGMAO4DuAO5AOGQAAWN4CxsNG3kANWRjAGwAO4ChAKFAAAFmcssCFhsA4DXYJt1yAGEAdgBlADuA7ADsQIChSCFpbm8AJxsyGzYbAAFpbisbLxtuAHQAAKAMKnQAAKAtIuYhaW4AoNwpdABhAACgKSHsIWlnM2GAAWFvcABDG1sbXhuAAWNndABJG0sbWRtyACthgAFlbHAAcQVRG1UbaQBuAOUAyAVhAHIA9AByBWgAMWFmAACgtyJlAGQAtWEAoggiY2ZvdGkbbRt1G3kb4SFyZQCgBSFpAG4AdKAeImkAZQAAoN0pZABvAPQAWxsAoisiY2VscIEbhRuPG5QbYQBsAACguiIAAWdyiRuNG2UAcgDzACMQ4wCCG2EicmhrAACgFyryIW9kAKA8KgACY2dwdJ8boRukG6gbeQBRZG8AbgAvYWYAAOA12FrdYQC5Y3UAZQBzAHQAO4C/AL9AAAFjabUbuRtyAADgNdi+3G4AAKIIIkVkc3bCG8QbyBvQAwCg+SJvAHQAAKD1Inag9CIAoPMiaaBiIOwhZGUpYesB1hsAANkbYwB5AFZkbAA7gO8A70AAA2NmbW9zdeYb7hvyG/Ub+hsFHAABaXnqG+0bcgBjADVhOWRyAADgNdgn3eEhdGg3YnAAZgAA4DXYW93jAf8bAAADHHIAAOA12L/c8iFjeVhk6yFjeVRkAARhY2ZnaGpvcxUcGhwiHCYcKhwtHDAcNRzwIXBhdqC6A/BjAAFleR4cIRzkIWlsN2E6ZHIAAOA12CjdciJlZW4AOGFjAHkARWRjAHkAXGRwAGYAAOA12FzdYwByAADgNdjA3IALQUJFSGFiY2RlZmdoamxtbm9wcnN0dXYAXhxtHHEcdRx5HN8cBx0dHTwd3B3tHfEdAR4EHh0eLB5FHrwewx7hHgkfPR9LH4ABYXJ0AGQcZxxpHHIA8gBvB/IAxQLhIWlsAKAbKeEhcnIAoA4pZ6BmIgCgiyphAHIAAKBiKWMJjRwAAJAcAACVHAAAAAAAAAAAAACZHJwcAACmHKgcrRwAANIc9SF0ZTph7SJwdHl2AKC0KXIAYQDuAFoG4iFkYbtjZwAAoegnZGyhHKMcAKCRKeUAiwYAoIUqdQBvADuAqwCrQHIAgKOQIWJmaGxwc3QAuhy/HMIcxBzHHMoczhxmoOQhcwAAoB8pcwAAoB0p6wCyGnAAAKCrIWwAAKA5KWkAbQAAoHMpbAAAoKIhAKGrKmFl1hzaHGkAbAAAoBkpc6CtKgDgrSoA/oABYWJyAOUc6RztHHIAcgAAoAwpcgBrAACgcicAAWFr8Rz4HGMAAAFla/Yc9xx7YFtgAAFlc/wc/hwAoIspbAAAAWR1Ax0FHQCgjykAoI0pAAJhZXV5Dh0RHRodHB3yIW9uPmEAAWRpFR0YHWkAbAA8YewAowbiAPccO2QAAmNxcnMkHScdLB05HWEAAKA2KXUAbwDyoBwgqhEAAWR1MB00HeghYXIAoGcpcyJoYXIAAKBLKWgAAKCyIQCiZCJmZ3FzRB1FB5Qdnh10AIACYWhscnQATh1WHWUdbB2NHXIicm93AHSgkCFhAOkAzxxhI3Jwb29uAAABZHVeHWId7yF3bgCgvSFwAACgvCHlJGZ0YXJyb3dzAKDHIWkiZ2h0AIABYWhzAHUdex2DHXIicm93APOglCGdBmEAcgBwAG8AbwBuAPMAzgtxAHUAaQBnAGEAcgByAG8A9wBlGugkcmVldGltZXMAoMsi8aFkIk0HAACaHWwAYQBuAPQAXgcAon0qY2Rnc6YdqR2xHbcdYwAAoKgqbwB0AG+gfypyoIEqAKCDKmXg2iIA/nMAAKCTKoACYWRlZ3MAwB3GHcod1h3ZHXAAcAByAG8A+ACmHG8AdAAAoNYicQAAAWdxzx3SHXQA8gBGB2cAdADyAHQcdADyAFMHaQDtAGMHgAFpbHIA4h3mHeod8yFodACgfClvAG8A8gDKBgDgNdgp3UWgdiIAoJEqYQH1Hf4dcgAAAWR1YB35HWygvCEAoGopbABrAACghCVjAHkAWWQAomoiYWNodAweDx4VHhkecgDyAGsdbwByAG4AZQDyAGAW4SFyZACgaylyAGkAAKD6JQABaW8hHiQe5CFvdEBh9SFzdGGgsCPjIWhlAKCwIwACRWFlczMeNR48HkEeAKBoInAAcKCJKvIhb3gAoIkqcaCHKvGghyo0HmkAbQAAoOYiAARhYm5vcHR3elIeXB5fHoUelh6mHqsetB4AAW5yVh5ZHmcAAKDsJ3IAAKD9IXIA6wCwBmcAgAFsbXIAZh52Hnse5SFmdAABYXKIB2weaQBnAGgAdABhAHIAcgBvAPcAkwfhInBzdG8AoPwnaQBnAGgAdABhAHIAcgBvAPcAmgdwI2Fycm93AAABbHKNHpEeZQBmAPQAxhxpImdodAAAoKwhgAFhZmwAnB6fHqIecgAAoIUpAOA12F3ddQBzAACgLSppIm1lcwAAoDQqYQGvHrMecwB0AACgFyLhAIoOZaHKJbkeRhLuIWdlAKDKJWEAcgBsoCgAdAAAoJMpgAJhY2htdADMHs8e1R7bHt0ecgDyAJ0GbwByAG4AZQDyANYWYQByAGSgyyEAoG0pAKAOIHIAaQAAoL8iAANhY2hpcXTrHu8e1QfzHv0eBh/xIXVvAKA5IHIAAOA12MHcbQDloXIi+h4AAPweAKCNKgCgjyoAAWJ19xwBH28AcqAYIACgGiDyIW9rQmEAhDwAO2NkaGlscXJCBhcfxh0gHyQfKB8sHzEfAAFjaRsfHR8AoKYqcgAAoHkqcgBlAOUAkx3tIWVzAKDJIuEhcnIAoHYpdSJlc3QAAKB7KgABUGk1HzkfYQByAACglillocMlAgdfEnIAAAFkdUIfRx9zImhhcgAAoEop6CFhcgCgZikAAWVuTx9WH3IjdG5lcXEAAOBoIgD+xQBUHwAHRGFjZGVmaGlsbm9wc3VuH3Ifoh+rH68ftx+7H74f5h/uH/MfBwj/HwsgxCFvdACgOiIAAmNscHJ5H30fiR+eH3IAO4CvAK9AAAFldIEfgx8AoEImZaAgJ3MAZQAAoCAnc6CmIXQAbwCAoaYhZGx1AJQfmB+cH28AdwDuAHkDZQBmAPQA6gbwAOkO6yFlcgCgriUAAW95ph+qH+0hbWEAoCkqPGThIXNoAKAUIOElc3VyZWRhbmdsZQCgISJyAADgNdgq3W8AAKAnIYABY2RuAMQfyR/bH3IAbwA7gLUAtUBhoiMi0B8AANMf1x9zAPQAKxFpAHIAAKDwKm8AdAA7gLcAt0B1AHMA4qESIh4TAADjH3WgOCIAoCoqYwHqH+0fcAAAoNsq8gB+GnAAbAB1APMACAgAAWRw9x/7H+UhbHMAoKciZgAA4DXYXt0AAWN0AyAHIHIAAOA12MLc8CFvcwCgPiJsobwDECAVIPQiaW1hcACguCJhAPAAEyAADEdMUlZhYmNkZWZnaGlqbG1vcHJzdHV2dzwgRyBmIG0geSCqILgg2iDeIBEhFSEyIUMhTSFQIZwhnyHSIQAiIyKLIrEivyIUIwABZ3RAIEMgAODZIjgD9uBrItIgBwmAAWVsdABNIF8gYiBmAHQAAAFhclMgWCByInJvdwAAoM0h6SRnaHRhcnJvdwCgziEA4NgiOAP24Goi0iBfCekkZ2h0YXJyb3cAoM8hAAFEZHEgdSDhIXNoAKCvIuEhc2gAoK4igAJiY25wdACCIIYgiSCNIKIgbABhAACgByL1IXRlRGFnAADgICLSIACiSSJFaW9wlSCYIJwgniAA4HAqOANkAADgSyI4A3MASWFyAG8A+AAyCnUAcgBhoG4mbADzoG4mmwjzAa8gAACzIHAAO4CgAKBAbQBwAOXgTiI4AyoJgAJhZW91eQDBIMogzSDWINkg8AHGIAAAyCAAoEMqbwBuAEhh5CFpbEZhbgBnAGSgRyJvAHQAAOBtKjgDcAAAoEIqPWThIXNoAKATIACjYCJBYWRxc3jpIO0g+SD+IAIhDCFyAHIAAKDXIXIAAAFocvIg9SBrAACgJClvoJch9wAGD28AdAAA4FAiOAN1AGkA9gC7CAABZWkGIQohYQByAACgKCntAN8I6SFzdPOgBCLlCHIAAOA12CvdAAJFZXN0/wgcISshLiHxoXEiIiEAABMJ8aFxIgAJAAAnIWwAYQBuAPQAEwlpAO0AGQlyoG8iAKBvIoABQWFwADghOyE/IXIA8gBeIHIAcgAAoK4hYQByAACg8ipzogsiSiEAAAAAxwtkoPwiAKD6ImMAeQBaZIADQUVhZGVzdABcIV8hYiFmIWkhkyGWIXIA8gBXIADgZiI4A3IAcgAAoJohcgAAoCUggKFwImZxcwBwIYQhjiF0AAABYXJ1IXohcgByAG8A9wBlIWkAZwBoAHQAYQByAHIAbwD3AD4h8aFwImAhAACKIWwAYQBuAPQAZwlz4H0qOAMAoG4iaQDtAG0JcqBuImkA5aDqIkUJaQDkADoKAAFwdKMhpyFmAADgNdhf3YCBrAA7aW4AriGvIcchrEBuAIChCSJFZHYAtyG6Ib8hAOD5IjgDbwB0AADg9SI4A+EB1gjEIcYhAKD3IgCg9iJpAHagDCLhAagJzyHRIQCg/iIAoP0igAFhb3IA2CHsIfEhcgCAoSYiYXN0AOAh5SHpIWwAbABlAOwAywhsAADg/SrlIADgAiI4A2wiaW50AACgFCrjoYAi9yEAAPohdQDlAJsJY+CvKjgDZaCAIvEAkwkAAkFhaXQHIgoiFyIeInIA8gBsIHIAcgAAoZshY3cRIhQiAOAzKTgDAOCdITgDZyRodGFycm93AACgmyFyAGkA5aDrIr4JgANjaGltcHF1AC8iPCJHIpwhTSJQIloigKGBImNlcgA2Iv0JOSJ1AOUABgoA4DXYw9zvIXJ0bQKdIQAAAABEImEAcgDhAOEhbQBloEEi8aBEIiYKYQDyAMsIcwB1AAABYnBWIlgi5QDUCeUA3wmAAWJjcABgInMieCKAoYQiRWVzAGci7glqIgDgxSo4A2UAdABl4IIi0iBxAPGgiCJoImMAZaCBIvEA/gmAoYUiRWVzAH8iFgqCIgDgxio4A2UAdABl4IMi0iBxAPGgiSKAIgACZ2lscpIilCKaIpwi7AAMCWwAZABlADuA8QDxQOcAWwlpI2FuZ2xlAAABbHKkIqoi5SFmdGWg6iLxAEUJaSJnaHQAZaDrIvEAvgltoL0DAKEjAGVzuCK8InIAbwAAoBYhcAAAoAcggARESGFkZ2lscnMAziLSItYi2iLeIugi7SICIw8j4SFzaACgrSLhIXJyAKAEKXAAAOBNItIg4SFzaACgrCIAAWV04iLlIgDgZSLSIADgPgDSIG4iZmluAACg3imAAUFldADzIvci+iJyAHIAAKACKQDgZCLSIHLgPADSIGkAZQAA4LQi0iAAAUF0BiMKI3IAcgAAoAMp8iFpZQDgtSLSIGkAbQAA4Dwi0iCAAUFhbgAaIx4jKiNyAHIAAKDWIXIAAAFociMjJiNrAACgIylvoJYh9wD/DuUhYXIAoCcpUxJqFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAVCMAAF4jaSN/I4IjjSOeI8AUAAAAAKYjwCMAANoj3yMAAO8jHiQvJD8kRCQAAWNzVyNsFHUAdABlADuA8wDzQAABaXlhI2cjcgBjoJoiO4D0APRAPmSAAmFiaW9zAHEjdCN3I3EBeiNzAOgAdhTsIWFjUWF2AACgOCrvIWxkAKC8KewhaWdTYQABY3KFI4kjaQByAACgvykA4DXYLN1vA5QjAAAAAJYjAACcI24A22JhAHYAZQA7gPIA8kAAoMEpAAFibaEjjAphAHIAAKC1KQACYWNpdKwjryO6I70jcgDyAFkUAAFpcrMjtiNyAACgvinvIXNzAKC7KW4A5QDZCgCgwCmAAWFlaQDFI8gjyyNjAHIATWFnAGEAyWOAAWNkbgDRI9Qj1iPyIW9uv2MAoLYpdQDzAHgBcABmAADgNdhg3YABYWVsAOQj5yPrI3IAAKC3KXIAcAAAoLkpdQDzAHwBAKMoImFkaW9zdvkj/CMPJBMkFiQbJHIA8gBeFIChXSplZm0AAyQJJAwkcgBvoDQhZgAAoDQhO4CqAKpAO4C6ALpA5yFvZgCgtiJyAACgVipsIm9wZQAAoFcqAKBbKoABY2xvACMkJSQrJPIACCRhAHMAaAA7gPgA+EBsAACgmCJpAGwBMyQ4JGQAZQA7gPUA9UBlAHMAYaCXInMAAKA2Km0AbAA7gPYA9kDiIWFyAKA9I+EKXiQAAHokAAB8JJQkAACYJKkkAAAAALUkEQsAAPAkAAAAAAQleiUAAIMlcgCAoSUiYXN0AGUkbyQBCwCBtgA7bGokayS2QGwAZQDsABgDaQJ1JAAAAAB4JG0AAKDzKgCg/Sp5AD9kcgCAAmNpbXB0AIUkiCSLJJkSjyRuAHQAJWBvAGQALmBpAGwAAKAwIOUhbmsAoDEgcgAA4DXYLd2AAWltbwCdJKAkpCR2oMYD1WNtAGEA9AD+B24AZQAAoA4m9KHAA64kAAC0JGMjaGZvcmsAAKDUItZjAAFhdbgkxCRuAAABY2u9JMIkawBooA8hAKAOIfYAaRpzAACkKwBhYmNkZW1zdNMkIRPXJNsk4STjJOck6yTjIWlyAKAjKmkAcgAAoCIqAAFvdYsW3yQAoCUqAKByKm4AO4CxALFAaQBtAACgJip3AG8AAKAnKoABaXB1APUk+iT+JO4idGludACgFSpmAADgNdhh3W4AZAA7gKMAo0CApHoiRWFjZWlub3N1ABMlFSUYJRslTCVRJVklSSV1JQCgsypwAACgtyp1AOUAPwtjoK8qgKJ6ImFjZW5zACclLSU0JTYlSSVwAHAAcgBvAPgAFyV1AHIAbAB5AGUA8QA/C/EAOAuAAWFlcwA8JUElRSXwInByb3gAoLkqcQBxAACgtSppAG0AAKDoImkA7QBEC20AZQDzoDIgIguAAUVhcwBDJVclRSXwAEAlgAFkZnAATwtfJXElgAFhbHMAZSVpJW0l7CFhcgCgLiPpIW5lAKASI/UhcmYAoBMjdKAdIu8AWQvyIWVsAKCwIgABY2l9JYElcgAA4DXYxdzIY24iY3NwAACgCCAAA2Zpb3BzdZElKxuVJZolnyWkJXIAAOA12C7dcABmAADgNdhi3XIiaW1lAACgVyBjAHIAAOA12MbcgAFhZW8AqiW6JcAldAAAAWVpryW2JXIAbgBpAG8AbgDzABkFbgB0AACgFipzAHQAZaA/APEACRj0AG0LgApBQkhhYmNkZWZoaWxtbm9wcnN0dXgA4yXyJfYl+iVpJpAmpia9JtUm5ib4JlonaCdxJ3UnnietJ7EnyCfiJ+cngAFhcnQA6SXsJe4lcgDyAJkM8gD6AuEhaWwAoBwpYQByAPIA3BVhAHIAAKBkKYADY2RlbnFydAAGJhAmEyYYJiYmKyZaJgABZXUKJg0mAOA9IjEDdABlAFVhaQDjACAN7SJwdHl2AKCzKWcAgKHpJ2RlbAAgJiImJCYAoJIpAKClKeUA9wt1AG8AO4C7ALtAcgAApZIhYWJjZmhscHN0dz0mQCZFJkcmSiZMJk4mUSZVJlgmcAAAoHUpZqDlIXMAAKAgKQCgMylzAACgHinrALka8ACVHmwAAKBFKWkAbQAAoHQpbAAAoKMhAKCdIQABYWleJmImaQBsAACgGilvAG6gNiJhAGwA8wB2C4ABYWJyAG8mciZ2JnIA8gAvEnIAawAAoHMnAAFha3omgSZjAAABZWt/JoAmfWBdYAABZXOFJocmAKCMKWwAAAFkdYwmjiYAoI4pAKCQKQACYWV1eZcmmiajJqUm8iFvbllhAAFkaZ4moSZpAGwAV2HsAA8M4gCAJkBkAAJjbHFzrSawJrUmuiZhAACgNylkImhhcgAAoGkpdQBvAPKgHSCjAWgAAKCzIYABYWNnAMMm0iaUC2wAgKEcIWlwcwDLJs4migxuAOUAoAxhAHIA9ADaC3QAAKCtJYABaWxyANsm3ybjJvMhaHQAoH0pbwBvAPIANgwA4DXYL90AAWFv6ib1JnIAAAFkde8m8SYAoMEhbKDAIQCgbCl2oMED8WOAAWducwD+Jk4nUCdoAHQAAANhaGxyc3QKJxInISc1Jz0nRydyInJvdwB0oJIhYQDpAFYmYSNycG9vbgAAAWR1GiceJ28AdwDuAPAmcAAAoMAh5SFmdAABYWgnJy0ncgByAG8AdwDzAAkMYQByAHAAbwBvAG4A8wATBGklZ2h0YXJyb3dzAACgySFxAHUAaQBnAGEAcgByAG8A9wBZJugkcmVldGltZXMAoMwiZwDaYmkAbgBnAGQAbwB0AHMAZQDxABwYgAFhaG0AYCdjJ2YncgDyAAkMYQDyABMEAKAPIG8idXN0AGGgsSPjIWhlAKCxI+0haWQAoO4qAAJhYnB0fCeGJ4knmScAAW5ygCeDJ2cAAKDtJ3IAAKD+IXIA6wAcDIABYWZsAI8nkieVJ3IAAKCGKQDgNdhj3XUAcwAAoC4qaSJtZXMAAKA1KgABYXCiJ6gncgBnoCkAdAAAoJQp7yJsaW50AKASKmEAcgDyADwnAAJhY2hxuCe8J6EMwCfxIXVvAKA6IHIAAOA12MfcAAFidYAmxCdvAPKgGSCoAYABaGlyAM4n0ifWJ3IAZQDlAE0n7SFlcwCgyiJpAIChuSVlZmwAXAxjEt4n9CFyaQCgzinsInVoYXIAoGgpAKAeIWENBSgJKA0oSyhVKIYoAACLKLAoAAAAAOMo5ygAABApJCkxKW0pcSmHKaYpAACYKgAAAACxKmMidXRlAFthcQB1AO8ABR+ApHsiRWFjZWlucHN5ABwoHignKCooLygyKEEoRihJKACgtCrwASMoAAAlKACguCpvAG4AYWF1AOUAgw1koLAqaQBsAF9hcgBjAF1hgAFFYXMAOCg6KD0oAKC2KnAAAKC6KmkAbQAAoOki7yJsaW50AKATKmkA7QCIDUFkbwB0AGKixSKRFgAAAABTKACgZiqAA0FhY21zdHgAYChkKG8ocyh1KHkogihyAHIAAKDYIXIAAAFocmkoayjrAJAab6CYIfcAzAd0ADuApwCnQGkAO2D3IWFyAKApKW0AAAFpbn4ozQBuAHUA8wDOAHQAAKA2J3IA7+A12DDdIxkAAmFjb3mRKJUonSisKHIAcAAAoG8mAAFoeZkonChjAHkASWRIZHIAdABtAqUoAAAAAKgoaQDkAFsPYQByAGEA7ABsJDuArQCtQAABZ22zKLsobQBhAAChwwNmdroouijCY4CjPCJkZWdsbnByAMgozCjPKNMo1yjaKN4obwB0AACgairxoEMiCw5FoJ4qAKCgKkWgnSoAoJ8qZQAAoEYi7CF1cwCgJCrhIXJyAKByKWEAcgDyAPwMAAJhZWl07Sj8KAEpCCkAAWxz8Sj4KGwAcwBlAHQAbQDpAH8oaABwAACgMyrwImFyc2wAoOQpAAFkbFoPBSllAACgIyNloKoqc6CsKgDgrCoA/oABZmxwABUpGCkfKfQhY3lMZGKgLwBhoMQpcgAAoD8jZgAA4DXYZN1hAAABZHIoKRcDZQBzAHWgYCZpAHQAAKBgJoABY3N1ADYpRilhKQABYXU6KUApcABzoJMiAOCTIgD+cABzoJQiAOCUIgD+dQAAAWJwSylWKQChjyJlcz4NUCllAHQAZaCPIvEAPw0AoZAiZXNIDVspZQB0AGWgkCLxAEkNAKGhJWFmZilbBHIAZQFrKVwEAKChJWEAcgDyAAMNAAJjZW10dyl7KX8pgilyAADgNdjI3HQAbQDuAM4AaQDsAAYpYQByAOYAVw0AAWFyiimOKXIA5qAGJhESAAFhbpIpoylpImdodAAAAWVwmSmgKXAAcwBpAGwAbwDuANkXaADpAKAkcwCvYIACYmNtbnAArin8KY4NJSooKgCkgiJFZGVtbnByc7wpvinCKcgpzCnUKdgp3CkAoMUqbwB0AACgvSpkoIYibwB0AACgwyr1IWx0AKDBKgABRWXQKdIpAKDLKgCgiiLsIXVzAKC/KuEhcnIAoHkpgAFlaXUA4inxKfQpdAAAoYIiZW7oKewpcQDxoIYivSllAHEA8aCKItEpbQAAoMcqAAFicPgp+ikAoNUqAKDTKmMAgKJ7ImFjZW5zAAcqDSoUKhYqRihwAHAAcgBvAPgAIyh1AHIAbAB5AGUA8QCDDfEAfA2AAWFlcwAcKiIqPShwAHAAcgBvAPgAPChxAPEAOShnAACgaiYApoMiMTIzRWRlaGxtbnBzPCo/KkIqRSpHKlIqWCpjKmcqaypzKncqO4C5ALlAO4CyALJAO4CzALNAAKDGKgABb3NLKk4qdAAAoL4qdQBiAACg2CpkoIcibwB0AACgxCpzAAABb3VdKmAqbAAAoMknYgAAoNcq4SFycgCgeyn1IWx0AKDCKgABRWVvKnEqAKDMKgCgiyLsIXVzAKDAKoABZWl1AH0qjCqPKnQAAKGDImVugyqHKnEA8aCHIkYqZQBxAPGgiyJwKm0AAKDIKgABYnCTKpUqAKDUKgCg1iqAAUFhbgCdKqEqrCpyAHIAAKDZIXIAAAFocqYqqCrrAJUab6CZIfcAxQf3IWFyAKAqKWwAaQBnADuA3wDfQOELzyrZKtwq6SrsKvEqAAD1KjQrAAAAAAAAAAAAAEwrbCsAAHErvSsAAAAAAADRK3IC1CoAAAAA2CrnIWV0AKAWI8RjcgDrAOUKgAFhZXkA4SrkKucq8iFvbmVh5CFpbGNhQmRvAPQAIg5sInJlYwAAoBUjcgAA4DXYMd0AAmVpa2/7KhIrKCsuK/IBACsAAAkrZQAAATRm6g0EK28AcgDlAOsNYQBzorgDECsAAAAAEit5AG0A0WMAAWNuFislK2sAAAFhcxsrIStwAHAAcgBvAPgAFw5pAG0AAKA8InMA8AD9DQABYXMsKyEr8AAXDnIAbgA7gP4A/kDsATgrOyswG2QA5QBnAmUAcwCAgdcAO2JkAEMrRCtJK9dAYaCgInIAAKAxKgCgMCqAAWVwcwBRK1MraSvhAAkh4qKkIlsrXysAAAAAYytvAHQAAKA2I2kAcgAAoPEqb+A12GXdcgBrAACg2irhAHgociJpbWUAAKA0IIABYWlwAHYreSu3K2QA5QC+DYADYWRlbXBzdACFK6MrmiunK6wrsCuzK24iZ2xlAACitSVkbHFykCuUK5ornCvvIXduAKC/JeUhZnRloMMl8QACBwCgXCJpImdodABloLkl8QBdDG8AdAAAoOwlaSJudXMAAKA6KuwhdXMAoDkqYgAAoM0p6SFtZQCgOyrlInppdW0AoOIjgAFjaHQAwivKK80rAAFyecYrySsA4DXYydxGZGMAeQBbZPIhb2tnYQABaW/UK9creAD0ANERaCJlYWQAAAFsct4r5ytlAGYAdABhAHIAcgBvAPcAXQbpJGdodGFycm93AKCgIQAJQUhhYmNkZmdobG1vcHJzdHV3CiwNLBEsHSwnLDEsQCxLLFIsYix6LIQsjyzLLOgs7Sz/LAotcgDyAAkDYQByAACgYykAAWNyFSwbLHUAdABlADuA+gD6QPIACQ1yAOMBIywAACUseQBeZHYAZQBtYQABaXkrLDAscgBjADuA+wD7QENkgAFhYmgANyw6LD0scgDyANEO7CFhY3FhYQDyAOAOAAFpckQsSCzzIWh0AKB+KQDgNdgy3XIAYQB2AGUAO4D5APlAYQFWLF8scgAAAWxyWixcLACgvyEAoL4hbABrAACggCUAAWN0Zix2LG8CbCwAAAAAcyxyAG4AZaAcI3IAAKAcI28AcAAAoA8jcgBpAACg+CUAAWFsfiyBLGMAcgBrYTuAqACoQAABZ3CILIssbwBuAHNhZgAA4DXYZt0AA2FkaGxzdZksniynLLgsuyzFLHIAcgBvAPcACQ1vAHcAbgBhAHIAcgBvAPcA2A5hI3Jwb29uAAABbHKvLLMsZQBmAPQAWyxpAGcAaAD0AF0sdQDzAKYOaQAAocUDaGzBLMIs0mNvAG4AxWPwI2Fycm93cwCgyCGAAWNpdADRLOEs5CxvAtcsAAAAAN4scgBuAGWgHSNyAACgHSNvAHAAAKAOI24AZwBvYXIAaQAAoPklYwByAADgNdjK3IABZGlyAPMs9yz6LG8AdAAAoPAi7CFkZWlhaQBmoLUlAKC0JQABYW0DLQYtcgDyAMosbAA7gPwA/EDhIm5nbGUAoKcpgAdBQkRhY2RlZmxub3Byc3oAJy0qLTAtNC2bLZ0toS2/LcMtxy3TLdgt3C3gLfwtcgDyABADYQByAHag6CoAoOkqYQBzAOgA/gIAAW5yOC08LechcnQAoJwpgANla25wcnN0AJkpSC1NLVQtXi1iLYItYQBwAHAA4QAaHG8AdABoAGkAbgDnAKEXgAFoaXIAoSmzJFotbwBwAPQAdCVooJUh7wD4JgABaXVmLWotZwBtAOEAuygAAWJwbi14LXMjZXRuZXEAceCKIgD+AODLKgD+cyNldG5lcQBx4IsiAP4A4MwqAP4AAWhyhi2KLWUAdADhABIraSNhbmdsZQAAAWxyki2WLeUhZnQAoLIiaSJnaHQAAKCzInkAMmThIXNoAKCiIoABZWxyAKcttC24LWKiKCKuLQAAAACyLWEAcgAAoLsicQAAoFoi7CFpcACg7iIAAWJ0vC1eD2EA8gBfD3IAAOA12DPddAByAOkAlS1zAHUAAAFicM0t0C0A4IIi0iAA4IMi0iBwAGYAAOA12GfdcgBvAPAAWQt0AHIA6QCaLQABY3XkLegtcgAA4DXYy9wAAWJw7C30LW4AAAFFZXUt8S0A4IoiAP5uAAABRWV/LfktAOCLIgD+6SJnemFnAKCaKYADY2Vmb3BycwANLhAuJS4pLiMuLi40LukhcmN1YQABZGkULiEuAAFiZxguHC5hAHIAAKBfKmUAcaAnIgCgWSLlIXJwAKAYIXIAAOA12DTdcABmAADgNdho3WWgQCJhAHQA6ABqD2MAcgAA4DXYzNzjCuQRUC4AAFQuAABYLmIuAAAAAGMubS5wLnQuAAAAAIguki4AAJouJxIqEnQAcgDpAB0ScgAA4DXYNd0AAUFhWy5eLnIA8gDnAnIA8gCTB75jAAFBYWYuaS5yAPIA4AJyAPIAjAdhAPAAeh5pAHMAAKD7IoABZHB0APgReS6DLgABZmx9LoAuAOA12GnddQDzAP8RaQBtAOUABBIAAUFhiy6OLnIA8gDuAnIA8gCaBwABY3GVLgoScgAA4DXYzdwAAXB0nS6hLmwAdQDzACUScgDpACASAARhY2VmaW9zdbEuvC7ELsguzC7PLtQu2S5jAAABdXm2LrsudABlADuA/QD9QE9kAAFpecAuwy5yAGMAd2FLZG4AO4ClAKVAcgAA4DXYNt1jAHkAV2RwAGYAAOA12GrdYwByAADgNdjO3AABY23dLt8ueQBOZGwAO4D/AP9AAAVhY2RlZmhpb3N38y73Lv8uAi8MLxAvEy8YLx0vIi9jInV0ZQB6YQABYXn7Lv4u8iFvbn5hN2RvAHQAfGEAAWV0Bi8KL3QAcgDmAB8QYQC2Y3IAAOA12DfdYwB5ADZk5yJyYXJyAKDdIXAAZgAA4DXYa91jAHIAAOA12M/cAAFqbiYvKC8AoA0gagAAoAwg");

  // ../node_modules/.pnpm/entities@7.0.1/node_modules/entities/dist/esm/generated/decode-data-xml.js
  var xmlDecodeTree = /* @__PURE__ */ decodeBase64("AAJhZ2xxBwARABMAFQBtAg0AAAAAAA8AcAAmYG8AcwAnYHQAPmB0ADxg9SFvdCJg");

  // ../node_modules/.pnpm/entities@7.0.1/node_modules/entities/dist/esm/internal/bin-trie-flags.js
  var BinTrieFlags;
  (function(BinTrieFlags3) {
    BinTrieFlags3[BinTrieFlags3["VALUE_LENGTH"] = 49152] = "VALUE_LENGTH";
    BinTrieFlags3[BinTrieFlags3["FLAG13"] = 8192] = "FLAG13";
    BinTrieFlags3[BinTrieFlags3["BRANCH_LENGTH"] = 8064] = "BRANCH_LENGTH";
    BinTrieFlags3[BinTrieFlags3["JUMP_TABLE"] = 127] = "JUMP_TABLE";
  })(BinTrieFlags || (BinTrieFlags = {}));

  // ../node_modules/.pnpm/entities@7.0.1/node_modules/entities/dist/esm/decode.js
  var CharCodes;
  (function(CharCodes4) {
    CharCodes4[CharCodes4["NUM"] = 35] = "NUM";
    CharCodes4[CharCodes4["SEMI"] = 59] = "SEMI";
    CharCodes4[CharCodes4["EQUALS"] = 61] = "EQUALS";
    CharCodes4[CharCodes4["ZERO"] = 48] = "ZERO";
    CharCodes4[CharCodes4["NINE"] = 57] = "NINE";
    CharCodes4[CharCodes4["LOWER_A"] = 97] = "LOWER_A";
    CharCodes4[CharCodes4["LOWER_F"] = 102] = "LOWER_F";
    CharCodes4[CharCodes4["LOWER_X"] = 120] = "LOWER_X";
    CharCodes4[CharCodes4["LOWER_Z"] = 122] = "LOWER_Z";
    CharCodes4[CharCodes4["UPPER_A"] = 65] = "UPPER_A";
    CharCodes4[CharCodes4["UPPER_F"] = 70] = "UPPER_F";
    CharCodes4[CharCodes4["UPPER_Z"] = 90] = "UPPER_Z";
  })(CharCodes || (CharCodes = {}));
  var TO_LOWER_BIT = 32;
  function isNumber(code) {
    return code >= CharCodes.ZERO && code <= CharCodes.NINE;
  }
  function isHexadecimalCharacter(code) {
    return code >= CharCodes.UPPER_A && code <= CharCodes.UPPER_F || code >= CharCodes.LOWER_A && code <= CharCodes.LOWER_F;
  }
  function isAsciiAlphaNumeric(code) {
    return code >= CharCodes.UPPER_A && code <= CharCodes.UPPER_Z || code >= CharCodes.LOWER_A && code <= CharCodes.LOWER_Z || isNumber(code);
  }
  function isEntityInAttributeInvalidEnd(code) {
    return code === CharCodes.EQUALS || isAsciiAlphaNumeric(code);
  }
  var EntityDecoderState;
  (function(EntityDecoderState3) {
    EntityDecoderState3[EntityDecoderState3["EntityStart"] = 0] = "EntityStart";
    EntityDecoderState3[EntityDecoderState3["NumericStart"] = 1] = "NumericStart";
    EntityDecoderState3[EntityDecoderState3["NumericDecimal"] = 2] = "NumericDecimal";
    EntityDecoderState3[EntityDecoderState3["NumericHex"] = 3] = "NumericHex";
    EntityDecoderState3[EntityDecoderState3["NamedEntity"] = 4] = "NamedEntity";
  })(EntityDecoderState || (EntityDecoderState = {}));
  var DecodingMode;
  (function(DecodingMode3) {
    DecodingMode3[DecodingMode3["Legacy"] = 0] = "Legacy";
    DecodingMode3[DecodingMode3["Strict"] = 1] = "Strict";
    DecodingMode3[DecodingMode3["Attribute"] = 2] = "Attribute";
  })(DecodingMode || (DecodingMode = {}));
  var EntityDecoder = class {
    constructor(decodeTree, emitCodePoint, errors) {
      this.decodeTree = decodeTree;
      this.emitCodePoint = emitCodePoint;
      this.errors = errors;
      this.state = EntityDecoderState.EntityStart;
      this.consumed = 1;
      this.result = 0;
      this.treeIndex = 0;
      this.excess = 1;
      this.decodeMode = DecodingMode.Strict;
      this.runConsumed = 0;
    }
    /** Resets the instance to make it reusable. */
    startEntity(decodeMode) {
      this.decodeMode = decodeMode;
      this.state = EntityDecoderState.EntityStart;
      this.result = 0;
      this.treeIndex = 0;
      this.excess = 1;
      this.consumed = 1;
      this.runConsumed = 0;
    }
    /**
     * Write an entity to the decoder. This can be called multiple times with partial entities.
     * If the entity is incomplete, the decoder will return -1.
     *
     * Mirrors the implementation of `getDecoder`, but with the ability to stop decoding if the
     * entity is incomplete, and resume when the next string is written.
     *
     * @param input The string containing the entity (or a continuation of the entity).
     * @param offset The offset at which the entity begins. Should be 0 if this is not the first call.
     * @returns The number of characters that were consumed, or -1 if the entity is incomplete.
     */
    write(input, offset) {
      switch (this.state) {
        case EntityDecoderState.EntityStart: {
          if (input.charCodeAt(offset) === CharCodes.NUM) {
            this.state = EntityDecoderState.NumericStart;
            this.consumed += 1;
            return this.stateNumericStart(input, offset + 1);
          }
          this.state = EntityDecoderState.NamedEntity;
          return this.stateNamedEntity(input, offset);
        }
        case EntityDecoderState.NumericStart: {
          return this.stateNumericStart(input, offset);
        }
        case EntityDecoderState.NumericDecimal: {
          return this.stateNumericDecimal(input, offset);
        }
        case EntityDecoderState.NumericHex: {
          return this.stateNumericHex(input, offset);
        }
        case EntityDecoderState.NamedEntity: {
          return this.stateNamedEntity(input, offset);
        }
      }
    }
    /**
     * Switches between the numeric decimal and hexadecimal states.
     *
     * Equivalent to the `Numeric character reference state` in the HTML spec.
     *
     * @param input The string containing the entity (or a continuation of the entity).
     * @param offset The current offset.
     * @returns The number of characters that were consumed, or -1 if the entity is incomplete.
     */
    stateNumericStart(input, offset) {
      if (offset >= input.length) {
        return -1;
      }
      if ((input.charCodeAt(offset) | TO_LOWER_BIT) === CharCodes.LOWER_X) {
        this.state = EntityDecoderState.NumericHex;
        this.consumed += 1;
        return this.stateNumericHex(input, offset + 1);
      }
      this.state = EntityDecoderState.NumericDecimal;
      return this.stateNumericDecimal(input, offset);
    }
    /**
     * Parses a hexadecimal numeric entity.
     *
     * Equivalent to the `Hexademical character reference state` in the HTML spec.
     *
     * @param input The string containing the entity (or a continuation of the entity).
     * @param offset The current offset.
     * @returns The number of characters that were consumed, or -1 if the entity is incomplete.
     */
    stateNumericHex(input, offset) {
      while (offset < input.length) {
        const char = input.charCodeAt(offset);
        if (isNumber(char) || isHexadecimalCharacter(char)) {
          const digit = char <= CharCodes.NINE ? char - CharCodes.ZERO : (char | TO_LOWER_BIT) - CharCodes.LOWER_A + 10;
          this.result = this.result * 16 + digit;
          this.consumed++;
          offset++;
        } else {
          return this.emitNumericEntity(char, 3);
        }
      }
      return -1;
    }
    /**
     * Parses a decimal numeric entity.
     *
     * Equivalent to the `Decimal character reference state` in the HTML spec.
     *
     * @param input The string containing the entity (or a continuation of the entity).
     * @param offset The current offset.
     * @returns The number of characters that were consumed, or -1 if the entity is incomplete.
     */
    stateNumericDecimal(input, offset) {
      while (offset < input.length) {
        const char = input.charCodeAt(offset);
        if (isNumber(char)) {
          this.result = this.result * 10 + (char - CharCodes.ZERO);
          this.consumed++;
          offset++;
        } else {
          return this.emitNumericEntity(char, 2);
        }
      }
      return -1;
    }
    /**
     * Validate and emit a numeric entity.
     *
     * Implements the logic from the `Hexademical character reference start
     * state` and `Numeric character reference end state` in the HTML spec.
     *
     * @param lastCp The last code point of the entity. Used to see if the
     *               entity was terminated with a semicolon.
     * @param expectedLength The minimum number of characters that should be
     *                       consumed. Used to validate that at least one digit
     *                       was consumed.
     * @returns The number of characters that were consumed.
     */
    emitNumericEntity(lastCp, expectedLength) {
      var _a3;
      if (this.consumed <= expectedLength) {
        (_a3 = this.errors) === null || _a3 === void 0 ? void 0 : _a3.absenceOfDigitsInNumericCharacterReference(this.consumed);
        return 0;
      }
      if (lastCp === CharCodes.SEMI) {
        this.consumed += 1;
      } else if (this.decodeMode === DecodingMode.Strict) {
        return 0;
      }
      this.emitCodePoint(replaceCodePoint(this.result), this.consumed);
      if (this.errors) {
        if (lastCp !== CharCodes.SEMI) {
          this.errors.missingSemicolonAfterCharacterReference();
        }
        this.errors.validateNumericCharacterReference(this.result);
      }
      return this.consumed;
    }
    /**
     * Parses a named entity.
     *
     * Equivalent to the `Named character reference state` in the HTML spec.
     *
     * @param input The string containing the entity (or a continuation of the entity).
     * @param offset The current offset.
     * @returns The number of characters that were consumed, or -1 if the entity is incomplete.
     */
    stateNamedEntity(input, offset) {
      const { decodeTree } = this;
      let current = decodeTree[this.treeIndex];
      let valueLength = (current & BinTrieFlags.VALUE_LENGTH) >> 14;
      while (offset < input.length) {
        if (valueLength === 0 && (current & BinTrieFlags.FLAG13) !== 0) {
          const runLength = (current & BinTrieFlags.BRANCH_LENGTH) >> 7;
          if (this.runConsumed === 0) {
            const firstChar = current & BinTrieFlags.JUMP_TABLE;
            if (input.charCodeAt(offset) !== firstChar) {
              return this.result === 0 ? 0 : this.emitNotTerminatedNamedEntity();
            }
            offset++;
            this.excess++;
            this.runConsumed++;
          }
          while (this.runConsumed < runLength) {
            if (offset >= input.length) {
              return -1;
            }
            const charIndexInPacked = this.runConsumed - 1;
            const packedWord = decodeTree[this.treeIndex + 1 + (charIndexInPacked >> 1)];
            const expectedChar = charIndexInPacked % 2 === 0 ? packedWord & 255 : packedWord >> 8 & 255;
            if (input.charCodeAt(offset) !== expectedChar) {
              this.runConsumed = 0;
              return this.result === 0 ? 0 : this.emitNotTerminatedNamedEntity();
            }
            offset++;
            this.excess++;
            this.runConsumed++;
          }
          this.runConsumed = 0;
          this.treeIndex += 1 + (runLength >> 1);
          current = decodeTree[this.treeIndex];
          valueLength = (current & BinTrieFlags.VALUE_LENGTH) >> 14;
        }
        if (offset >= input.length)
          break;
        const char = input.charCodeAt(offset);
        if (char === CharCodes.SEMI && valueLength !== 0 && (current & BinTrieFlags.FLAG13) !== 0) {
          return this.emitNamedEntityData(this.treeIndex, valueLength, this.consumed + this.excess);
        }
        this.treeIndex = determineBranch(decodeTree, current, this.treeIndex + Math.max(1, valueLength), char);
        if (this.treeIndex < 0) {
          return this.result === 0 || // If we are parsing an attribute
          this.decodeMode === DecodingMode.Attribute && // We shouldn't have consumed any characters after the entity,
          (valueLength === 0 || // And there should be no invalid characters.
          isEntityInAttributeInvalidEnd(char)) ? 0 : this.emitNotTerminatedNamedEntity();
        }
        current = decodeTree[this.treeIndex];
        valueLength = (current & BinTrieFlags.VALUE_LENGTH) >> 14;
        if (valueLength !== 0) {
          if (char === CharCodes.SEMI) {
            return this.emitNamedEntityData(this.treeIndex, valueLength, this.consumed + this.excess);
          }
          if (this.decodeMode !== DecodingMode.Strict && (current & BinTrieFlags.FLAG13) === 0) {
            this.result = this.treeIndex;
            this.consumed += this.excess;
            this.excess = 0;
          }
        }
        offset++;
        this.excess++;
      }
      return -1;
    }
    /**
     * Emit a named entity that was not terminated with a semicolon.
     *
     * @returns The number of characters consumed.
     */
    emitNotTerminatedNamedEntity() {
      var _a3;
      const { result, decodeTree } = this;
      const valueLength = (decodeTree[result] & BinTrieFlags.VALUE_LENGTH) >> 14;
      this.emitNamedEntityData(result, valueLength, this.consumed);
      (_a3 = this.errors) === null || _a3 === void 0 ? void 0 : _a3.missingSemicolonAfterCharacterReference();
      return this.consumed;
    }
    /**
     * Emit a named entity.
     *
     * @param result The index of the entity in the decode tree.
     * @param valueLength The number of bytes in the entity.
     * @param consumed The number of characters consumed.
     *
     * @returns The number of characters consumed.
     */
    emitNamedEntityData(result, valueLength, consumed) {
      const { decodeTree } = this;
      this.emitCodePoint(valueLength === 1 ? decodeTree[result] & ~(BinTrieFlags.VALUE_LENGTH | BinTrieFlags.FLAG13) : decodeTree[result + 1], consumed);
      if (valueLength === 3) {
        this.emitCodePoint(decodeTree[result + 2], consumed);
      }
      return consumed;
    }
    /**
     * Signal to the parser that the end of the input was reached.
     *
     * Remaining data will be emitted and relevant errors will be produced.
     *
     * @returns The number of characters consumed.
     */
    end() {
      var _a3;
      switch (this.state) {
        case EntityDecoderState.NamedEntity: {
          return this.result !== 0 && (this.decodeMode !== DecodingMode.Attribute || this.result === this.treeIndex) ? this.emitNotTerminatedNamedEntity() : 0;
        }
        // Otherwise, emit a numeric entity if we have one.
        case EntityDecoderState.NumericDecimal: {
          return this.emitNumericEntity(0, 2);
        }
        case EntityDecoderState.NumericHex: {
          return this.emitNumericEntity(0, 3);
        }
        case EntityDecoderState.NumericStart: {
          (_a3 = this.errors) === null || _a3 === void 0 ? void 0 : _a3.absenceOfDigitsInNumericCharacterReference(this.consumed);
          return 0;
        }
        case EntityDecoderState.EntityStart: {
          return 0;
        }
      }
    }
  };
  function determineBranch(decodeTree, current, nodeIndex, char) {
    const branchCount = (current & BinTrieFlags.BRANCH_LENGTH) >> 7;
    const jumpOffset = current & BinTrieFlags.JUMP_TABLE;
    if (branchCount === 0) {
      return jumpOffset !== 0 && char === jumpOffset ? nodeIndex : -1;
    }
    if (jumpOffset) {
      const value = char - jumpOffset;
      return value < 0 || value >= branchCount ? -1 : decodeTree[nodeIndex + value] - 1;
    }
    const packedKeySlots = branchCount + 1 >> 1;
    let lo = 0;
    let hi = branchCount - 1;
    while (lo <= hi) {
      const mid = lo + hi >>> 1;
      const slot = mid >> 1;
      const packed = decodeTree[nodeIndex + slot];
      const midKey = packed >> (mid & 1) * 8 & 255;
      if (midKey < char) {
        lo = mid + 1;
      } else if (midKey > char) {
        hi = mid - 1;
      } else {
        return decodeTree[nodeIndex + packedKeySlots + mid];
      }
    }
    return -1;
  }

  // ../node_modules/.pnpm/htmlparser2@10.1.0/node_modules/htmlparser2/dist/esm/Tokenizer.js
  var CharCodes2;
  (function(CharCodes4) {
    CharCodes4[CharCodes4["Tab"] = 9] = "Tab";
    CharCodes4[CharCodes4["NewLine"] = 10] = "NewLine";
    CharCodes4[CharCodes4["FormFeed"] = 12] = "FormFeed";
    CharCodes4[CharCodes4["CarriageReturn"] = 13] = "CarriageReturn";
    CharCodes4[CharCodes4["Space"] = 32] = "Space";
    CharCodes4[CharCodes4["ExclamationMark"] = 33] = "ExclamationMark";
    CharCodes4[CharCodes4["Number"] = 35] = "Number";
    CharCodes4[CharCodes4["Amp"] = 38] = "Amp";
    CharCodes4[CharCodes4["SingleQuote"] = 39] = "SingleQuote";
    CharCodes4[CharCodes4["DoubleQuote"] = 34] = "DoubleQuote";
    CharCodes4[CharCodes4["Dash"] = 45] = "Dash";
    CharCodes4[CharCodes4["Slash"] = 47] = "Slash";
    CharCodes4[CharCodes4["Zero"] = 48] = "Zero";
    CharCodes4[CharCodes4["Nine"] = 57] = "Nine";
    CharCodes4[CharCodes4["Semi"] = 59] = "Semi";
    CharCodes4[CharCodes4["Lt"] = 60] = "Lt";
    CharCodes4[CharCodes4["Eq"] = 61] = "Eq";
    CharCodes4[CharCodes4["Gt"] = 62] = "Gt";
    CharCodes4[CharCodes4["Questionmark"] = 63] = "Questionmark";
    CharCodes4[CharCodes4["UpperA"] = 65] = "UpperA";
    CharCodes4[CharCodes4["LowerA"] = 97] = "LowerA";
    CharCodes4[CharCodes4["UpperF"] = 70] = "UpperF";
    CharCodes4[CharCodes4["LowerF"] = 102] = "LowerF";
    CharCodes4[CharCodes4["UpperZ"] = 90] = "UpperZ";
    CharCodes4[CharCodes4["LowerZ"] = 122] = "LowerZ";
    CharCodes4[CharCodes4["LowerX"] = 120] = "LowerX";
    CharCodes4[CharCodes4["OpeningSquareBracket"] = 91] = "OpeningSquareBracket";
  })(CharCodes2 || (CharCodes2 = {}));
  var State;
  (function(State2) {
    State2[State2["Text"] = 1] = "Text";
    State2[State2["BeforeTagName"] = 2] = "BeforeTagName";
    State2[State2["InTagName"] = 3] = "InTagName";
    State2[State2["InSelfClosingTag"] = 4] = "InSelfClosingTag";
    State2[State2["BeforeClosingTagName"] = 5] = "BeforeClosingTagName";
    State2[State2["InClosingTagName"] = 6] = "InClosingTagName";
    State2[State2["AfterClosingTagName"] = 7] = "AfterClosingTagName";
    State2[State2["BeforeAttributeName"] = 8] = "BeforeAttributeName";
    State2[State2["InAttributeName"] = 9] = "InAttributeName";
    State2[State2["AfterAttributeName"] = 10] = "AfterAttributeName";
    State2[State2["BeforeAttributeValue"] = 11] = "BeforeAttributeValue";
    State2[State2["InAttributeValueDq"] = 12] = "InAttributeValueDq";
    State2[State2["InAttributeValueSq"] = 13] = "InAttributeValueSq";
    State2[State2["InAttributeValueNq"] = 14] = "InAttributeValueNq";
    State2[State2["BeforeDeclaration"] = 15] = "BeforeDeclaration";
    State2[State2["InDeclaration"] = 16] = "InDeclaration";
    State2[State2["InProcessingInstruction"] = 17] = "InProcessingInstruction";
    State2[State2["BeforeComment"] = 18] = "BeforeComment";
    State2[State2["CDATASequence"] = 19] = "CDATASequence";
    State2[State2["InSpecialComment"] = 20] = "InSpecialComment";
    State2[State2["InCommentLike"] = 21] = "InCommentLike";
    State2[State2["BeforeSpecialS"] = 22] = "BeforeSpecialS";
    State2[State2["BeforeSpecialT"] = 23] = "BeforeSpecialT";
    State2[State2["SpecialStartSequence"] = 24] = "SpecialStartSequence";
    State2[State2["InSpecialTag"] = 25] = "InSpecialTag";
    State2[State2["InEntity"] = 26] = "InEntity";
  })(State || (State = {}));
  function isWhitespace(c) {
    return c === CharCodes2.Space || c === CharCodes2.NewLine || c === CharCodes2.Tab || c === CharCodes2.FormFeed || c === CharCodes2.CarriageReturn;
  }
  function isEndOfTagSection(c) {
    return c === CharCodes2.Slash || c === CharCodes2.Gt || isWhitespace(c);
  }
  function isASCIIAlpha(c) {
    return c >= CharCodes2.LowerA && c <= CharCodes2.LowerZ || c >= CharCodes2.UpperA && c <= CharCodes2.UpperZ;
  }
  var QuoteType;
  (function(QuoteType2) {
    QuoteType2[QuoteType2["NoValue"] = 0] = "NoValue";
    QuoteType2[QuoteType2["Unquoted"] = 1] = "Unquoted";
    QuoteType2[QuoteType2["Single"] = 2] = "Single";
    QuoteType2[QuoteType2["Double"] = 3] = "Double";
  })(QuoteType || (QuoteType = {}));
  var Sequences = {
    Cdata: new Uint8Array([67, 68, 65, 84, 65, 91]),
    // CDATA[
    CdataEnd: new Uint8Array([93, 93, 62]),
    // ]]>
    CommentEnd: new Uint8Array([45, 45, 62]),
    // `-->`
    ScriptEnd: new Uint8Array([60, 47, 115, 99, 114, 105, 112, 116]),
    // `</script`
    StyleEnd: new Uint8Array([60, 47, 115, 116, 121, 108, 101]),
    // `</style`
    TitleEnd: new Uint8Array([60, 47, 116, 105, 116, 108, 101]),
    // `</title`
    TextareaEnd: new Uint8Array([
      60,
      47,
      116,
      101,
      120,
      116,
      97,
      114,
      101,
      97
    ]),
    // `</textarea`
    XmpEnd: new Uint8Array([60, 47, 120, 109, 112])
    // `</xmp`
  };
  var Tokenizer = class {
    constructor({ xmlMode = false, decodeEntities = true }, cbs) {
      this.cbs = cbs;
      this.state = State.Text;
      this.buffer = "";
      this.sectionStart = 0;
      this.index = 0;
      this.entityStart = 0;
      this.baseState = State.Text;
      this.isSpecial = false;
      this.running = true;
      this.offset = 0;
      this.currentSequence = void 0;
      this.sequenceIndex = 0;
      this.xmlMode = xmlMode;
      this.decodeEntities = decodeEntities;
      this.entityDecoder = new EntityDecoder(xmlMode ? xmlDecodeTree : htmlDecodeTree, (cp, consumed) => this.emitCodePoint(cp, consumed));
    }
    reset() {
      this.state = State.Text;
      this.buffer = "";
      this.sectionStart = 0;
      this.index = 0;
      this.baseState = State.Text;
      this.currentSequence = void 0;
      this.running = true;
      this.offset = 0;
    }
    write(chunk) {
      this.offset += this.buffer.length;
      this.buffer = chunk;
      this.parse();
    }
    end() {
      if (this.running)
        this.finish();
    }
    pause() {
      this.running = false;
    }
    resume() {
      this.running = true;
      if (this.index < this.buffer.length + this.offset) {
        this.parse();
      }
    }
    stateText(c) {
      if (c === CharCodes2.Lt || !this.decodeEntities && this.fastForwardTo(CharCodes2.Lt)) {
        if (this.index > this.sectionStart) {
          this.cbs.ontext(this.sectionStart, this.index);
        }
        this.state = State.BeforeTagName;
        this.sectionStart = this.index;
      } else if (this.decodeEntities && c === CharCodes2.Amp) {
        this.startEntity();
      }
    }
    stateSpecialStartSequence(c) {
      const isEnd = this.sequenceIndex === this.currentSequence.length;
      const isMatch = isEnd ? (
        // If we are at the end of the sequence, make sure the tag name has ended
        isEndOfTagSection(c)
      ) : (
        // Otherwise, do a case-insensitive comparison
        (c | 32) === this.currentSequence[this.sequenceIndex]
      );
      if (!isMatch) {
        this.isSpecial = false;
      } else if (!isEnd) {
        this.sequenceIndex++;
        return;
      }
      this.sequenceIndex = 0;
      this.state = State.InTagName;
      this.stateInTagName(c);
    }
    /** Look for an end tag. For <title> tags, also decode entities. */
    stateInSpecialTag(c) {
      if (this.sequenceIndex === this.currentSequence.length) {
        if (c === CharCodes2.Gt || isWhitespace(c)) {
          const endOfText = this.index - this.currentSequence.length;
          if (this.sectionStart < endOfText) {
            const actualIndex = this.index;
            this.index = endOfText;
            this.cbs.ontext(this.sectionStart, endOfText);
            this.index = actualIndex;
          }
          this.isSpecial = false;
          this.sectionStart = endOfText + 2;
          this.stateInClosingTagName(c);
          return;
        }
        this.sequenceIndex = 0;
      }
      if ((c | 32) === this.currentSequence[this.sequenceIndex]) {
        this.sequenceIndex += 1;
      } else if (this.sequenceIndex === 0) {
        if (this.currentSequence === Sequences.TitleEnd) {
          if (this.decodeEntities && c === CharCodes2.Amp) {
            this.startEntity();
          }
        } else if (this.fastForwardTo(CharCodes2.Lt)) {
          this.sequenceIndex = 1;
        }
      } else {
        this.sequenceIndex = Number(c === CharCodes2.Lt);
      }
    }
    stateCDATASequence(c) {
      if (c === Sequences.Cdata[this.sequenceIndex]) {
        if (++this.sequenceIndex === Sequences.Cdata.length) {
          this.state = State.InCommentLike;
          this.currentSequence = Sequences.CdataEnd;
          this.sequenceIndex = 0;
          this.sectionStart = this.index + 1;
        }
      } else {
        this.sequenceIndex = 0;
        this.state = State.InDeclaration;
        this.stateInDeclaration(c);
      }
    }
    /**
     * When we wait for one specific character, we can speed things up
     * by skipping through the buffer until we find it.
     *
     * @returns Whether the character was found.
     */
    fastForwardTo(c) {
      while (++this.index < this.buffer.length + this.offset) {
        if (this.buffer.charCodeAt(this.index - this.offset) === c) {
          return true;
        }
      }
      this.index = this.buffer.length + this.offset - 1;
      return false;
    }
    /**
     * Comments and CDATA end with `-->` and `]]>`.
     *
     * Their common qualities are:
     * - Their end sequences have a distinct character they start with.
     * - That character is then repeated, so we have to check multiple repeats.
     * - All characters but the start character of the sequence can be skipped.
     */
    stateInCommentLike(c) {
      if (c === this.currentSequence[this.sequenceIndex]) {
        if (++this.sequenceIndex === this.currentSequence.length) {
          if (this.currentSequence === Sequences.CdataEnd) {
            this.cbs.oncdata(this.sectionStart, this.index, 2);
          } else {
            this.cbs.oncomment(this.sectionStart, this.index, 2);
          }
          this.sequenceIndex = 0;
          this.sectionStart = this.index + 1;
          this.state = State.Text;
        }
      } else if (this.sequenceIndex === 0) {
        if (this.fastForwardTo(this.currentSequence[0])) {
          this.sequenceIndex = 1;
        }
      } else if (c !== this.currentSequence[this.sequenceIndex - 1]) {
        this.sequenceIndex = 0;
      }
    }
    /**
     * HTML only allows ASCII alpha characters (a-z and A-Z) at the beginning of a tag name.
     *
     * XML allows a lot more characters here (@see https://www.w3.org/TR/REC-xml/#NT-NameStartChar).
     * We allow anything that wouldn't end the tag.
     */
    isTagStartChar(c) {
      return this.xmlMode ? !isEndOfTagSection(c) : isASCIIAlpha(c);
    }
    startSpecial(sequence, offset) {
      this.isSpecial = true;
      this.currentSequence = sequence;
      this.sequenceIndex = offset;
      this.state = State.SpecialStartSequence;
    }
    stateBeforeTagName(c) {
      if (c === CharCodes2.ExclamationMark) {
        this.state = State.BeforeDeclaration;
        this.sectionStart = this.index + 1;
      } else if (c === CharCodes2.Questionmark) {
        this.state = State.InProcessingInstruction;
        this.sectionStart = this.index + 1;
      } else if (this.isTagStartChar(c)) {
        const lower = c | 32;
        this.sectionStart = this.index;
        if (this.xmlMode) {
          this.state = State.InTagName;
        } else if (lower === Sequences.ScriptEnd[2]) {
          this.state = State.BeforeSpecialS;
        } else if (lower === Sequences.TitleEnd[2] || lower === Sequences.XmpEnd[2]) {
          this.state = State.BeforeSpecialT;
        } else {
          this.state = State.InTagName;
        }
      } else if (c === CharCodes2.Slash) {
        this.state = State.BeforeClosingTagName;
      } else {
        this.state = State.Text;
        this.stateText(c);
      }
    }
    stateInTagName(c) {
      if (isEndOfTagSection(c)) {
        this.cbs.onopentagname(this.sectionStart, this.index);
        this.sectionStart = -1;
        this.state = State.BeforeAttributeName;
        this.stateBeforeAttributeName(c);
      }
    }
    stateBeforeClosingTagName(c) {
      if (isWhitespace(c)) {
      } else if (c === CharCodes2.Gt) {
        this.state = State.Text;
      } else {
        this.state = this.isTagStartChar(c) ? State.InClosingTagName : State.InSpecialComment;
        this.sectionStart = this.index;
      }
    }
    stateInClosingTagName(c) {
      if (c === CharCodes2.Gt || isWhitespace(c)) {
        this.cbs.onclosetag(this.sectionStart, this.index);
        this.sectionStart = -1;
        this.state = State.AfterClosingTagName;
        this.stateAfterClosingTagName(c);
      }
    }
    stateAfterClosingTagName(c) {
      if (c === CharCodes2.Gt || this.fastForwardTo(CharCodes2.Gt)) {
        this.state = State.Text;
        this.sectionStart = this.index + 1;
      }
    }
    stateBeforeAttributeName(c) {
      if (c === CharCodes2.Gt) {
        this.cbs.onopentagend(this.index);
        if (this.isSpecial) {
          this.state = State.InSpecialTag;
          this.sequenceIndex = 0;
        } else {
          this.state = State.Text;
        }
        this.sectionStart = this.index + 1;
      } else if (c === CharCodes2.Slash) {
        this.state = State.InSelfClosingTag;
      } else if (!isWhitespace(c)) {
        this.state = State.InAttributeName;
        this.sectionStart = this.index;
      }
    }
    stateInSelfClosingTag(c) {
      if (c === CharCodes2.Gt) {
        this.cbs.onselfclosingtag(this.index);
        this.state = State.Text;
        this.sectionStart = this.index + 1;
        this.isSpecial = false;
      } else if (!isWhitespace(c)) {
        this.state = State.BeforeAttributeName;
        this.stateBeforeAttributeName(c);
      }
    }
    stateInAttributeName(c) {
      if (c === CharCodes2.Eq || isEndOfTagSection(c)) {
        this.cbs.onattribname(this.sectionStart, this.index);
        this.sectionStart = this.index;
        this.state = State.AfterAttributeName;
        this.stateAfterAttributeName(c);
      }
    }
    stateAfterAttributeName(c) {
      if (c === CharCodes2.Eq) {
        this.state = State.BeforeAttributeValue;
      } else if (c === CharCodes2.Slash || c === CharCodes2.Gt) {
        this.cbs.onattribend(QuoteType.NoValue, this.sectionStart);
        this.sectionStart = -1;
        this.state = State.BeforeAttributeName;
        this.stateBeforeAttributeName(c);
      } else if (!isWhitespace(c)) {
        this.cbs.onattribend(QuoteType.NoValue, this.sectionStart);
        this.state = State.InAttributeName;
        this.sectionStart = this.index;
      }
    }
    stateBeforeAttributeValue(c) {
      if (c === CharCodes2.DoubleQuote) {
        this.state = State.InAttributeValueDq;
        this.sectionStart = this.index + 1;
      } else if (c === CharCodes2.SingleQuote) {
        this.state = State.InAttributeValueSq;
        this.sectionStart = this.index + 1;
      } else if (!isWhitespace(c)) {
        this.sectionStart = this.index;
        this.state = State.InAttributeValueNq;
        this.stateInAttributeValueNoQuotes(c);
      }
    }
    handleInAttributeValue(c, quote) {
      if (c === quote || !this.decodeEntities && this.fastForwardTo(quote)) {
        this.cbs.onattribdata(this.sectionStart, this.index);
        this.sectionStart = -1;
        this.cbs.onattribend(quote === CharCodes2.DoubleQuote ? QuoteType.Double : QuoteType.Single, this.index + 1);
        this.state = State.BeforeAttributeName;
      } else if (this.decodeEntities && c === CharCodes2.Amp) {
        this.startEntity();
      }
    }
    stateInAttributeValueDoubleQuotes(c) {
      this.handleInAttributeValue(c, CharCodes2.DoubleQuote);
    }
    stateInAttributeValueSingleQuotes(c) {
      this.handleInAttributeValue(c, CharCodes2.SingleQuote);
    }
    stateInAttributeValueNoQuotes(c) {
      if (isWhitespace(c) || c === CharCodes2.Gt) {
        this.cbs.onattribdata(this.sectionStart, this.index);
        this.sectionStart = -1;
        this.cbs.onattribend(QuoteType.Unquoted, this.index);
        this.state = State.BeforeAttributeName;
        this.stateBeforeAttributeName(c);
      } else if (this.decodeEntities && c === CharCodes2.Amp) {
        this.startEntity();
      }
    }
    stateBeforeDeclaration(c) {
      if (c === CharCodes2.OpeningSquareBracket) {
        this.state = State.CDATASequence;
        this.sequenceIndex = 0;
      } else {
        this.state = c === CharCodes2.Dash ? State.BeforeComment : State.InDeclaration;
      }
    }
    stateInDeclaration(c) {
      if (c === CharCodes2.Gt || this.fastForwardTo(CharCodes2.Gt)) {
        this.cbs.ondeclaration(this.sectionStart, this.index);
        this.state = State.Text;
        this.sectionStart = this.index + 1;
      }
    }
    stateInProcessingInstruction(c) {
      if (c === CharCodes2.Gt || this.fastForwardTo(CharCodes2.Gt)) {
        this.cbs.onprocessinginstruction(this.sectionStart, this.index);
        this.state = State.Text;
        this.sectionStart = this.index + 1;
      }
    }
    stateBeforeComment(c) {
      if (c === CharCodes2.Dash) {
        this.state = State.InCommentLike;
        this.currentSequence = Sequences.CommentEnd;
        this.sequenceIndex = 2;
        this.sectionStart = this.index + 1;
      } else {
        this.state = State.InDeclaration;
      }
    }
    stateInSpecialComment(c) {
      if (c === CharCodes2.Gt || this.fastForwardTo(CharCodes2.Gt)) {
        this.cbs.oncomment(this.sectionStart, this.index, 0);
        this.state = State.Text;
        this.sectionStart = this.index + 1;
      }
    }
    stateBeforeSpecialS(c) {
      const lower = c | 32;
      if (lower === Sequences.ScriptEnd[3]) {
        this.startSpecial(Sequences.ScriptEnd, 4);
      } else if (lower === Sequences.StyleEnd[3]) {
        this.startSpecial(Sequences.StyleEnd, 4);
      } else {
        this.state = State.InTagName;
        this.stateInTagName(c);
      }
    }
    stateBeforeSpecialT(c) {
      const lower = c | 32;
      switch (lower) {
        case Sequences.TitleEnd[3]: {
          this.startSpecial(Sequences.TitleEnd, 4);
          break;
        }
        case Sequences.TextareaEnd[3]: {
          this.startSpecial(Sequences.TextareaEnd, 4);
          break;
        }
        case Sequences.XmpEnd[3]: {
          this.startSpecial(Sequences.XmpEnd, 4);
          break;
        }
        default: {
          this.state = State.InTagName;
          this.stateInTagName(c);
        }
      }
    }
    startEntity() {
      this.baseState = this.state;
      this.state = State.InEntity;
      this.entityStart = this.index;
      this.entityDecoder.startEntity(this.xmlMode ? DecodingMode.Strict : this.baseState === State.Text || this.baseState === State.InSpecialTag ? DecodingMode.Legacy : DecodingMode.Attribute);
    }
    stateInEntity() {
      const indexInBuffer = this.index - this.offset;
      const length = this.entityDecoder.write(this.buffer, indexInBuffer);
      if (length >= 0) {
        this.state = this.baseState;
        if (length === 0) {
          this.index -= 1;
        }
      } else {
        if (indexInBuffer < this.buffer.length && this.buffer.charCodeAt(indexInBuffer) === CharCodes2.Amp) {
          this.state = this.baseState;
          this.index -= 1;
          return;
        }
        this.index = this.offset + this.buffer.length - 1;
      }
    }
    /**
     * Remove data that has already been consumed from the buffer.
     */
    cleanup() {
      if (this.running && this.sectionStart !== this.index) {
        if (this.state === State.Text || this.state === State.InSpecialTag && this.sequenceIndex === 0) {
          this.cbs.ontext(this.sectionStart, this.index);
          this.sectionStart = this.index;
        } else if (this.state === State.InAttributeValueDq || this.state === State.InAttributeValueSq || this.state === State.InAttributeValueNq) {
          this.cbs.onattribdata(this.sectionStart, this.index);
          this.sectionStart = this.index;
        }
      }
    }
    shouldContinue() {
      return this.index < this.buffer.length + this.offset && this.running;
    }
    /**
     * Iterates through the buffer, calling the function corresponding to the current state.
     *
     * States that are more likely to be hit are higher up, as a performance improvement.
     */
    parse() {
      while (this.shouldContinue()) {
        const c = this.buffer.charCodeAt(this.index - this.offset);
        switch (this.state) {
          case State.Text: {
            this.stateText(c);
            break;
          }
          case State.SpecialStartSequence: {
            this.stateSpecialStartSequence(c);
            break;
          }
          case State.InSpecialTag: {
            this.stateInSpecialTag(c);
            break;
          }
          case State.CDATASequence: {
            this.stateCDATASequence(c);
            break;
          }
          case State.InAttributeValueDq: {
            this.stateInAttributeValueDoubleQuotes(c);
            break;
          }
          case State.InAttributeName: {
            this.stateInAttributeName(c);
            break;
          }
          case State.InCommentLike: {
            this.stateInCommentLike(c);
            break;
          }
          case State.InSpecialComment: {
            this.stateInSpecialComment(c);
            break;
          }
          case State.BeforeAttributeName: {
            this.stateBeforeAttributeName(c);
            break;
          }
          case State.InTagName: {
            this.stateInTagName(c);
            break;
          }
          case State.InClosingTagName: {
            this.stateInClosingTagName(c);
            break;
          }
          case State.BeforeTagName: {
            this.stateBeforeTagName(c);
            break;
          }
          case State.AfterAttributeName: {
            this.stateAfterAttributeName(c);
            break;
          }
          case State.InAttributeValueSq: {
            this.stateInAttributeValueSingleQuotes(c);
            break;
          }
          case State.BeforeAttributeValue: {
            this.stateBeforeAttributeValue(c);
            break;
          }
          case State.BeforeClosingTagName: {
            this.stateBeforeClosingTagName(c);
            break;
          }
          case State.AfterClosingTagName: {
            this.stateAfterClosingTagName(c);
            break;
          }
          case State.BeforeSpecialS: {
            this.stateBeforeSpecialS(c);
            break;
          }
          case State.BeforeSpecialT: {
            this.stateBeforeSpecialT(c);
            break;
          }
          case State.InAttributeValueNq: {
            this.stateInAttributeValueNoQuotes(c);
            break;
          }
          case State.InSelfClosingTag: {
            this.stateInSelfClosingTag(c);
            break;
          }
          case State.InDeclaration: {
            this.stateInDeclaration(c);
            break;
          }
          case State.BeforeDeclaration: {
            this.stateBeforeDeclaration(c);
            break;
          }
          case State.BeforeComment: {
            this.stateBeforeComment(c);
            break;
          }
          case State.InProcessingInstruction: {
            this.stateInProcessingInstruction(c);
            break;
          }
          case State.InEntity: {
            this.stateInEntity();
            break;
          }
        }
        this.index++;
      }
      this.cleanup();
    }
    finish() {
      if (this.state === State.InEntity) {
        this.entityDecoder.end();
        this.state = this.baseState;
      }
      this.handleTrailingData();
      this.cbs.onend();
    }
    /** Handle any trailing data. */
    handleTrailingData() {
      const endIndex = this.buffer.length + this.offset;
      if (this.sectionStart >= endIndex) {
        return;
      }
      if (this.state === State.InCommentLike) {
        if (this.currentSequence === Sequences.CdataEnd) {
          this.cbs.oncdata(this.sectionStart, endIndex, 0);
        } else {
          this.cbs.oncomment(this.sectionStart, endIndex, 0);
        }
      } else if (this.state === State.InTagName || this.state === State.BeforeAttributeName || this.state === State.BeforeAttributeValue || this.state === State.AfterAttributeName || this.state === State.InAttributeName || this.state === State.InAttributeValueSq || this.state === State.InAttributeValueDq || this.state === State.InAttributeValueNq || this.state === State.InClosingTagName) {
      } else {
        this.cbs.ontext(this.sectionStart, endIndex);
      }
    }
    emitCodePoint(cp, consumed) {
      if (this.baseState !== State.Text && this.baseState !== State.InSpecialTag) {
        if (this.sectionStart < this.entityStart) {
          this.cbs.onattribdata(this.sectionStart, this.entityStart);
        }
        this.sectionStart = this.entityStart + consumed;
        this.index = this.sectionStart - 1;
        this.cbs.onattribentity(cp);
      } else {
        if (this.sectionStart < this.entityStart) {
          this.cbs.ontext(this.sectionStart, this.entityStart);
        }
        this.sectionStart = this.entityStart + consumed;
        this.index = this.sectionStart - 1;
        this.cbs.ontextentity(cp, this.sectionStart);
      }
    }
  };

  // ../node_modules/.pnpm/htmlparser2@10.1.0/node_modules/htmlparser2/dist/esm/Parser.js
  var formTags = /* @__PURE__ */ new Set([
    "input",
    "option",
    "optgroup",
    "select",
    "button",
    "datalist",
    "textarea"
  ]);
  var pTag = /* @__PURE__ */ new Set(["p"]);
  var tableSectionTags = /* @__PURE__ */ new Set(["thead", "tbody"]);
  var ddtTags = /* @__PURE__ */ new Set(["dd", "dt"]);
  var rtpTags = /* @__PURE__ */ new Set(["rt", "rp"]);
  var openImpliesClose = /* @__PURE__ */ new Map([
    ["tr", /* @__PURE__ */ new Set(["tr", "th", "td"])],
    ["th", /* @__PURE__ */ new Set(["th"])],
    ["td", /* @__PURE__ */ new Set(["thead", "th", "td"])],
    ["body", /* @__PURE__ */ new Set(["head", "link", "script"])],
    ["li", /* @__PURE__ */ new Set(["li"])],
    ["p", pTag],
    ["h1", pTag],
    ["h2", pTag],
    ["h3", pTag],
    ["h4", pTag],
    ["h5", pTag],
    ["h6", pTag],
    ["select", formTags],
    ["input", formTags],
    ["output", formTags],
    ["button", formTags],
    ["datalist", formTags],
    ["textarea", formTags],
    ["option", /* @__PURE__ */ new Set(["option"])],
    ["optgroup", /* @__PURE__ */ new Set(["optgroup", "option"])],
    ["dd", ddtTags],
    ["dt", ddtTags],
    ["address", pTag],
    ["article", pTag],
    ["aside", pTag],
    ["blockquote", pTag],
    ["details", pTag],
    ["div", pTag],
    ["dl", pTag],
    ["fieldset", pTag],
    ["figcaption", pTag],
    ["figure", pTag],
    ["footer", pTag],
    ["form", pTag],
    ["header", pTag],
    ["hr", pTag],
    ["main", pTag],
    ["nav", pTag],
    ["ol", pTag],
    ["pre", pTag],
    ["section", pTag],
    ["table", pTag],
    ["ul", pTag],
    ["rt", rtpTags],
    ["rp", rtpTags],
    ["tbody", tableSectionTags],
    ["tfoot", tableSectionTags]
  ]);
  var voidElements = /* @__PURE__ */ new Set([
    "area",
    "base",
    "basefont",
    "br",
    "col",
    "command",
    "embed",
    "frame",
    "hr",
    "img",
    "input",
    "isindex",
    "keygen",
    "link",
    "meta",
    "param",
    "source",
    "track",
    "wbr"
  ]);
  var foreignContextElements = /* @__PURE__ */ new Set(["math", "svg"]);
  var htmlIntegrationElements = /* @__PURE__ */ new Set([
    "mi",
    "mo",
    "mn",
    "ms",
    "mtext",
    "annotation-xml",
    "foreignobject",
    "desc",
    "title"
  ]);
  var reNameEnd = /\s|\//;
  var Parser = class {
    constructor(cbs, options = {}) {
      var _a3, _b, _c, _d, _e, _f;
      this.options = options;
      this.startIndex = 0;
      this.endIndex = 0;
      this.openTagStart = 0;
      this.tagname = "";
      this.attribname = "";
      this.attribvalue = "";
      this.attribs = null;
      this.stack = [];
      this.buffers = [];
      this.bufferOffset = 0;
      this.writeIndex = 0;
      this.ended = false;
      this.cbs = cbs !== null && cbs !== void 0 ? cbs : {};
      this.htmlMode = !this.options.xmlMode;
      this.lowerCaseTagNames = (_a3 = options.lowerCaseTags) !== null && _a3 !== void 0 ? _a3 : this.htmlMode;
      this.lowerCaseAttributeNames = (_b = options.lowerCaseAttributeNames) !== null && _b !== void 0 ? _b : this.htmlMode;
      this.recognizeSelfClosing = (_c = options.recognizeSelfClosing) !== null && _c !== void 0 ? _c : !this.htmlMode;
      this.tokenizer = new ((_d = options.Tokenizer) !== null && _d !== void 0 ? _d : Tokenizer)(this.options, this);
      this.foreignContext = [!this.htmlMode];
      (_f = (_e = this.cbs).onparserinit) === null || _f === void 0 ? void 0 : _f.call(_e, this);
    }
    // Tokenizer event handlers
    /** @internal */
    ontext(start, endIndex) {
      var _a3, _b;
      const data = this.getSlice(start, endIndex);
      this.endIndex = endIndex - 1;
      (_b = (_a3 = this.cbs).ontext) === null || _b === void 0 ? void 0 : _b.call(_a3, data);
      this.startIndex = endIndex;
    }
    /** @internal */
    ontextentity(cp, endIndex) {
      var _a3, _b;
      this.endIndex = endIndex - 1;
      (_b = (_a3 = this.cbs).ontext) === null || _b === void 0 ? void 0 : _b.call(_a3, fromCodePoint(cp));
      this.startIndex = endIndex;
    }
    /**
     * Checks if the current tag is a void element. Override this if you want
     * to specify your own additional void elements.
     */
    isVoidElement(name) {
      return this.htmlMode && voidElements.has(name);
    }
    /** @internal */
    onopentagname(start, endIndex) {
      this.endIndex = endIndex;
      let name = this.getSlice(start, endIndex);
      if (this.lowerCaseTagNames) {
        name = name.toLowerCase();
      }
      this.emitOpenTag(name);
    }
    emitOpenTag(name) {
      var _a3, _b, _c, _d;
      this.openTagStart = this.startIndex;
      this.tagname = name;
      const impliesClose = this.htmlMode && openImpliesClose.get(name);
      if (impliesClose) {
        while (this.stack.length > 0 && impliesClose.has(this.stack[0])) {
          const element = this.stack.shift();
          (_b = (_a3 = this.cbs).onclosetag) === null || _b === void 0 ? void 0 : _b.call(_a3, element, true);
        }
      }
      if (!this.isVoidElement(name)) {
        this.stack.unshift(name);
        if (this.htmlMode) {
          if (foreignContextElements.has(name)) {
            this.foreignContext.unshift(true);
          } else if (htmlIntegrationElements.has(name)) {
            this.foreignContext.unshift(false);
          }
        }
      }
      (_d = (_c = this.cbs).onopentagname) === null || _d === void 0 ? void 0 : _d.call(_c, name);
      if (this.cbs.onopentag)
        this.attribs = {};
    }
    endOpenTag(isImplied) {
      var _a3, _b;
      this.startIndex = this.openTagStart;
      if (this.attribs) {
        (_b = (_a3 = this.cbs).onopentag) === null || _b === void 0 ? void 0 : _b.call(_a3, this.tagname, this.attribs, isImplied);
        this.attribs = null;
      }
      if (this.cbs.onclosetag && this.isVoidElement(this.tagname)) {
        this.cbs.onclosetag(this.tagname, true);
      }
      this.tagname = "";
    }
    /** @internal */
    onopentagend(endIndex) {
      this.endIndex = endIndex;
      this.endOpenTag(false);
      this.startIndex = endIndex + 1;
    }
    /** @internal */
    onclosetag(start, endIndex) {
      var _a3, _b, _c, _d, _e, _f, _g, _h;
      this.endIndex = endIndex;
      let name = this.getSlice(start, endIndex);
      if (this.lowerCaseTagNames) {
        name = name.toLowerCase();
      }
      if (this.htmlMode && (foreignContextElements.has(name) || htmlIntegrationElements.has(name))) {
        this.foreignContext.shift();
      }
      if (!this.isVoidElement(name)) {
        const pos = this.stack.indexOf(name);
        if (pos !== -1) {
          for (let index = 0; index <= pos; index++) {
            const element = this.stack.shift();
            (_b = (_a3 = this.cbs).onclosetag) === null || _b === void 0 ? void 0 : _b.call(_a3, element, index !== pos);
          }
        } else if (this.htmlMode && name === "p") {
          this.emitOpenTag("p");
          this.closeCurrentTag(true);
        }
      } else if (this.htmlMode && name === "br") {
        (_d = (_c = this.cbs).onopentagname) === null || _d === void 0 ? void 0 : _d.call(_c, "br");
        (_f = (_e = this.cbs).onopentag) === null || _f === void 0 ? void 0 : _f.call(_e, "br", {}, true);
        (_h = (_g = this.cbs).onclosetag) === null || _h === void 0 ? void 0 : _h.call(_g, "br", false);
      }
      this.startIndex = endIndex + 1;
    }
    /** @internal */
    onselfclosingtag(endIndex) {
      this.endIndex = endIndex;
      if (this.recognizeSelfClosing || this.foreignContext[0]) {
        this.closeCurrentTag(false);
        this.startIndex = endIndex + 1;
      } else {
        this.onopentagend(endIndex);
      }
    }
    closeCurrentTag(isOpenImplied) {
      var _a3, _b;
      const name = this.tagname;
      this.endOpenTag(isOpenImplied);
      if (this.stack[0] === name) {
        (_b = (_a3 = this.cbs).onclosetag) === null || _b === void 0 ? void 0 : _b.call(_a3, name, !isOpenImplied);
        this.stack.shift();
      }
    }
    /** @internal */
    onattribname(start, endIndex) {
      this.startIndex = start;
      const name = this.getSlice(start, endIndex);
      this.attribname = this.lowerCaseAttributeNames ? name.toLowerCase() : name;
    }
    /** @internal */
    onattribdata(start, endIndex) {
      this.attribvalue += this.getSlice(start, endIndex);
    }
    /** @internal */
    onattribentity(cp) {
      this.attribvalue += fromCodePoint(cp);
    }
    /** @internal */
    onattribend(quote, endIndex) {
      var _a3, _b;
      this.endIndex = endIndex;
      (_b = (_a3 = this.cbs).onattribute) === null || _b === void 0 ? void 0 : _b.call(_a3, this.attribname, this.attribvalue, quote === QuoteType.Double ? '"' : quote === QuoteType.Single ? "'" : quote === QuoteType.NoValue ? void 0 : null);
      if (this.attribs && !Object.prototype.hasOwnProperty.call(this.attribs, this.attribname)) {
        this.attribs[this.attribname] = this.attribvalue;
      }
      this.attribvalue = "";
    }
    getInstructionName(value) {
      const index = value.search(reNameEnd);
      let name = index < 0 ? value : value.substr(0, index);
      if (this.lowerCaseTagNames) {
        name = name.toLowerCase();
      }
      return name;
    }
    /** @internal */
    ondeclaration(start, endIndex) {
      this.endIndex = endIndex;
      const value = this.getSlice(start, endIndex);
      if (this.cbs.onprocessinginstruction) {
        const name = this.getInstructionName(value);
        this.cbs.onprocessinginstruction(`!${name}`, `!${value}`);
      }
      this.startIndex = endIndex + 1;
    }
    /** @internal */
    onprocessinginstruction(start, endIndex) {
      this.endIndex = endIndex;
      const value = this.getSlice(start, endIndex);
      if (this.cbs.onprocessinginstruction) {
        const name = this.getInstructionName(value);
        this.cbs.onprocessinginstruction(`?${name}`, `?${value}`);
      }
      this.startIndex = endIndex + 1;
    }
    /** @internal */
    oncomment(start, endIndex, offset) {
      var _a3, _b, _c, _d;
      this.endIndex = endIndex;
      (_b = (_a3 = this.cbs).oncomment) === null || _b === void 0 ? void 0 : _b.call(_a3, this.getSlice(start, endIndex - offset));
      (_d = (_c = this.cbs).oncommentend) === null || _d === void 0 ? void 0 : _d.call(_c);
      this.startIndex = endIndex + 1;
    }
    /** @internal */
    oncdata(start, endIndex, offset) {
      var _a3, _b, _c, _d, _e, _f, _g, _h, _j, _k;
      this.endIndex = endIndex;
      const value = this.getSlice(start, endIndex - offset);
      if (!this.htmlMode || this.options.recognizeCDATA) {
        (_b = (_a3 = this.cbs).oncdatastart) === null || _b === void 0 ? void 0 : _b.call(_a3);
        (_d = (_c = this.cbs).ontext) === null || _d === void 0 ? void 0 : _d.call(_c, value);
        (_f = (_e = this.cbs).oncdataend) === null || _f === void 0 ? void 0 : _f.call(_e);
      } else {
        (_h = (_g = this.cbs).oncomment) === null || _h === void 0 ? void 0 : _h.call(_g, `[CDATA[${value}]]`);
        (_k = (_j = this.cbs).oncommentend) === null || _k === void 0 ? void 0 : _k.call(_j);
      }
      this.startIndex = endIndex + 1;
    }
    /** @internal */
    onend() {
      var _a3, _b;
      if (this.cbs.onclosetag) {
        this.endIndex = this.startIndex;
        for (let index = 0; index < this.stack.length; index++) {
          this.cbs.onclosetag(this.stack[index], true);
        }
      }
      (_b = (_a3 = this.cbs).onend) === null || _b === void 0 ? void 0 : _b.call(_a3);
    }
    /**
     * Resets the parser to a blank state, ready to parse a new HTML document
     */
    reset() {
      var _a3, _b, _c, _d;
      (_b = (_a3 = this.cbs).onreset) === null || _b === void 0 ? void 0 : _b.call(_a3);
      this.tokenizer.reset();
      this.tagname = "";
      this.attribname = "";
      this.attribs = null;
      this.stack.length = 0;
      this.startIndex = 0;
      this.endIndex = 0;
      (_d = (_c = this.cbs).onparserinit) === null || _d === void 0 ? void 0 : _d.call(_c, this);
      this.buffers.length = 0;
      this.foreignContext.length = 0;
      this.foreignContext.unshift(!this.htmlMode);
      this.bufferOffset = 0;
      this.writeIndex = 0;
      this.ended = false;
    }
    /**
     * Resets the parser, then parses a complete document and
     * pushes it to the handler.
     *
     * @param data Document to parse.
     */
    parseComplete(data) {
      this.reset();
      this.end(data);
    }
    getSlice(start, end) {
      while (start - this.bufferOffset >= this.buffers[0].length) {
        this.shiftBuffer();
      }
      let slice = this.buffers[0].slice(start - this.bufferOffset, end - this.bufferOffset);
      while (end - this.bufferOffset > this.buffers[0].length) {
        this.shiftBuffer();
        slice += this.buffers[0].slice(0, end - this.bufferOffset);
      }
      return slice;
    }
    shiftBuffer() {
      this.bufferOffset += this.buffers[0].length;
      this.writeIndex--;
      this.buffers.shift();
    }
    /**
     * Parses a chunk of data and calls the corresponding callbacks.
     *
     * @param chunk Chunk to parse.
     */
    write(chunk) {
      var _a3, _b;
      if (this.ended) {
        (_b = (_a3 = this.cbs).onerror) === null || _b === void 0 ? void 0 : _b.call(_a3, new Error(".write() after done!"));
        return;
      }
      this.buffers.push(chunk);
      if (this.tokenizer.running) {
        this.tokenizer.write(chunk);
        this.writeIndex++;
      }
    }
    /**
     * Parses the end of the buffer and clears the stack, calls onend.
     *
     * @param chunk Optional final chunk to parse.
     */
    end(chunk) {
      var _a3, _b;
      if (this.ended) {
        (_b = (_a3 = this.cbs).onerror) === null || _b === void 0 ? void 0 : _b.call(_a3, new Error(".end() after done!"));
        return;
      }
      if (chunk)
        this.write(chunk);
      this.ended = true;
      this.tokenizer.end();
    }
    /**
     * Pauses parsing. The parser won't emit events until `resume` is called.
     */
    pause() {
      this.tokenizer.pause();
    }
    /**
     * Resumes parsing after `pause` was called.
     */
    resume() {
      this.tokenizer.resume();
      while (this.tokenizer.running && this.writeIndex < this.buffers.length) {
        this.tokenizer.write(this.buffers[this.writeIndex++]);
      }
      if (this.ended)
        this.tokenizer.end();
    }
    /**
     * Alias of `write`, for backwards compatibility.
     *
     * @param chunk Chunk to parse.
     * @deprecated
     */
    parseChunk(chunk) {
      this.write(chunk);
    }
    /**
     * Alias of `end`, for backwards compatibility.
     *
     * @param chunk Optional final chunk to parse.
     * @deprecated
     */
    done(chunk) {
      this.end(chunk);
    }
  };

  // ../node_modules/.pnpm/domelementtype@2.3.0/node_modules/domelementtype/lib/esm/index.js
  var esm_exports = {};
  __export(esm_exports, {
    CDATA: () => CDATA,
    Comment: () => Comment,
    Directive: () => Directive,
    Doctype: () => Doctype,
    ElementType: () => ElementType,
    Root: () => Root,
    Script: () => Script,
    Style: () => Style,
    Tag: () => Tag,
    Text: () => Text,
    isTag: () => isTag
  });
  var ElementType;
  (function(ElementType2) {
    ElementType2["Root"] = "root";
    ElementType2["Text"] = "text";
    ElementType2["Directive"] = "directive";
    ElementType2["Comment"] = "comment";
    ElementType2["Script"] = "script";
    ElementType2["Style"] = "style";
    ElementType2["Tag"] = "tag";
    ElementType2["CDATA"] = "cdata";
    ElementType2["Doctype"] = "doctype";
  })(ElementType || (ElementType = {}));
  function isTag(elem) {
    return elem.type === ElementType.Tag || elem.type === ElementType.Script || elem.type === ElementType.Style;
  }
  var Root = ElementType.Root;
  var Text = ElementType.Text;
  var Directive = ElementType.Directive;
  var Comment = ElementType.Comment;
  var Script = ElementType.Script;
  var Style = ElementType.Style;
  var Tag = ElementType.Tag;
  var CDATA = ElementType.CDATA;
  var Doctype = ElementType.Doctype;

  // ../node_modules/.pnpm/domhandler@5.0.3/node_modules/domhandler/lib/esm/node.js
  var Node = class {
    constructor() {
      this.parent = null;
      this.prev = null;
      this.next = null;
      this.startIndex = null;
      this.endIndex = null;
    }
    // Read-write aliases for properties
    /**
     * Same as {@link parent}.
     * [DOM spec](https://dom.spec.whatwg.org)-compatible alias.
     */
    get parentNode() {
      return this.parent;
    }
    set parentNode(parent) {
      this.parent = parent;
    }
    /**
     * Same as {@link prev}.
     * [DOM spec](https://dom.spec.whatwg.org)-compatible alias.
     */
    get previousSibling() {
      return this.prev;
    }
    set previousSibling(prev) {
      this.prev = prev;
    }
    /**
     * Same as {@link next}.
     * [DOM spec](https://dom.spec.whatwg.org)-compatible alias.
     */
    get nextSibling() {
      return this.next;
    }
    set nextSibling(next) {
      this.next = next;
    }
    /**
     * Clone this node, and optionally its children.
     *
     * @param recursive Clone child nodes as well.
     * @returns A clone of the node.
     */
    cloneNode(recursive = false) {
      return cloneNode(this, recursive);
    }
  };
  var DataNode = class extends Node {
    /**
     * @param data The content of the data node
     */
    constructor(data) {
      super();
      this.data = data;
    }
    /**
     * Same as {@link data}.
     * [DOM spec](https://dom.spec.whatwg.org)-compatible alias.
     */
    get nodeValue() {
      return this.data;
    }
    set nodeValue(data) {
      this.data = data;
    }
  };
  var Text2 = class extends DataNode {
    constructor() {
      super(...arguments);
      this.type = ElementType.Text;
    }
    get nodeType() {
      return 3;
    }
  };
  var Comment2 = class extends DataNode {
    constructor() {
      super(...arguments);
      this.type = ElementType.Comment;
    }
    get nodeType() {
      return 8;
    }
  };
  var ProcessingInstruction = class extends DataNode {
    constructor(name, data) {
      super(data);
      this.name = name;
      this.type = ElementType.Directive;
    }
    get nodeType() {
      return 1;
    }
  };
  var NodeWithChildren = class extends Node {
    /**
     * @param children Children of the node. Only certain node types can have children.
     */
    constructor(children) {
      super();
      this.children = children;
    }
    // Aliases
    /** First child of the node. */
    get firstChild() {
      var _a3;
      return (_a3 = this.children[0]) !== null && _a3 !== void 0 ? _a3 : null;
    }
    /** Last child of the node. */
    get lastChild() {
      return this.children.length > 0 ? this.children[this.children.length - 1] : null;
    }
    /**
     * Same as {@link children}.
     * [DOM spec](https://dom.spec.whatwg.org)-compatible alias.
     */
    get childNodes() {
      return this.children;
    }
    set childNodes(children) {
      this.children = children;
    }
  };
  var CDATA2 = class extends NodeWithChildren {
    constructor() {
      super(...arguments);
      this.type = ElementType.CDATA;
    }
    get nodeType() {
      return 4;
    }
  };
  var Document = class extends NodeWithChildren {
    constructor() {
      super(...arguments);
      this.type = ElementType.Root;
    }
    get nodeType() {
      return 9;
    }
  };
  var Element = class extends NodeWithChildren {
    /**
     * @param name Name of the tag, eg. `div`, `span`.
     * @param attribs Object mapping attribute names to attribute values.
     * @param children Children of the node.
     */
    constructor(name, attribs, children = [], type = name === "script" ? ElementType.Script : name === "style" ? ElementType.Style : ElementType.Tag) {
      super(children);
      this.name = name;
      this.attribs = attribs;
      this.type = type;
    }
    get nodeType() {
      return 1;
    }
    // DOM Level 1 aliases
    /**
     * Same as {@link name}.
     * [DOM spec](https://dom.spec.whatwg.org)-compatible alias.
     */
    get tagName() {
      return this.name;
    }
    set tagName(name) {
      this.name = name;
    }
    get attributes() {
      return Object.keys(this.attribs).map((name) => {
        var _a3, _b;
        return {
          name,
          value: this.attribs[name],
          namespace: (_a3 = this["x-attribsNamespace"]) === null || _a3 === void 0 ? void 0 : _a3[name],
          prefix: (_b = this["x-attribsPrefix"]) === null || _b === void 0 ? void 0 : _b[name]
        };
      });
    }
  };
  function isTag2(node) {
    return isTag(node);
  }
  function isCDATA(node) {
    return node.type === ElementType.CDATA;
  }
  function isText(node) {
    return node.type === ElementType.Text;
  }
  function isComment(node) {
    return node.type === ElementType.Comment;
  }
  function isDirective(node) {
    return node.type === ElementType.Directive;
  }
  function isDocument(node) {
    return node.type === ElementType.Root;
  }
  function hasChildren(node) {
    return Object.prototype.hasOwnProperty.call(node, "children");
  }
  function cloneNode(node, recursive = false) {
    let result;
    if (isText(node)) {
      result = new Text2(node.data);
    } else if (isComment(node)) {
      result = new Comment2(node.data);
    } else if (isTag2(node)) {
      const children = recursive ? cloneChildren(node.children) : [];
      const clone = new Element(node.name, { ...node.attribs }, children);
      children.forEach((child) => child.parent = clone);
      if (node.namespace != null) {
        clone.namespace = node.namespace;
      }
      if (node["x-attribsNamespace"]) {
        clone["x-attribsNamespace"] = { ...node["x-attribsNamespace"] };
      }
      if (node["x-attribsPrefix"]) {
        clone["x-attribsPrefix"] = { ...node["x-attribsPrefix"] };
      }
      result = clone;
    } else if (isCDATA(node)) {
      const children = recursive ? cloneChildren(node.children) : [];
      const clone = new CDATA2(children);
      children.forEach((child) => child.parent = clone);
      result = clone;
    } else if (isDocument(node)) {
      const children = recursive ? cloneChildren(node.children) : [];
      const clone = new Document(children);
      children.forEach((child) => child.parent = clone);
      if (node["x-mode"]) {
        clone["x-mode"] = node["x-mode"];
      }
      result = clone;
    } else if (isDirective(node)) {
      const instruction = new ProcessingInstruction(node.name, node.data);
      if (node["x-name"] != null) {
        instruction["x-name"] = node["x-name"];
        instruction["x-publicId"] = node["x-publicId"];
        instruction["x-systemId"] = node["x-systemId"];
      }
      result = instruction;
    } else {
      throw new Error(`Not implemented yet: ${node.type}`);
    }
    result.startIndex = node.startIndex;
    result.endIndex = node.endIndex;
    if (node.sourceCodeLocation != null) {
      result.sourceCodeLocation = node.sourceCodeLocation;
    }
    return result;
  }
  function cloneChildren(childs) {
    const children = childs.map((child) => cloneNode(child, true));
    for (let i = 1; i < children.length; i++) {
      children[i].prev = children[i - 1];
      children[i - 1].next = children[i];
    }
    return children;
  }

  // ../node_modules/.pnpm/domhandler@5.0.3/node_modules/domhandler/lib/esm/index.js
  var defaultOpts = {
    withStartIndices: false,
    withEndIndices: false,
    xmlMode: false
  };
  var DomHandler = class {
    /**
     * @param callback Called once parsing has completed.
     * @param options Settings for the handler.
     * @param elementCB Callback whenever a tag is closed.
     */
    constructor(callback, options, elementCB) {
      this.dom = [];
      this.root = new Document(this.dom);
      this.done = false;
      this.tagStack = [this.root];
      this.lastNode = null;
      this.parser = null;
      if (typeof options === "function") {
        elementCB = options;
        options = defaultOpts;
      }
      if (typeof callback === "object") {
        options = callback;
        callback = void 0;
      }
      this.callback = callback !== null && callback !== void 0 ? callback : null;
      this.options = options !== null && options !== void 0 ? options : defaultOpts;
      this.elementCB = elementCB !== null && elementCB !== void 0 ? elementCB : null;
    }
    onparserinit(parser) {
      this.parser = parser;
    }
    // Resets the handler back to starting state
    onreset() {
      this.dom = [];
      this.root = new Document(this.dom);
      this.done = false;
      this.tagStack = [this.root];
      this.lastNode = null;
      this.parser = null;
    }
    // Signals the handler that parsing is done
    onend() {
      if (this.done)
        return;
      this.done = true;
      this.parser = null;
      this.handleCallback(null);
    }
    onerror(error) {
      this.handleCallback(error);
    }
    onclosetag() {
      this.lastNode = null;
      const elem = this.tagStack.pop();
      if (this.options.withEndIndices) {
        elem.endIndex = this.parser.endIndex;
      }
      if (this.elementCB)
        this.elementCB(elem);
    }
    onopentag(name, attribs) {
      const type = this.options.xmlMode ? ElementType.Tag : void 0;
      const element = new Element(name, attribs, void 0, type);
      this.addNode(element);
      this.tagStack.push(element);
    }
    ontext(data) {
      const { lastNode } = this;
      if (lastNode && lastNode.type === ElementType.Text) {
        lastNode.data += data;
        if (this.options.withEndIndices) {
          lastNode.endIndex = this.parser.endIndex;
        }
      } else {
        const node = new Text2(data);
        this.addNode(node);
        this.lastNode = node;
      }
    }
    oncomment(data) {
      if (this.lastNode && this.lastNode.type === ElementType.Comment) {
        this.lastNode.data += data;
        return;
      }
      const node = new Comment2(data);
      this.addNode(node);
      this.lastNode = node;
    }
    oncommentend() {
      this.lastNode = null;
    }
    oncdatastart() {
      const text = new Text2("");
      const node = new CDATA2([text]);
      this.addNode(node);
      text.parent = node;
      this.lastNode = text;
    }
    oncdataend() {
      this.lastNode = null;
    }
    onprocessinginstruction(name, data) {
      const node = new ProcessingInstruction(name, data);
      this.addNode(node);
    }
    handleCallback(error) {
      if (typeof this.callback === "function") {
        this.callback(error, this.dom);
      } else if (error) {
        throw error;
      }
    }
    addNode(node) {
      const parent = this.tagStack[this.tagStack.length - 1];
      const previousSibling2 = parent.children[parent.children.length - 1];
      if (this.options.withStartIndices) {
        node.startIndex = this.parser.startIndex;
      }
      if (this.options.withEndIndices) {
        node.endIndex = this.parser.endIndex;
      }
      parent.children.push(node);
      if (previousSibling2) {
        node.prev = previousSibling2;
        previousSibling2.next = node;
      }
      node.parent = parent;
      this.lastNode = null;
    }
  };

  // ../node_modules/.pnpm/domutils@3.2.2/node_modules/domutils/lib/esm/index.js
  var esm_exports2 = {};
  __export(esm_exports2, {
    DocumentPosition: () => DocumentPosition,
    append: () => append,
    appendChild: () => appendChild,
    compareDocumentPosition: () => compareDocumentPosition,
    existsOne: () => existsOne,
    filter: () => filter,
    find: () => find,
    findAll: () => findAll,
    findOne: () => findOne,
    findOneChild: () => findOneChild,
    getAttributeValue: () => getAttributeValue,
    getChildren: () => getChildren,
    getElementById: () => getElementById,
    getElements: () => getElements,
    getElementsByClassName: () => getElementsByClassName,
    getElementsByTagName: () => getElementsByTagName,
    getElementsByTagType: () => getElementsByTagType,
    getFeed: () => getFeed,
    getInnerHTML: () => getInnerHTML,
    getName: () => getName,
    getOuterHTML: () => getOuterHTML,
    getParent: () => getParent,
    getSiblings: () => getSiblings,
    getText: () => getText,
    hasAttrib: () => hasAttrib,
    hasChildren: () => hasChildren,
    innerText: () => innerText,
    isCDATA: () => isCDATA,
    isComment: () => isComment,
    isDocument: () => isDocument,
    isTag: () => isTag2,
    isText: () => isText,
    nextElementSibling: () => nextElementSibling,
    prepend: () => prepend,
    prependChild: () => prependChild,
    prevElementSibling: () => prevElementSibling,
    removeElement: () => removeElement,
    removeSubsets: () => removeSubsets,
    replaceElement: () => replaceElement,
    testElement: () => testElement,
    textContent: () => textContent,
    uniqueSort: () => uniqueSort
  });

  // ../node_modules/.pnpm/entities@4.5.0/node_modules/entities/lib/esm/generated/decode-data-html.js
  var decode_data_html_default = new Uint16Array(
    // prettier-ignore
    '\u1D41<\xD5\u0131\u028A\u049D\u057B\u05D0\u0675\u06DE\u07A2\u07D6\u080F\u0A4A\u0A91\u0DA1\u0E6D\u0F09\u0F26\u10CA\u1228\u12E1\u1415\u149D\u14C3\u14DF\u1525\0\0\0\0\0\0\u156B\u16CD\u198D\u1C12\u1DDD\u1F7E\u2060\u21B0\u228D\u23C0\u23FB\u2442\u2824\u2912\u2D08\u2E48\u2FCE\u3016\u32BA\u3639\u37AC\u38FE\u3A28\u3A71\u3AE0\u3B2E\u0800EMabcfglmnoprstu\\bfms\x7F\x84\x8B\x90\x95\x98\xA6\xB3\xB9\xC8\xCFlig\u803B\xC6\u40C6P\u803B&\u4026cute\u803B\xC1\u40C1reve;\u4102\u0100iyx}rc\u803B\xC2\u40C2;\u4410r;\uC000\u{1D504}rave\u803B\xC0\u40C0pha;\u4391acr;\u4100d;\u6A53\u0100gp\x9D\xA1on;\u4104f;\uC000\u{1D538}plyFunction;\u6061ing\u803B\xC5\u40C5\u0100cs\xBE\xC3r;\uC000\u{1D49C}ign;\u6254ilde\u803B\xC3\u40C3ml\u803B\xC4\u40C4\u0400aceforsu\xE5\xFB\xFE\u0117\u011C\u0122\u0127\u012A\u0100cr\xEA\xF2kslash;\u6216\u0176\xF6\xF8;\u6AE7ed;\u6306y;\u4411\u0180crt\u0105\u010B\u0114ause;\u6235noullis;\u612Ca;\u4392r;\uC000\u{1D505}pf;\uC000\u{1D539}eve;\u42D8c\xF2\u0113mpeq;\u624E\u0700HOacdefhilorsu\u014D\u0151\u0156\u0180\u019E\u01A2\u01B5\u01B7\u01BA\u01DC\u0215\u0273\u0278\u027Ecy;\u4427PY\u803B\xA9\u40A9\u0180cpy\u015D\u0162\u017Aute;\u4106\u0100;i\u0167\u0168\u62D2talDifferentialD;\u6145leys;\u612D\u0200aeio\u0189\u018E\u0194\u0198ron;\u410Cdil\u803B\xC7\u40C7rc;\u4108nint;\u6230ot;\u410A\u0100dn\u01A7\u01ADilla;\u40B8terDot;\u40B7\xF2\u017Fi;\u43A7rcle\u0200DMPT\u01C7\u01CB\u01D1\u01D6ot;\u6299inus;\u6296lus;\u6295imes;\u6297o\u0100cs\u01E2\u01F8kwiseContourIntegral;\u6232eCurly\u0100DQ\u0203\u020FoubleQuote;\u601Duote;\u6019\u0200lnpu\u021E\u0228\u0247\u0255on\u0100;e\u0225\u0226\u6237;\u6A74\u0180git\u022F\u0236\u023Aruent;\u6261nt;\u622FourIntegral;\u622E\u0100fr\u024C\u024E;\u6102oduct;\u6210nterClockwiseContourIntegral;\u6233oss;\u6A2Fcr;\uC000\u{1D49E}p\u0100;C\u0284\u0285\u62D3ap;\u624D\u0580DJSZacefios\u02A0\u02AC\u02B0\u02B4\u02B8\u02CB\u02D7\u02E1\u02E6\u0333\u048D\u0100;o\u0179\u02A5trahd;\u6911cy;\u4402cy;\u4405cy;\u440F\u0180grs\u02BF\u02C4\u02C7ger;\u6021r;\u61A1hv;\u6AE4\u0100ay\u02D0\u02D5ron;\u410E;\u4414l\u0100;t\u02DD\u02DE\u6207a;\u4394r;\uC000\u{1D507}\u0100af\u02EB\u0327\u0100cm\u02F0\u0322ritical\u0200ADGT\u0300\u0306\u0316\u031Ccute;\u40B4o\u0174\u030B\u030D;\u42D9bleAcute;\u42DDrave;\u4060ilde;\u42DCond;\u62C4ferentialD;\u6146\u0470\u033D\0\0\0\u0342\u0354\0\u0405f;\uC000\u{1D53B}\u0180;DE\u0348\u0349\u034D\u40A8ot;\u60DCqual;\u6250ble\u0300CDLRUV\u0363\u0372\u0382\u03CF\u03E2\u03F8ontourIntegra\xEC\u0239o\u0274\u0379\0\0\u037B\xBB\u0349nArrow;\u61D3\u0100eo\u0387\u03A4ft\u0180ART\u0390\u0396\u03A1rrow;\u61D0ightArrow;\u61D4e\xE5\u02CAng\u0100LR\u03AB\u03C4eft\u0100AR\u03B3\u03B9rrow;\u67F8ightArrow;\u67FAightArrow;\u67F9ight\u0100AT\u03D8\u03DErrow;\u61D2ee;\u62A8p\u0241\u03E9\0\0\u03EFrrow;\u61D1ownArrow;\u61D5erticalBar;\u6225n\u0300ABLRTa\u0412\u042A\u0430\u045E\u047F\u037Crrow\u0180;BU\u041D\u041E\u0422\u6193ar;\u6913pArrow;\u61F5reve;\u4311eft\u02D2\u043A\0\u0446\0\u0450ightVector;\u6950eeVector;\u695Eector\u0100;B\u0459\u045A\u61BDar;\u6956ight\u01D4\u0467\0\u0471eeVector;\u695Fector\u0100;B\u047A\u047B\u61C1ar;\u6957ee\u0100;A\u0486\u0487\u62A4rrow;\u61A7\u0100ct\u0492\u0497r;\uC000\u{1D49F}rok;\u4110\u0800NTacdfglmopqstux\u04BD\u04C0\u04C4\u04CB\u04DE\u04E2\u04E7\u04EE\u04F5\u0521\u052F\u0536\u0552\u055D\u0560\u0565G;\u414AH\u803B\xD0\u40D0cute\u803B\xC9\u40C9\u0180aiy\u04D2\u04D7\u04DCron;\u411Arc\u803B\xCA\u40CA;\u442Dot;\u4116r;\uC000\u{1D508}rave\u803B\xC8\u40C8ement;\u6208\u0100ap\u04FA\u04FEcr;\u4112ty\u0253\u0506\0\0\u0512mallSquare;\u65FBerySmallSquare;\u65AB\u0100gp\u0526\u052Aon;\u4118f;\uC000\u{1D53C}silon;\u4395u\u0100ai\u053C\u0549l\u0100;T\u0542\u0543\u6A75ilde;\u6242librium;\u61CC\u0100ci\u0557\u055Ar;\u6130m;\u6A73a;\u4397ml\u803B\xCB\u40CB\u0100ip\u056A\u056Fsts;\u6203onentialE;\u6147\u0280cfios\u0585\u0588\u058D\u05B2\u05CCy;\u4424r;\uC000\u{1D509}lled\u0253\u0597\0\0\u05A3mallSquare;\u65FCerySmallSquare;\u65AA\u0370\u05BA\0\u05BF\0\0\u05C4f;\uC000\u{1D53D}All;\u6200riertrf;\u6131c\xF2\u05CB\u0600JTabcdfgorst\u05E8\u05EC\u05EF\u05FA\u0600\u0612\u0616\u061B\u061D\u0623\u066C\u0672cy;\u4403\u803B>\u403Emma\u0100;d\u05F7\u05F8\u4393;\u43DCreve;\u411E\u0180eiy\u0607\u060C\u0610dil;\u4122rc;\u411C;\u4413ot;\u4120r;\uC000\u{1D50A};\u62D9pf;\uC000\u{1D53E}eater\u0300EFGLST\u0635\u0644\u064E\u0656\u065B\u0666qual\u0100;L\u063E\u063F\u6265ess;\u62DBullEqual;\u6267reater;\u6AA2ess;\u6277lantEqual;\u6A7Eilde;\u6273cr;\uC000\u{1D4A2};\u626B\u0400Aacfiosu\u0685\u068B\u0696\u069B\u069E\u06AA\u06BE\u06CARDcy;\u442A\u0100ct\u0690\u0694ek;\u42C7;\u405Eirc;\u4124r;\u610ClbertSpace;\u610B\u01F0\u06AF\0\u06B2f;\u610DizontalLine;\u6500\u0100ct\u06C3\u06C5\xF2\u06A9rok;\u4126mp\u0144\u06D0\u06D8ownHum\xF0\u012Fqual;\u624F\u0700EJOacdfgmnostu\u06FA\u06FE\u0703\u0707\u070E\u071A\u071E\u0721\u0728\u0744\u0778\u078B\u078F\u0795cy;\u4415lig;\u4132cy;\u4401cute\u803B\xCD\u40CD\u0100iy\u0713\u0718rc\u803B\xCE\u40CE;\u4418ot;\u4130r;\u6111rave\u803B\xCC\u40CC\u0180;ap\u0720\u072F\u073F\u0100cg\u0734\u0737r;\u412AinaryI;\u6148lie\xF3\u03DD\u01F4\u0749\0\u0762\u0100;e\u074D\u074E\u622C\u0100gr\u0753\u0758ral;\u622Bsection;\u62C2isible\u0100CT\u076C\u0772omma;\u6063imes;\u6062\u0180gpt\u077F\u0783\u0788on;\u412Ef;\uC000\u{1D540}a;\u4399cr;\u6110ilde;\u4128\u01EB\u079A\0\u079Ecy;\u4406l\u803B\xCF\u40CF\u0280cfosu\u07AC\u07B7\u07BC\u07C2\u07D0\u0100iy\u07B1\u07B5rc;\u4134;\u4419r;\uC000\u{1D50D}pf;\uC000\u{1D541}\u01E3\u07C7\0\u07CCr;\uC000\u{1D4A5}rcy;\u4408kcy;\u4404\u0380HJacfos\u07E4\u07E8\u07EC\u07F1\u07FD\u0802\u0808cy;\u4425cy;\u440Cppa;\u439A\u0100ey\u07F6\u07FBdil;\u4136;\u441Ar;\uC000\u{1D50E}pf;\uC000\u{1D542}cr;\uC000\u{1D4A6}\u0580JTaceflmost\u0825\u0829\u082C\u0850\u0863\u09B3\u09B8\u09C7\u09CD\u0A37\u0A47cy;\u4409\u803B<\u403C\u0280cmnpr\u0837\u083C\u0841\u0844\u084Dute;\u4139bda;\u439Bg;\u67EAlacetrf;\u6112r;\u619E\u0180aey\u0857\u085C\u0861ron;\u413Ddil;\u413B;\u441B\u0100fs\u0868\u0970t\u0500ACDFRTUVar\u087E\u08A9\u08B1\u08E0\u08E6\u08FC\u092F\u095B\u0390\u096A\u0100nr\u0883\u088FgleBracket;\u67E8row\u0180;BR\u0899\u089A\u089E\u6190ar;\u61E4ightArrow;\u61C6eiling;\u6308o\u01F5\u08B7\0\u08C3bleBracket;\u67E6n\u01D4\u08C8\0\u08D2eeVector;\u6961ector\u0100;B\u08DB\u08DC\u61C3ar;\u6959loor;\u630Aight\u0100AV\u08EF\u08F5rrow;\u6194ector;\u694E\u0100er\u0901\u0917e\u0180;AV\u0909\u090A\u0910\u62A3rrow;\u61A4ector;\u695Aiangle\u0180;BE\u0924\u0925\u0929\u62B2ar;\u69CFqual;\u62B4p\u0180DTV\u0937\u0942\u094CownVector;\u6951eeVector;\u6960ector\u0100;B\u0956\u0957\u61BFar;\u6958ector\u0100;B\u0965\u0966\u61BCar;\u6952ight\xE1\u039Cs\u0300EFGLST\u097E\u098B\u0995\u099D\u09A2\u09ADqualGreater;\u62DAullEqual;\u6266reater;\u6276ess;\u6AA1lantEqual;\u6A7Dilde;\u6272r;\uC000\u{1D50F}\u0100;e\u09BD\u09BE\u62D8ftarrow;\u61DAidot;\u413F\u0180npw\u09D4\u0A16\u0A1Bg\u0200LRlr\u09DE\u09F7\u0A02\u0A10eft\u0100AR\u09E6\u09ECrrow;\u67F5ightArrow;\u67F7ightArrow;\u67F6eft\u0100ar\u03B3\u0A0Aight\xE1\u03BFight\xE1\u03CAf;\uC000\u{1D543}er\u0100LR\u0A22\u0A2CeftArrow;\u6199ightArrow;\u6198\u0180cht\u0A3E\u0A40\u0A42\xF2\u084C;\u61B0rok;\u4141;\u626A\u0400acefiosu\u0A5A\u0A5D\u0A60\u0A77\u0A7C\u0A85\u0A8B\u0A8Ep;\u6905y;\u441C\u0100dl\u0A65\u0A6FiumSpace;\u605Flintrf;\u6133r;\uC000\u{1D510}nusPlus;\u6213pf;\uC000\u{1D544}c\xF2\u0A76;\u439C\u0480Jacefostu\u0AA3\u0AA7\u0AAD\u0AC0\u0B14\u0B19\u0D91\u0D97\u0D9Ecy;\u440Acute;\u4143\u0180aey\u0AB4\u0AB9\u0ABEron;\u4147dil;\u4145;\u441D\u0180gsw\u0AC7\u0AF0\u0B0Eative\u0180MTV\u0AD3\u0ADF\u0AE8ediumSpace;\u600Bhi\u0100cn\u0AE6\u0AD8\xEB\u0AD9eryThi\xEE\u0AD9ted\u0100GL\u0AF8\u0B06reaterGreate\xF2\u0673essLes\xF3\u0A48Line;\u400Ar;\uC000\u{1D511}\u0200Bnpt\u0B22\u0B28\u0B37\u0B3Areak;\u6060BreakingSpace;\u40A0f;\u6115\u0680;CDEGHLNPRSTV\u0B55\u0B56\u0B6A\u0B7C\u0BA1\u0BEB\u0C04\u0C5E\u0C84\u0CA6\u0CD8\u0D61\u0D85\u6AEC\u0100ou\u0B5B\u0B64ngruent;\u6262pCap;\u626DoubleVerticalBar;\u6226\u0180lqx\u0B83\u0B8A\u0B9Bement;\u6209ual\u0100;T\u0B92\u0B93\u6260ilde;\uC000\u2242\u0338ists;\u6204reater\u0380;EFGLST\u0BB6\u0BB7\u0BBD\u0BC9\u0BD3\u0BD8\u0BE5\u626Fqual;\u6271ullEqual;\uC000\u2267\u0338reater;\uC000\u226B\u0338ess;\u6279lantEqual;\uC000\u2A7E\u0338ilde;\u6275ump\u0144\u0BF2\u0BFDownHump;\uC000\u224E\u0338qual;\uC000\u224F\u0338e\u0100fs\u0C0A\u0C27tTriangle\u0180;BE\u0C1A\u0C1B\u0C21\u62EAar;\uC000\u29CF\u0338qual;\u62ECs\u0300;EGLST\u0C35\u0C36\u0C3C\u0C44\u0C4B\u0C58\u626Equal;\u6270reater;\u6278ess;\uC000\u226A\u0338lantEqual;\uC000\u2A7D\u0338ilde;\u6274ested\u0100GL\u0C68\u0C79reaterGreater;\uC000\u2AA2\u0338essLess;\uC000\u2AA1\u0338recedes\u0180;ES\u0C92\u0C93\u0C9B\u6280qual;\uC000\u2AAF\u0338lantEqual;\u62E0\u0100ei\u0CAB\u0CB9verseElement;\u620CghtTriangle\u0180;BE\u0CCB\u0CCC\u0CD2\u62EBar;\uC000\u29D0\u0338qual;\u62ED\u0100qu\u0CDD\u0D0CuareSu\u0100bp\u0CE8\u0CF9set\u0100;E\u0CF0\u0CF3\uC000\u228F\u0338qual;\u62E2erset\u0100;E\u0D03\u0D06\uC000\u2290\u0338qual;\u62E3\u0180bcp\u0D13\u0D24\u0D4Eset\u0100;E\u0D1B\u0D1E\uC000\u2282\u20D2qual;\u6288ceeds\u0200;EST\u0D32\u0D33\u0D3B\u0D46\u6281qual;\uC000\u2AB0\u0338lantEqual;\u62E1ilde;\uC000\u227F\u0338erset\u0100;E\u0D58\u0D5B\uC000\u2283\u20D2qual;\u6289ilde\u0200;EFT\u0D6E\u0D6F\u0D75\u0D7F\u6241qual;\u6244ullEqual;\u6247ilde;\u6249erticalBar;\u6224cr;\uC000\u{1D4A9}ilde\u803B\xD1\u40D1;\u439D\u0700Eacdfgmoprstuv\u0DBD\u0DC2\u0DC9\u0DD5\u0DDB\u0DE0\u0DE7\u0DFC\u0E02\u0E20\u0E22\u0E32\u0E3F\u0E44lig;\u4152cute\u803B\xD3\u40D3\u0100iy\u0DCE\u0DD3rc\u803B\xD4\u40D4;\u441Eblac;\u4150r;\uC000\u{1D512}rave\u803B\xD2\u40D2\u0180aei\u0DEE\u0DF2\u0DF6cr;\u414Cga;\u43A9cron;\u439Fpf;\uC000\u{1D546}enCurly\u0100DQ\u0E0E\u0E1AoubleQuote;\u601Cuote;\u6018;\u6A54\u0100cl\u0E27\u0E2Cr;\uC000\u{1D4AA}ash\u803B\xD8\u40D8i\u016C\u0E37\u0E3Cde\u803B\xD5\u40D5es;\u6A37ml\u803B\xD6\u40D6er\u0100BP\u0E4B\u0E60\u0100ar\u0E50\u0E53r;\u603Eac\u0100ek\u0E5A\u0E5C;\u63DEet;\u63B4arenthesis;\u63DC\u0480acfhilors\u0E7F\u0E87\u0E8A\u0E8F\u0E92\u0E94\u0E9D\u0EB0\u0EFCrtialD;\u6202y;\u441Fr;\uC000\u{1D513}i;\u43A6;\u43A0usMinus;\u40B1\u0100ip\u0EA2\u0EADncareplan\xE5\u069Df;\u6119\u0200;eio\u0EB9\u0EBA\u0EE0\u0EE4\u6ABBcedes\u0200;EST\u0EC8\u0EC9\u0ECF\u0EDA\u627Aqual;\u6AAFlantEqual;\u627Cilde;\u627Eme;\u6033\u0100dp\u0EE9\u0EEEuct;\u620Fortion\u0100;a\u0225\u0EF9l;\u621D\u0100ci\u0F01\u0F06r;\uC000\u{1D4AB};\u43A8\u0200Ufos\u0F11\u0F16\u0F1B\u0F1FOT\u803B"\u4022r;\uC000\u{1D514}pf;\u611Acr;\uC000\u{1D4AC}\u0600BEacefhiorsu\u0F3E\u0F43\u0F47\u0F60\u0F73\u0FA7\u0FAA\u0FAD\u1096\u10A9\u10B4\u10BEarr;\u6910G\u803B\xAE\u40AE\u0180cnr\u0F4E\u0F53\u0F56ute;\u4154g;\u67EBr\u0100;t\u0F5C\u0F5D\u61A0l;\u6916\u0180aey\u0F67\u0F6C\u0F71ron;\u4158dil;\u4156;\u4420\u0100;v\u0F78\u0F79\u611Cerse\u0100EU\u0F82\u0F99\u0100lq\u0F87\u0F8Eement;\u620Builibrium;\u61CBpEquilibrium;\u696Fr\xBB\u0F79o;\u43A1ght\u0400ACDFTUVa\u0FC1\u0FEB\u0FF3\u1022\u1028\u105B\u1087\u03D8\u0100nr\u0FC6\u0FD2gleBracket;\u67E9row\u0180;BL\u0FDC\u0FDD\u0FE1\u6192ar;\u61E5eftArrow;\u61C4eiling;\u6309o\u01F5\u0FF9\0\u1005bleBracket;\u67E7n\u01D4\u100A\0\u1014eeVector;\u695Dector\u0100;B\u101D\u101E\u61C2ar;\u6955loor;\u630B\u0100er\u102D\u1043e\u0180;AV\u1035\u1036\u103C\u62A2rrow;\u61A6ector;\u695Biangle\u0180;BE\u1050\u1051\u1055\u62B3ar;\u69D0qual;\u62B5p\u0180DTV\u1063\u106E\u1078ownVector;\u694FeeVector;\u695Cector\u0100;B\u1082\u1083\u61BEar;\u6954ector\u0100;B\u1091\u1092\u61C0ar;\u6953\u0100pu\u109B\u109Ef;\u611DndImplies;\u6970ightarrow;\u61DB\u0100ch\u10B9\u10BCr;\u611B;\u61B1leDelayed;\u69F4\u0680HOacfhimoqstu\u10E4\u10F1\u10F7\u10FD\u1119\u111E\u1151\u1156\u1161\u1167\u11B5\u11BB\u11BF\u0100Cc\u10E9\u10EEHcy;\u4429y;\u4428FTcy;\u442Ccute;\u415A\u0280;aeiy\u1108\u1109\u110E\u1113\u1117\u6ABCron;\u4160dil;\u415Erc;\u415C;\u4421r;\uC000\u{1D516}ort\u0200DLRU\u112A\u1134\u113E\u1149ownArrow\xBB\u041EeftArrow\xBB\u089AightArrow\xBB\u0FDDpArrow;\u6191gma;\u43A3allCircle;\u6218pf;\uC000\u{1D54A}\u0272\u116D\0\0\u1170t;\u621Aare\u0200;ISU\u117B\u117C\u1189\u11AF\u65A1ntersection;\u6293u\u0100bp\u118F\u119Eset\u0100;E\u1197\u1198\u628Fqual;\u6291erset\u0100;E\u11A8\u11A9\u6290qual;\u6292nion;\u6294cr;\uC000\u{1D4AE}ar;\u62C6\u0200bcmp\u11C8\u11DB\u1209\u120B\u0100;s\u11CD\u11CE\u62D0et\u0100;E\u11CD\u11D5qual;\u6286\u0100ch\u11E0\u1205eeds\u0200;EST\u11ED\u11EE\u11F4\u11FF\u627Bqual;\u6AB0lantEqual;\u627Dilde;\u627FTh\xE1\u0F8C;\u6211\u0180;es\u1212\u1213\u1223\u62D1rset\u0100;E\u121C\u121D\u6283qual;\u6287et\xBB\u1213\u0580HRSacfhiors\u123E\u1244\u1249\u1255\u125E\u1271\u1276\u129F\u12C2\u12C8\u12D1ORN\u803B\xDE\u40DEADE;\u6122\u0100Hc\u124E\u1252cy;\u440By;\u4426\u0100bu\u125A\u125C;\u4009;\u43A4\u0180aey\u1265\u126A\u126Fron;\u4164dil;\u4162;\u4422r;\uC000\u{1D517}\u0100ei\u127B\u1289\u01F2\u1280\0\u1287efore;\u6234a;\u4398\u0100cn\u128E\u1298kSpace;\uC000\u205F\u200ASpace;\u6009lde\u0200;EFT\u12AB\u12AC\u12B2\u12BC\u623Cqual;\u6243ullEqual;\u6245ilde;\u6248pf;\uC000\u{1D54B}ipleDot;\u60DB\u0100ct\u12D6\u12DBr;\uC000\u{1D4AF}rok;\u4166\u0AE1\u12F7\u130E\u131A\u1326\0\u132C\u1331\0\0\0\0\0\u1338\u133D\u1377\u1385\0\u13FF\u1404\u140A\u1410\u0100cr\u12FB\u1301ute\u803B\xDA\u40DAr\u0100;o\u1307\u1308\u619Fcir;\u6949r\u01E3\u1313\0\u1316y;\u440Eve;\u416C\u0100iy\u131E\u1323rc\u803B\xDB\u40DB;\u4423blac;\u4170r;\uC000\u{1D518}rave\u803B\xD9\u40D9acr;\u416A\u0100di\u1341\u1369er\u0100BP\u1348\u135D\u0100ar\u134D\u1350r;\u405Fac\u0100ek\u1357\u1359;\u63DFet;\u63B5arenthesis;\u63DDon\u0100;P\u1370\u1371\u62C3lus;\u628E\u0100gp\u137B\u137Fon;\u4172f;\uC000\u{1D54C}\u0400ADETadps\u1395\u13AE\u13B8\u13C4\u03E8\u13D2\u13D7\u13F3rrow\u0180;BD\u1150\u13A0\u13A4ar;\u6912ownArrow;\u61C5ownArrow;\u6195quilibrium;\u696Eee\u0100;A\u13CB\u13CC\u62A5rrow;\u61A5own\xE1\u03F3er\u0100LR\u13DE\u13E8eftArrow;\u6196ightArrow;\u6197i\u0100;l\u13F9\u13FA\u43D2on;\u43A5ing;\u416Ecr;\uC000\u{1D4B0}ilde;\u4168ml\u803B\xDC\u40DC\u0480Dbcdefosv\u1427\u142C\u1430\u1433\u143E\u1485\u148A\u1490\u1496ash;\u62ABar;\u6AEBy;\u4412ash\u0100;l\u143B\u143C\u62A9;\u6AE6\u0100er\u1443\u1445;\u62C1\u0180bty\u144C\u1450\u147Aar;\u6016\u0100;i\u144F\u1455cal\u0200BLST\u1461\u1465\u146A\u1474ar;\u6223ine;\u407Ceparator;\u6758ilde;\u6240ThinSpace;\u600Ar;\uC000\u{1D519}pf;\uC000\u{1D54D}cr;\uC000\u{1D4B1}dash;\u62AA\u0280cefos\u14A7\u14AC\u14B1\u14B6\u14BCirc;\u4174dge;\u62C0r;\uC000\u{1D51A}pf;\uC000\u{1D54E}cr;\uC000\u{1D4B2}\u0200fios\u14CB\u14D0\u14D2\u14D8r;\uC000\u{1D51B};\u439Epf;\uC000\u{1D54F}cr;\uC000\u{1D4B3}\u0480AIUacfosu\u14F1\u14F5\u14F9\u14FD\u1504\u150F\u1514\u151A\u1520cy;\u442Fcy;\u4407cy;\u442Ecute\u803B\xDD\u40DD\u0100iy\u1509\u150Drc;\u4176;\u442Br;\uC000\u{1D51C}pf;\uC000\u{1D550}cr;\uC000\u{1D4B4}ml;\u4178\u0400Hacdefos\u1535\u1539\u153F\u154B\u154F\u155D\u1560\u1564cy;\u4416cute;\u4179\u0100ay\u1544\u1549ron;\u417D;\u4417ot;\u417B\u01F2\u1554\0\u155BoWidt\xE8\u0AD9a;\u4396r;\u6128pf;\u6124cr;\uC000\u{1D4B5}\u0BE1\u1583\u158A\u1590\0\u15B0\u15B6\u15BF\0\0\0\0\u15C6\u15DB\u15EB\u165F\u166D\0\u1695\u169B\u16B2\u16B9\0\u16BEcute\u803B\xE1\u40E1reve;\u4103\u0300;Ediuy\u159C\u159D\u15A1\u15A3\u15A8\u15AD\u623E;\uC000\u223E\u0333;\u623Frc\u803B\xE2\u40E2te\u80BB\xB4\u0306;\u4430lig\u803B\xE6\u40E6\u0100;r\xB2\u15BA;\uC000\u{1D51E}rave\u803B\xE0\u40E0\u0100ep\u15CA\u15D6\u0100fp\u15CF\u15D4sym;\u6135\xE8\u15D3ha;\u43B1\u0100ap\u15DFc\u0100cl\u15E4\u15E7r;\u4101g;\u6A3F\u0264\u15F0\0\0\u160A\u0280;adsv\u15FA\u15FB\u15FF\u1601\u1607\u6227nd;\u6A55;\u6A5Clope;\u6A58;\u6A5A\u0380;elmrsz\u1618\u1619\u161B\u161E\u163F\u164F\u1659\u6220;\u69A4e\xBB\u1619sd\u0100;a\u1625\u1626\u6221\u0461\u1630\u1632\u1634\u1636\u1638\u163A\u163C\u163E;\u69A8;\u69A9;\u69AA;\u69AB;\u69AC;\u69AD;\u69AE;\u69AFt\u0100;v\u1645\u1646\u621Fb\u0100;d\u164C\u164D\u62BE;\u699D\u0100pt\u1654\u1657h;\u6222\xBB\xB9arr;\u637C\u0100gp\u1663\u1667on;\u4105f;\uC000\u{1D552}\u0380;Eaeiop\u12C1\u167B\u167D\u1682\u1684\u1687\u168A;\u6A70cir;\u6A6F;\u624Ad;\u624Bs;\u4027rox\u0100;e\u12C1\u1692\xF1\u1683ing\u803B\xE5\u40E5\u0180cty\u16A1\u16A6\u16A8r;\uC000\u{1D4B6};\u402Amp\u0100;e\u12C1\u16AF\xF1\u0288ilde\u803B\xE3\u40E3ml\u803B\xE4\u40E4\u0100ci\u16C2\u16C8onin\xF4\u0272nt;\u6A11\u0800Nabcdefiklnoprsu\u16ED\u16F1\u1730\u173C\u1743\u1748\u1778\u177D\u17E0\u17E6\u1839\u1850\u170D\u193D\u1948\u1970ot;\u6AED\u0100cr\u16F6\u171Ek\u0200ceps\u1700\u1705\u170D\u1713ong;\u624Cpsilon;\u43F6rime;\u6035im\u0100;e\u171A\u171B\u623Dq;\u62CD\u0176\u1722\u1726ee;\u62BDed\u0100;g\u172C\u172D\u6305e\xBB\u172Drk\u0100;t\u135C\u1737brk;\u63B6\u0100oy\u1701\u1741;\u4431quo;\u601E\u0280cmprt\u1753\u175B\u1761\u1764\u1768aus\u0100;e\u010A\u0109ptyv;\u69B0s\xE9\u170Cno\xF5\u0113\u0180ahw\u176F\u1771\u1773;\u43B2;\u6136een;\u626Cr;\uC000\u{1D51F}g\u0380costuvw\u178D\u179D\u17B3\u17C1\u17D5\u17DB\u17DE\u0180aiu\u1794\u1796\u179A\xF0\u0760rc;\u65EFp\xBB\u1371\u0180dpt\u17A4\u17A8\u17ADot;\u6A00lus;\u6A01imes;\u6A02\u0271\u17B9\0\0\u17BEcup;\u6A06ar;\u6605riangle\u0100du\u17CD\u17D2own;\u65BDp;\u65B3plus;\u6A04e\xE5\u1444\xE5\u14ADarow;\u690D\u0180ako\u17ED\u1826\u1835\u0100cn\u17F2\u1823k\u0180lst\u17FA\u05AB\u1802ozenge;\u69EBriangle\u0200;dlr\u1812\u1813\u1818\u181D\u65B4own;\u65BEeft;\u65C2ight;\u65B8k;\u6423\u01B1\u182B\0\u1833\u01B2\u182F\0\u1831;\u6592;\u65914;\u6593ck;\u6588\u0100eo\u183E\u184D\u0100;q\u1843\u1846\uC000=\u20E5uiv;\uC000\u2261\u20E5t;\u6310\u0200ptwx\u1859\u185E\u1867\u186Cf;\uC000\u{1D553}\u0100;t\u13CB\u1863om\xBB\u13CCtie;\u62C8\u0600DHUVbdhmptuv\u1885\u1896\u18AA\u18BB\u18D7\u18DB\u18EC\u18FF\u1905\u190A\u1910\u1921\u0200LRlr\u188E\u1890\u1892\u1894;\u6557;\u6554;\u6556;\u6553\u0280;DUdu\u18A1\u18A2\u18A4\u18A6\u18A8\u6550;\u6566;\u6569;\u6564;\u6567\u0200LRlr\u18B3\u18B5\u18B7\u18B9;\u655D;\u655A;\u655C;\u6559\u0380;HLRhlr\u18CA\u18CB\u18CD\u18CF\u18D1\u18D3\u18D5\u6551;\u656C;\u6563;\u6560;\u656B;\u6562;\u655Fox;\u69C9\u0200LRlr\u18E4\u18E6\u18E8\u18EA;\u6555;\u6552;\u6510;\u650C\u0280;DUdu\u06BD\u18F7\u18F9\u18FB\u18FD;\u6565;\u6568;\u652C;\u6534inus;\u629Flus;\u629Eimes;\u62A0\u0200LRlr\u1919\u191B\u191D\u191F;\u655B;\u6558;\u6518;\u6514\u0380;HLRhlr\u1930\u1931\u1933\u1935\u1937\u1939\u193B\u6502;\u656A;\u6561;\u655E;\u653C;\u6524;\u651C\u0100ev\u0123\u1942bar\u803B\xA6\u40A6\u0200ceio\u1951\u1956\u195A\u1960r;\uC000\u{1D4B7}mi;\u604Fm\u0100;e\u171A\u171Cl\u0180;bh\u1968\u1969\u196B\u405C;\u69C5sub;\u67C8\u016C\u1974\u197El\u0100;e\u1979\u197A\u6022t\xBB\u197Ap\u0180;Ee\u012F\u1985\u1987;\u6AAE\u0100;q\u06DC\u06DB\u0CE1\u19A7\0\u19E8\u1A11\u1A15\u1A32\0\u1A37\u1A50\0\0\u1AB4\0\0\u1AC1\0\0\u1B21\u1B2E\u1B4D\u1B52\0\u1BFD\0\u1C0C\u0180cpr\u19AD\u19B2\u19DDute;\u4107\u0300;abcds\u19BF\u19C0\u19C4\u19CA\u19D5\u19D9\u6229nd;\u6A44rcup;\u6A49\u0100au\u19CF\u19D2p;\u6A4Bp;\u6A47ot;\u6A40;\uC000\u2229\uFE00\u0100eo\u19E2\u19E5t;\u6041\xEE\u0693\u0200aeiu\u19F0\u19FB\u1A01\u1A05\u01F0\u19F5\0\u19F8s;\u6A4Don;\u410Ddil\u803B\xE7\u40E7rc;\u4109ps\u0100;s\u1A0C\u1A0D\u6A4Cm;\u6A50ot;\u410B\u0180dmn\u1A1B\u1A20\u1A26il\u80BB\xB8\u01ADptyv;\u69B2t\u8100\xA2;e\u1A2D\u1A2E\u40A2r\xE4\u01B2r;\uC000\u{1D520}\u0180cei\u1A3D\u1A40\u1A4Dy;\u4447ck\u0100;m\u1A47\u1A48\u6713ark\xBB\u1A48;\u43C7r\u0380;Ecefms\u1A5F\u1A60\u1A62\u1A6B\u1AA4\u1AAA\u1AAE\u65CB;\u69C3\u0180;el\u1A69\u1A6A\u1A6D\u42C6q;\u6257e\u0261\u1A74\0\0\u1A88rrow\u0100lr\u1A7C\u1A81eft;\u61BAight;\u61BB\u0280RSacd\u1A92\u1A94\u1A96\u1A9A\u1A9F\xBB\u0F47;\u64C8st;\u629Birc;\u629Aash;\u629Dnint;\u6A10id;\u6AEFcir;\u69C2ubs\u0100;u\u1ABB\u1ABC\u6663it\xBB\u1ABC\u02EC\u1AC7\u1AD4\u1AFA\0\u1B0Aon\u0100;e\u1ACD\u1ACE\u403A\u0100;q\xC7\xC6\u026D\u1AD9\0\0\u1AE2a\u0100;t\u1ADE\u1ADF\u402C;\u4040\u0180;fl\u1AE8\u1AE9\u1AEB\u6201\xEE\u1160e\u0100mx\u1AF1\u1AF6ent\xBB\u1AE9e\xF3\u024D\u01E7\u1AFE\0\u1B07\u0100;d\u12BB\u1B02ot;\u6A6Dn\xF4\u0246\u0180fry\u1B10\u1B14\u1B17;\uC000\u{1D554}o\xE4\u0254\u8100\xA9;s\u0155\u1B1Dr;\u6117\u0100ao\u1B25\u1B29rr;\u61B5ss;\u6717\u0100cu\u1B32\u1B37r;\uC000\u{1D4B8}\u0100bp\u1B3C\u1B44\u0100;e\u1B41\u1B42\u6ACF;\u6AD1\u0100;e\u1B49\u1B4A\u6AD0;\u6AD2dot;\u62EF\u0380delprvw\u1B60\u1B6C\u1B77\u1B82\u1BAC\u1BD4\u1BF9arr\u0100lr\u1B68\u1B6A;\u6938;\u6935\u0270\u1B72\0\0\u1B75r;\u62DEc;\u62DFarr\u0100;p\u1B7F\u1B80\u61B6;\u693D\u0300;bcdos\u1B8F\u1B90\u1B96\u1BA1\u1BA5\u1BA8\u622Arcap;\u6A48\u0100au\u1B9B\u1B9Ep;\u6A46p;\u6A4Aot;\u628Dr;\u6A45;\uC000\u222A\uFE00\u0200alrv\u1BB5\u1BBF\u1BDE\u1BE3rr\u0100;m\u1BBC\u1BBD\u61B7;\u693Cy\u0180evw\u1BC7\u1BD4\u1BD8q\u0270\u1BCE\0\0\u1BD2re\xE3\u1B73u\xE3\u1B75ee;\u62CEedge;\u62CFen\u803B\xA4\u40A4earrow\u0100lr\u1BEE\u1BF3eft\xBB\u1B80ight\xBB\u1BBDe\xE4\u1BDD\u0100ci\u1C01\u1C07onin\xF4\u01F7nt;\u6231lcty;\u632D\u0980AHabcdefhijlorstuwz\u1C38\u1C3B\u1C3F\u1C5D\u1C69\u1C75\u1C8A\u1C9E\u1CAC\u1CB7\u1CFB\u1CFF\u1D0D\u1D7B\u1D91\u1DAB\u1DBB\u1DC6\u1DCDr\xF2\u0381ar;\u6965\u0200glrs\u1C48\u1C4D\u1C52\u1C54ger;\u6020eth;\u6138\xF2\u1133h\u0100;v\u1C5A\u1C5B\u6010\xBB\u090A\u016B\u1C61\u1C67arow;\u690Fa\xE3\u0315\u0100ay\u1C6E\u1C73ron;\u410F;\u4434\u0180;ao\u0332\u1C7C\u1C84\u0100gr\u02BF\u1C81r;\u61CAtseq;\u6A77\u0180glm\u1C91\u1C94\u1C98\u803B\xB0\u40B0ta;\u43B4ptyv;\u69B1\u0100ir\u1CA3\u1CA8sht;\u697F;\uC000\u{1D521}ar\u0100lr\u1CB3\u1CB5\xBB\u08DC\xBB\u101E\u0280aegsv\u1CC2\u0378\u1CD6\u1CDC\u1CE0m\u0180;os\u0326\u1CCA\u1CD4nd\u0100;s\u0326\u1CD1uit;\u6666amma;\u43DDin;\u62F2\u0180;io\u1CE7\u1CE8\u1CF8\u40F7de\u8100\xF7;o\u1CE7\u1CF0ntimes;\u62C7n\xF8\u1CF7cy;\u4452c\u026F\u1D06\0\0\u1D0Arn;\u631Eop;\u630D\u0280lptuw\u1D18\u1D1D\u1D22\u1D49\u1D55lar;\u4024f;\uC000\u{1D555}\u0280;emps\u030B\u1D2D\u1D37\u1D3D\u1D42q\u0100;d\u0352\u1D33ot;\u6251inus;\u6238lus;\u6214quare;\u62A1blebarwedg\xE5\xFAn\u0180adh\u112E\u1D5D\u1D67ownarrow\xF3\u1C83arpoon\u0100lr\u1D72\u1D76ef\xF4\u1CB4igh\xF4\u1CB6\u0162\u1D7F\u1D85karo\xF7\u0F42\u026F\u1D8A\0\0\u1D8Ern;\u631Fop;\u630C\u0180cot\u1D98\u1DA3\u1DA6\u0100ry\u1D9D\u1DA1;\uC000\u{1D4B9};\u4455l;\u69F6rok;\u4111\u0100dr\u1DB0\u1DB4ot;\u62F1i\u0100;f\u1DBA\u1816\u65BF\u0100ah\u1DC0\u1DC3r\xF2\u0429a\xF2\u0FA6angle;\u69A6\u0100ci\u1DD2\u1DD5y;\u445Fgrarr;\u67FF\u0900Dacdefglmnopqrstux\u1E01\u1E09\u1E19\u1E38\u0578\u1E3C\u1E49\u1E61\u1E7E\u1EA5\u1EAF\u1EBD\u1EE1\u1F2A\u1F37\u1F44\u1F4E\u1F5A\u0100Do\u1E06\u1D34o\xF4\u1C89\u0100cs\u1E0E\u1E14ute\u803B\xE9\u40E9ter;\u6A6E\u0200aioy\u1E22\u1E27\u1E31\u1E36ron;\u411Br\u0100;c\u1E2D\u1E2E\u6256\u803B\xEA\u40EAlon;\u6255;\u444Dot;\u4117\u0100Dr\u1E41\u1E45ot;\u6252;\uC000\u{1D522}\u0180;rs\u1E50\u1E51\u1E57\u6A9Aave\u803B\xE8\u40E8\u0100;d\u1E5C\u1E5D\u6A96ot;\u6A98\u0200;ils\u1E6A\u1E6B\u1E72\u1E74\u6A99nters;\u63E7;\u6113\u0100;d\u1E79\u1E7A\u6A95ot;\u6A97\u0180aps\u1E85\u1E89\u1E97cr;\u4113ty\u0180;sv\u1E92\u1E93\u1E95\u6205et\xBB\u1E93p\u01001;\u1E9D\u1EA4\u0133\u1EA1\u1EA3;\u6004;\u6005\u6003\u0100gs\u1EAA\u1EAC;\u414Bp;\u6002\u0100gp\u1EB4\u1EB8on;\u4119f;\uC000\u{1D556}\u0180als\u1EC4\u1ECE\u1ED2r\u0100;s\u1ECA\u1ECB\u62D5l;\u69E3us;\u6A71i\u0180;lv\u1EDA\u1EDB\u1EDF\u43B5on\xBB\u1EDB;\u43F5\u0200csuv\u1EEA\u1EF3\u1F0B\u1F23\u0100io\u1EEF\u1E31rc\xBB\u1E2E\u0269\u1EF9\0\0\u1EFB\xED\u0548ant\u0100gl\u1F02\u1F06tr\xBB\u1E5Dess\xBB\u1E7A\u0180aei\u1F12\u1F16\u1F1Als;\u403Dst;\u625Fv\u0100;D\u0235\u1F20D;\u6A78parsl;\u69E5\u0100Da\u1F2F\u1F33ot;\u6253rr;\u6971\u0180cdi\u1F3E\u1F41\u1EF8r;\u612Fo\xF4\u0352\u0100ah\u1F49\u1F4B;\u43B7\u803B\xF0\u40F0\u0100mr\u1F53\u1F57l\u803B\xEB\u40EBo;\u60AC\u0180cip\u1F61\u1F64\u1F67l;\u4021s\xF4\u056E\u0100eo\u1F6C\u1F74ctatio\xEE\u0559nential\xE5\u0579\u09E1\u1F92\0\u1F9E\0\u1FA1\u1FA7\0\0\u1FC6\u1FCC\0\u1FD3\0\u1FE6\u1FEA\u2000\0\u2008\u205Allingdotse\xF1\u1E44y;\u4444male;\u6640\u0180ilr\u1FAD\u1FB3\u1FC1lig;\u8000\uFB03\u0269\u1FB9\0\0\u1FBDg;\u8000\uFB00ig;\u8000\uFB04;\uC000\u{1D523}lig;\u8000\uFB01lig;\uC000fj\u0180alt\u1FD9\u1FDC\u1FE1t;\u666Dig;\u8000\uFB02ns;\u65B1of;\u4192\u01F0\u1FEE\0\u1FF3f;\uC000\u{1D557}\u0100ak\u05BF\u1FF7\u0100;v\u1FFC\u1FFD\u62D4;\u6AD9artint;\u6A0D\u0100ao\u200C\u2055\u0100cs\u2011\u2052\u03B1\u201A\u2030\u2038\u2045\u2048\0\u2050\u03B2\u2022\u2025\u2027\u202A\u202C\0\u202E\u803B\xBD\u40BD;\u6153\u803B\xBC\u40BC;\u6155;\u6159;\u615B\u01B3\u2034\0\u2036;\u6154;\u6156\u02B4\u203E\u2041\0\0\u2043\u803B\xBE\u40BE;\u6157;\u615C5;\u6158\u01B6\u204C\0\u204E;\u615A;\u615D8;\u615El;\u6044wn;\u6322cr;\uC000\u{1D4BB}\u0880Eabcdefgijlnorstv\u2082\u2089\u209F\u20A5\u20B0\u20B4\u20F0\u20F5\u20FA\u20FF\u2103\u2112\u2138\u0317\u213E\u2152\u219E\u0100;l\u064D\u2087;\u6A8C\u0180cmp\u2090\u2095\u209Dute;\u41F5ma\u0100;d\u209C\u1CDA\u43B3;\u6A86reve;\u411F\u0100iy\u20AA\u20AErc;\u411D;\u4433ot;\u4121\u0200;lqs\u063E\u0642\u20BD\u20C9\u0180;qs\u063E\u064C\u20C4lan\xF4\u0665\u0200;cdl\u0665\u20D2\u20D5\u20E5c;\u6AA9ot\u0100;o\u20DC\u20DD\u6A80\u0100;l\u20E2\u20E3\u6A82;\u6A84\u0100;e\u20EA\u20ED\uC000\u22DB\uFE00s;\u6A94r;\uC000\u{1D524}\u0100;g\u0673\u061Bmel;\u6137cy;\u4453\u0200;Eaj\u065A\u210C\u210E\u2110;\u6A92;\u6AA5;\u6AA4\u0200Eaes\u211B\u211D\u2129\u2134;\u6269p\u0100;p\u2123\u2124\u6A8Arox\xBB\u2124\u0100;q\u212E\u212F\u6A88\u0100;q\u212E\u211Bim;\u62E7pf;\uC000\u{1D558}\u0100ci\u2143\u2146r;\u610Am\u0180;el\u066B\u214E\u2150;\u6A8E;\u6A90\u8300>;cdlqr\u05EE\u2160\u216A\u216E\u2173\u2179\u0100ci\u2165\u2167;\u6AA7r;\u6A7Aot;\u62D7Par;\u6995uest;\u6A7C\u0280adels\u2184\u216A\u2190\u0656\u219B\u01F0\u2189\0\u218Epro\xF8\u209Er;\u6978q\u0100lq\u063F\u2196les\xF3\u2088i\xED\u066B\u0100en\u21A3\u21ADrtneqq;\uC000\u2269\uFE00\xC5\u21AA\u0500Aabcefkosy\u21C4\u21C7\u21F1\u21F5\u21FA\u2218\u221D\u222F\u2268\u227Dr\xF2\u03A0\u0200ilmr\u21D0\u21D4\u21D7\u21DBrs\xF0\u1484f\xBB\u2024il\xF4\u06A9\u0100dr\u21E0\u21E4cy;\u444A\u0180;cw\u08F4\u21EB\u21EFir;\u6948;\u61ADar;\u610Firc;\u4125\u0180alr\u2201\u220E\u2213rts\u0100;u\u2209\u220A\u6665it\xBB\u220Alip;\u6026con;\u62B9r;\uC000\u{1D525}s\u0100ew\u2223\u2229arow;\u6925arow;\u6926\u0280amopr\u223A\u223E\u2243\u225E\u2263rr;\u61FFtht;\u623Bk\u0100lr\u2249\u2253eftarrow;\u61A9ightarrow;\u61AAf;\uC000\u{1D559}bar;\u6015\u0180clt\u226F\u2274\u2278r;\uC000\u{1D4BD}as\xE8\u21F4rok;\u4127\u0100bp\u2282\u2287ull;\u6043hen\xBB\u1C5B\u0AE1\u22A3\0\u22AA\0\u22B8\u22C5\u22CE\0\u22D5\u22F3\0\0\u22F8\u2322\u2367\u2362\u237F\0\u2386\u23AA\u23B4cute\u803B\xED\u40ED\u0180;iy\u0771\u22B0\u22B5rc\u803B\xEE\u40EE;\u4438\u0100cx\u22BC\u22BFy;\u4435cl\u803B\xA1\u40A1\u0100fr\u039F\u22C9;\uC000\u{1D526}rave\u803B\xEC\u40EC\u0200;ino\u073E\u22DD\u22E9\u22EE\u0100in\u22E2\u22E6nt;\u6A0Ct;\u622Dfin;\u69DCta;\u6129lig;\u4133\u0180aop\u22FE\u231A\u231D\u0180cgt\u2305\u2308\u2317r;\u412B\u0180elp\u071F\u230F\u2313in\xE5\u078Ear\xF4\u0720h;\u4131f;\u62B7ed;\u41B5\u0280;cfot\u04F4\u232C\u2331\u233D\u2341are;\u6105in\u0100;t\u2338\u2339\u621Eie;\u69DDdo\xF4\u2319\u0280;celp\u0757\u234C\u2350\u235B\u2361al;\u62BA\u0100gr\u2355\u2359er\xF3\u1563\xE3\u234Darhk;\u6A17rod;\u6A3C\u0200cgpt\u236F\u2372\u2376\u237By;\u4451on;\u412Ff;\uC000\u{1D55A}a;\u43B9uest\u803B\xBF\u40BF\u0100ci\u238A\u238Fr;\uC000\u{1D4BE}n\u0280;Edsv\u04F4\u239B\u239D\u23A1\u04F3;\u62F9ot;\u62F5\u0100;v\u23A6\u23A7\u62F4;\u62F3\u0100;i\u0777\u23AElde;\u4129\u01EB\u23B8\0\u23BCcy;\u4456l\u803B\xEF\u40EF\u0300cfmosu\u23CC\u23D7\u23DC\u23E1\u23E7\u23F5\u0100iy\u23D1\u23D5rc;\u4135;\u4439r;\uC000\u{1D527}ath;\u4237pf;\uC000\u{1D55B}\u01E3\u23EC\0\u23F1r;\uC000\u{1D4BF}rcy;\u4458kcy;\u4454\u0400acfghjos\u240B\u2416\u2422\u2427\u242D\u2431\u2435\u243Bppa\u0100;v\u2413\u2414\u43BA;\u43F0\u0100ey\u241B\u2420dil;\u4137;\u443Ar;\uC000\u{1D528}reen;\u4138cy;\u4445cy;\u445Cpf;\uC000\u{1D55C}cr;\uC000\u{1D4C0}\u0B80ABEHabcdefghjlmnoprstuv\u2470\u2481\u2486\u248D\u2491\u250E\u253D\u255A\u2580\u264E\u265E\u2665\u2679\u267D\u269A\u26B2\u26D8\u275D\u2768\u278B\u27C0\u2801\u2812\u0180art\u2477\u247A\u247Cr\xF2\u09C6\xF2\u0395ail;\u691Barr;\u690E\u0100;g\u0994\u248B;\u6A8Bar;\u6962\u0963\u24A5\0\u24AA\0\u24B1\0\0\0\0\0\u24B5\u24BA\0\u24C6\u24C8\u24CD\0\u24F9ute;\u413Amptyv;\u69B4ra\xEE\u084Cbda;\u43BBg\u0180;dl\u088E\u24C1\u24C3;\u6991\xE5\u088E;\u6A85uo\u803B\xAB\u40ABr\u0400;bfhlpst\u0899\u24DE\u24E6\u24E9\u24EB\u24EE\u24F1\u24F5\u0100;f\u089D\u24E3s;\u691Fs;\u691D\xEB\u2252p;\u61ABl;\u6939im;\u6973l;\u61A2\u0180;ae\u24FF\u2500\u2504\u6AABil;\u6919\u0100;s\u2509\u250A\u6AAD;\uC000\u2AAD\uFE00\u0180abr\u2515\u2519\u251Drr;\u690Crk;\u6772\u0100ak\u2522\u252Cc\u0100ek\u2528\u252A;\u407B;\u405B\u0100es\u2531\u2533;\u698Bl\u0100du\u2539\u253B;\u698F;\u698D\u0200aeuy\u2546\u254B\u2556\u2558ron;\u413E\u0100di\u2550\u2554il;\u413C\xEC\u08B0\xE2\u2529;\u443B\u0200cqrs\u2563\u2566\u256D\u257Da;\u6936uo\u0100;r\u0E19\u1746\u0100du\u2572\u2577har;\u6967shar;\u694Bh;\u61B2\u0280;fgqs\u258B\u258C\u0989\u25F3\u25FF\u6264t\u0280ahlrt\u2598\u25A4\u25B7\u25C2\u25E8rrow\u0100;t\u0899\u25A1a\xE9\u24F6arpoon\u0100du\u25AF\u25B4own\xBB\u045Ap\xBB\u0966eftarrows;\u61C7ight\u0180ahs\u25CD\u25D6\u25DErrow\u0100;s\u08F4\u08A7arpoon\xF3\u0F98quigarro\xF7\u21F0hreetimes;\u62CB\u0180;qs\u258B\u0993\u25FAlan\xF4\u09AC\u0280;cdgs\u09AC\u260A\u260D\u261D\u2628c;\u6AA8ot\u0100;o\u2614\u2615\u6A7F\u0100;r\u261A\u261B\u6A81;\u6A83\u0100;e\u2622\u2625\uC000\u22DA\uFE00s;\u6A93\u0280adegs\u2633\u2639\u263D\u2649\u264Bppro\xF8\u24C6ot;\u62D6q\u0100gq\u2643\u2645\xF4\u0989gt\xF2\u248C\xF4\u099Bi\xED\u09B2\u0180ilr\u2655\u08E1\u265Asht;\u697C;\uC000\u{1D529}\u0100;E\u099C\u2663;\u6A91\u0161\u2669\u2676r\u0100du\u25B2\u266E\u0100;l\u0965\u2673;\u696Alk;\u6584cy;\u4459\u0280;acht\u0A48\u2688\u268B\u2691\u2696r\xF2\u25C1orne\xF2\u1D08ard;\u696Bri;\u65FA\u0100io\u269F\u26A4dot;\u4140ust\u0100;a\u26AC\u26AD\u63B0che\xBB\u26AD\u0200Eaes\u26BB\u26BD\u26C9\u26D4;\u6268p\u0100;p\u26C3\u26C4\u6A89rox\xBB\u26C4\u0100;q\u26CE\u26CF\u6A87\u0100;q\u26CE\u26BBim;\u62E6\u0400abnoptwz\u26E9\u26F4\u26F7\u271A\u272F\u2741\u2747\u2750\u0100nr\u26EE\u26F1g;\u67ECr;\u61FDr\xEB\u08C1g\u0180lmr\u26FF\u270D\u2714eft\u0100ar\u09E6\u2707ight\xE1\u09F2apsto;\u67FCight\xE1\u09FDparrow\u0100lr\u2725\u2729ef\xF4\u24EDight;\u61AC\u0180afl\u2736\u2739\u273Dr;\u6985;\uC000\u{1D55D}us;\u6A2Dimes;\u6A34\u0161\u274B\u274Fst;\u6217\xE1\u134E\u0180;ef\u2757\u2758\u1800\u65CAnge\xBB\u2758ar\u0100;l\u2764\u2765\u4028t;\u6993\u0280achmt\u2773\u2776\u277C\u2785\u2787r\xF2\u08A8orne\xF2\u1D8Car\u0100;d\u0F98\u2783;\u696D;\u600Eri;\u62BF\u0300achiqt\u2798\u279D\u0A40\u27A2\u27AE\u27BBquo;\u6039r;\uC000\u{1D4C1}m\u0180;eg\u09B2\u27AA\u27AC;\u6A8D;\u6A8F\u0100bu\u252A\u27B3o\u0100;r\u0E1F\u27B9;\u601Arok;\u4142\u8400<;cdhilqr\u082B\u27D2\u2639\u27DC\u27E0\u27E5\u27EA\u27F0\u0100ci\u27D7\u27D9;\u6AA6r;\u6A79re\xE5\u25F2mes;\u62C9arr;\u6976uest;\u6A7B\u0100Pi\u27F5\u27F9ar;\u6996\u0180;ef\u2800\u092D\u181B\u65C3r\u0100du\u2807\u280Dshar;\u694Ahar;\u6966\u0100en\u2817\u2821rtneqq;\uC000\u2268\uFE00\xC5\u281E\u0700Dacdefhilnopsu\u2840\u2845\u2882\u288E\u2893\u28A0\u28A5\u28A8\u28DA\u28E2\u28E4\u0A83\u28F3\u2902Dot;\u623A\u0200clpr\u284E\u2852\u2863\u287Dr\u803B\xAF\u40AF\u0100et\u2857\u2859;\u6642\u0100;e\u285E\u285F\u6720se\xBB\u285F\u0100;s\u103B\u2868to\u0200;dlu\u103B\u2873\u2877\u287Bow\xEE\u048Cef\xF4\u090F\xF0\u13D1ker;\u65AE\u0100oy\u2887\u288Cmma;\u6A29;\u443Cash;\u6014asuredangle\xBB\u1626r;\uC000\u{1D52A}o;\u6127\u0180cdn\u28AF\u28B4\u28C9ro\u803B\xB5\u40B5\u0200;acd\u1464\u28BD\u28C0\u28C4s\xF4\u16A7ir;\u6AF0ot\u80BB\xB7\u01B5us\u0180;bd\u28D2\u1903\u28D3\u6212\u0100;u\u1D3C\u28D8;\u6A2A\u0163\u28DE\u28E1p;\u6ADB\xF2\u2212\xF0\u0A81\u0100dp\u28E9\u28EEels;\u62A7f;\uC000\u{1D55E}\u0100ct\u28F8\u28FDr;\uC000\u{1D4C2}pos\xBB\u159D\u0180;lm\u2909\u290A\u290D\u43BCtimap;\u62B8\u0C00GLRVabcdefghijlmoprstuvw\u2942\u2953\u297E\u2989\u2998\u29DA\u29E9\u2A15\u2A1A\u2A58\u2A5D\u2A83\u2A95\u2AA4\u2AA8\u2B04\u2B07\u2B44\u2B7F\u2BAE\u2C34\u2C67\u2C7C\u2CE9\u0100gt\u2947\u294B;\uC000\u22D9\u0338\u0100;v\u2950\u0BCF\uC000\u226B\u20D2\u0180elt\u295A\u2972\u2976ft\u0100ar\u2961\u2967rrow;\u61CDightarrow;\u61CE;\uC000\u22D8\u0338\u0100;v\u297B\u0C47\uC000\u226A\u20D2ightarrow;\u61CF\u0100Dd\u298E\u2993ash;\u62AFash;\u62AE\u0280bcnpt\u29A3\u29A7\u29AC\u29B1\u29CCla\xBB\u02DEute;\u4144g;\uC000\u2220\u20D2\u0280;Eiop\u0D84\u29BC\u29C0\u29C5\u29C8;\uC000\u2A70\u0338d;\uC000\u224B\u0338s;\u4149ro\xF8\u0D84ur\u0100;a\u29D3\u29D4\u666El\u0100;s\u29D3\u0B38\u01F3\u29DF\0\u29E3p\u80BB\xA0\u0B37mp\u0100;e\u0BF9\u0C00\u0280aeouy\u29F4\u29FE\u2A03\u2A10\u2A13\u01F0\u29F9\0\u29FB;\u6A43on;\u4148dil;\u4146ng\u0100;d\u0D7E\u2A0Aot;\uC000\u2A6D\u0338p;\u6A42;\u443Dash;\u6013\u0380;Aadqsx\u0B92\u2A29\u2A2D\u2A3B\u2A41\u2A45\u2A50rr;\u61D7r\u0100hr\u2A33\u2A36k;\u6924\u0100;o\u13F2\u13F0ot;\uC000\u2250\u0338ui\xF6\u0B63\u0100ei\u2A4A\u2A4Ear;\u6928\xED\u0B98ist\u0100;s\u0BA0\u0B9Fr;\uC000\u{1D52B}\u0200Eest\u0BC5\u2A66\u2A79\u2A7C\u0180;qs\u0BBC\u2A6D\u0BE1\u0180;qs\u0BBC\u0BC5\u2A74lan\xF4\u0BE2i\xED\u0BEA\u0100;r\u0BB6\u2A81\xBB\u0BB7\u0180Aap\u2A8A\u2A8D\u2A91r\xF2\u2971rr;\u61AEar;\u6AF2\u0180;sv\u0F8D\u2A9C\u0F8C\u0100;d\u2AA1\u2AA2\u62FC;\u62FAcy;\u445A\u0380AEadest\u2AB7\u2ABA\u2ABE\u2AC2\u2AC5\u2AF6\u2AF9r\xF2\u2966;\uC000\u2266\u0338rr;\u619Ar;\u6025\u0200;fqs\u0C3B\u2ACE\u2AE3\u2AEFt\u0100ar\u2AD4\u2AD9rro\xF7\u2AC1ightarro\xF7\u2A90\u0180;qs\u0C3B\u2ABA\u2AEAlan\xF4\u0C55\u0100;s\u0C55\u2AF4\xBB\u0C36i\xED\u0C5D\u0100;r\u0C35\u2AFEi\u0100;e\u0C1A\u0C25i\xE4\u0D90\u0100pt\u2B0C\u2B11f;\uC000\u{1D55F}\u8180\xAC;in\u2B19\u2B1A\u2B36\u40ACn\u0200;Edv\u0B89\u2B24\u2B28\u2B2E;\uC000\u22F9\u0338ot;\uC000\u22F5\u0338\u01E1\u0B89\u2B33\u2B35;\u62F7;\u62F6i\u0100;v\u0CB8\u2B3C\u01E1\u0CB8\u2B41\u2B43;\u62FE;\u62FD\u0180aor\u2B4B\u2B63\u2B69r\u0200;ast\u0B7B\u2B55\u2B5A\u2B5Flle\xEC\u0B7Bl;\uC000\u2AFD\u20E5;\uC000\u2202\u0338lint;\u6A14\u0180;ce\u0C92\u2B70\u2B73u\xE5\u0CA5\u0100;c\u0C98\u2B78\u0100;e\u0C92\u2B7D\xF1\u0C98\u0200Aait\u2B88\u2B8B\u2B9D\u2BA7r\xF2\u2988rr\u0180;cw\u2B94\u2B95\u2B99\u619B;\uC000\u2933\u0338;\uC000\u219D\u0338ghtarrow\xBB\u2B95ri\u0100;e\u0CCB\u0CD6\u0380chimpqu\u2BBD\u2BCD\u2BD9\u2B04\u0B78\u2BE4\u2BEF\u0200;cer\u0D32\u2BC6\u0D37\u2BC9u\xE5\u0D45;\uC000\u{1D4C3}ort\u026D\u2B05\0\0\u2BD6ar\xE1\u2B56m\u0100;e\u0D6E\u2BDF\u0100;q\u0D74\u0D73su\u0100bp\u2BEB\u2BED\xE5\u0CF8\xE5\u0D0B\u0180bcp\u2BF6\u2C11\u2C19\u0200;Ees\u2BFF\u2C00\u0D22\u2C04\u6284;\uC000\u2AC5\u0338et\u0100;e\u0D1B\u2C0Bq\u0100;q\u0D23\u2C00c\u0100;e\u0D32\u2C17\xF1\u0D38\u0200;Ees\u2C22\u2C23\u0D5F\u2C27\u6285;\uC000\u2AC6\u0338et\u0100;e\u0D58\u2C2Eq\u0100;q\u0D60\u2C23\u0200gilr\u2C3D\u2C3F\u2C45\u2C47\xEC\u0BD7lde\u803B\xF1\u40F1\xE7\u0C43iangle\u0100lr\u2C52\u2C5Ceft\u0100;e\u0C1A\u2C5A\xF1\u0C26ight\u0100;e\u0CCB\u2C65\xF1\u0CD7\u0100;m\u2C6C\u2C6D\u43BD\u0180;es\u2C74\u2C75\u2C79\u4023ro;\u6116p;\u6007\u0480DHadgilrs\u2C8F\u2C94\u2C99\u2C9E\u2CA3\u2CB0\u2CB6\u2CD3\u2CE3ash;\u62ADarr;\u6904p;\uC000\u224D\u20D2ash;\u62AC\u0100et\u2CA8\u2CAC;\uC000\u2265\u20D2;\uC000>\u20D2nfin;\u69DE\u0180Aet\u2CBD\u2CC1\u2CC5rr;\u6902;\uC000\u2264\u20D2\u0100;r\u2CCA\u2CCD\uC000<\u20D2ie;\uC000\u22B4\u20D2\u0100At\u2CD8\u2CDCrr;\u6903rie;\uC000\u22B5\u20D2im;\uC000\u223C\u20D2\u0180Aan\u2CF0\u2CF4\u2D02rr;\u61D6r\u0100hr\u2CFA\u2CFDk;\u6923\u0100;o\u13E7\u13E5ear;\u6927\u1253\u1A95\0\0\0\0\0\0\0\0\0\0\0\0\0\u2D2D\0\u2D38\u2D48\u2D60\u2D65\u2D72\u2D84\u1B07\0\0\u2D8D\u2DAB\0\u2DC8\u2DCE\0\u2DDC\u2E19\u2E2B\u2E3E\u2E43\u0100cs\u2D31\u1A97ute\u803B\xF3\u40F3\u0100iy\u2D3C\u2D45r\u0100;c\u1A9E\u2D42\u803B\xF4\u40F4;\u443E\u0280abios\u1AA0\u2D52\u2D57\u01C8\u2D5Alac;\u4151v;\u6A38old;\u69BClig;\u4153\u0100cr\u2D69\u2D6Dir;\u69BF;\uC000\u{1D52C}\u036F\u2D79\0\0\u2D7C\0\u2D82n;\u42DBave\u803B\xF2\u40F2;\u69C1\u0100bm\u2D88\u0DF4ar;\u69B5\u0200acit\u2D95\u2D98\u2DA5\u2DA8r\xF2\u1A80\u0100ir\u2D9D\u2DA0r;\u69BEoss;\u69BBn\xE5\u0E52;\u69C0\u0180aei\u2DB1\u2DB5\u2DB9cr;\u414Dga;\u43C9\u0180cdn\u2DC0\u2DC5\u01CDron;\u43BF;\u69B6pf;\uC000\u{1D560}\u0180ael\u2DD4\u2DD7\u01D2r;\u69B7rp;\u69B9\u0380;adiosv\u2DEA\u2DEB\u2DEE\u2E08\u2E0D\u2E10\u2E16\u6228r\xF2\u1A86\u0200;efm\u2DF7\u2DF8\u2E02\u2E05\u6A5Dr\u0100;o\u2DFE\u2DFF\u6134f\xBB\u2DFF\u803B\xAA\u40AA\u803B\xBA\u40BAgof;\u62B6r;\u6A56lope;\u6A57;\u6A5B\u0180clo\u2E1F\u2E21\u2E27\xF2\u2E01ash\u803B\xF8\u40F8l;\u6298i\u016C\u2E2F\u2E34de\u803B\xF5\u40F5es\u0100;a\u01DB\u2E3As;\u6A36ml\u803B\xF6\u40F6bar;\u633D\u0AE1\u2E5E\0\u2E7D\0\u2E80\u2E9D\0\u2EA2\u2EB9\0\0\u2ECB\u0E9C\0\u2F13\0\0\u2F2B\u2FBC\0\u2FC8r\u0200;ast\u0403\u2E67\u2E72\u0E85\u8100\xB6;l\u2E6D\u2E6E\u40B6le\xEC\u0403\u0269\u2E78\0\0\u2E7Bm;\u6AF3;\u6AFDy;\u443Fr\u0280cimpt\u2E8B\u2E8F\u2E93\u1865\u2E97nt;\u4025od;\u402Eil;\u6030enk;\u6031r;\uC000\u{1D52D}\u0180imo\u2EA8\u2EB0\u2EB4\u0100;v\u2EAD\u2EAE\u43C6;\u43D5ma\xF4\u0A76ne;\u660E\u0180;tv\u2EBF\u2EC0\u2EC8\u43C0chfork\xBB\u1FFD;\u43D6\u0100au\u2ECF\u2EDFn\u0100ck\u2ED5\u2EDDk\u0100;h\u21F4\u2EDB;\u610E\xF6\u21F4s\u0480;abcdemst\u2EF3\u2EF4\u1908\u2EF9\u2EFD\u2F04\u2F06\u2F0A\u2F0E\u402Bcir;\u6A23ir;\u6A22\u0100ou\u1D40\u2F02;\u6A25;\u6A72n\u80BB\xB1\u0E9Dim;\u6A26wo;\u6A27\u0180ipu\u2F19\u2F20\u2F25ntint;\u6A15f;\uC000\u{1D561}nd\u803B\xA3\u40A3\u0500;Eaceinosu\u0EC8\u2F3F\u2F41\u2F44\u2F47\u2F81\u2F89\u2F92\u2F7E\u2FB6;\u6AB3p;\u6AB7u\xE5\u0ED9\u0100;c\u0ECE\u2F4C\u0300;acens\u0EC8\u2F59\u2F5F\u2F66\u2F68\u2F7Eppro\xF8\u2F43urlye\xF1\u0ED9\xF1\u0ECE\u0180aes\u2F6F\u2F76\u2F7Approx;\u6AB9qq;\u6AB5im;\u62E8i\xED\u0EDFme\u0100;s\u2F88\u0EAE\u6032\u0180Eas\u2F78\u2F90\u2F7A\xF0\u2F75\u0180dfp\u0EEC\u2F99\u2FAF\u0180als\u2FA0\u2FA5\u2FAAlar;\u632Eine;\u6312urf;\u6313\u0100;t\u0EFB\u2FB4\xEF\u0EFBrel;\u62B0\u0100ci\u2FC0\u2FC5r;\uC000\u{1D4C5};\u43C8ncsp;\u6008\u0300fiopsu\u2FDA\u22E2\u2FDF\u2FE5\u2FEB\u2FF1r;\uC000\u{1D52E}pf;\uC000\u{1D562}rime;\u6057cr;\uC000\u{1D4C6}\u0180aeo\u2FF8\u3009\u3013t\u0100ei\u2FFE\u3005rnion\xF3\u06B0nt;\u6A16st\u0100;e\u3010\u3011\u403F\xF1\u1F19\xF4\u0F14\u0A80ABHabcdefhilmnoprstux\u3040\u3051\u3055\u3059\u30E0\u310E\u312B\u3147\u3162\u3172\u318E\u3206\u3215\u3224\u3229\u3258\u326E\u3272\u3290\u32B0\u32B7\u0180art\u3047\u304A\u304Cr\xF2\u10B3\xF2\u03DDail;\u691Car\xF2\u1C65ar;\u6964\u0380cdenqrt\u3068\u3075\u3078\u307F\u308F\u3094\u30CC\u0100eu\u306D\u3071;\uC000\u223D\u0331te;\u4155i\xE3\u116Emptyv;\u69B3g\u0200;del\u0FD1\u3089\u308B\u308D;\u6992;\u69A5\xE5\u0FD1uo\u803B\xBB\u40BBr\u0580;abcfhlpstw\u0FDC\u30AC\u30AF\u30B7\u30B9\u30BC\u30BE\u30C0\u30C3\u30C7\u30CAp;\u6975\u0100;f\u0FE0\u30B4s;\u6920;\u6933s;\u691E\xEB\u225D\xF0\u272El;\u6945im;\u6974l;\u61A3;\u619D\u0100ai\u30D1\u30D5il;\u691Ao\u0100;n\u30DB\u30DC\u6236al\xF3\u0F1E\u0180abr\u30E7\u30EA\u30EEr\xF2\u17E5rk;\u6773\u0100ak\u30F3\u30FDc\u0100ek\u30F9\u30FB;\u407D;\u405D\u0100es\u3102\u3104;\u698Cl\u0100du\u310A\u310C;\u698E;\u6990\u0200aeuy\u3117\u311C\u3127\u3129ron;\u4159\u0100di\u3121\u3125il;\u4157\xEC\u0FF2\xE2\u30FA;\u4440\u0200clqs\u3134\u3137\u313D\u3144a;\u6937dhar;\u6969uo\u0100;r\u020E\u020Dh;\u61B3\u0180acg\u314E\u315F\u0F44l\u0200;ips\u0F78\u3158\u315B\u109Cn\xE5\u10BBar\xF4\u0FA9t;\u65AD\u0180ilr\u3169\u1023\u316Esht;\u697D;\uC000\u{1D52F}\u0100ao\u3177\u3186r\u0100du\u317D\u317F\xBB\u047B\u0100;l\u1091\u3184;\u696C\u0100;v\u318B\u318C\u43C1;\u43F1\u0180gns\u3195\u31F9\u31FCht\u0300ahlrst\u31A4\u31B0\u31C2\u31D8\u31E4\u31EErrow\u0100;t\u0FDC\u31ADa\xE9\u30C8arpoon\u0100du\u31BB\u31BFow\xEE\u317Ep\xBB\u1092eft\u0100ah\u31CA\u31D0rrow\xF3\u0FEAarpoon\xF3\u0551ightarrows;\u61C9quigarro\xF7\u30CBhreetimes;\u62CCg;\u42DAingdotse\xF1\u1F32\u0180ahm\u320D\u3210\u3213r\xF2\u0FEAa\xF2\u0551;\u600Foust\u0100;a\u321E\u321F\u63B1che\xBB\u321Fmid;\u6AEE\u0200abpt\u3232\u323D\u3240\u3252\u0100nr\u3237\u323Ag;\u67EDr;\u61FEr\xEB\u1003\u0180afl\u3247\u324A\u324Er;\u6986;\uC000\u{1D563}us;\u6A2Eimes;\u6A35\u0100ap\u325D\u3267r\u0100;g\u3263\u3264\u4029t;\u6994olint;\u6A12ar\xF2\u31E3\u0200achq\u327B\u3280\u10BC\u3285quo;\u603Ar;\uC000\u{1D4C7}\u0100bu\u30FB\u328Ao\u0100;r\u0214\u0213\u0180hir\u3297\u329B\u32A0re\xE5\u31F8mes;\u62CAi\u0200;efl\u32AA\u1059\u1821\u32AB\u65B9tri;\u69CEluhar;\u6968;\u611E\u0D61\u32D5\u32DB\u32DF\u332C\u3338\u3371\0\u337A\u33A4\0\0\u33EC\u33F0\0\u3428\u3448\u345A\u34AD\u34B1\u34CA\u34F1\0\u3616\0\0\u3633cute;\u415Bqu\xEF\u27BA\u0500;Eaceinpsy\u11ED\u32F3\u32F5\u32FF\u3302\u330B\u330F\u331F\u3326\u3329;\u6AB4\u01F0\u32FA\0\u32FC;\u6AB8on;\u4161u\xE5\u11FE\u0100;d\u11F3\u3307il;\u415Frc;\u415D\u0180Eas\u3316\u3318\u331B;\u6AB6p;\u6ABAim;\u62E9olint;\u6A13i\xED\u1204;\u4441ot\u0180;be\u3334\u1D47\u3335\u62C5;\u6A66\u0380Aacmstx\u3346\u334A\u3357\u335B\u335E\u3363\u336Drr;\u61D8r\u0100hr\u3350\u3352\xEB\u2228\u0100;o\u0A36\u0A34t\u803B\xA7\u40A7i;\u403Bwar;\u6929m\u0100in\u3369\xF0nu\xF3\xF1t;\u6736r\u0100;o\u3376\u2055\uC000\u{1D530}\u0200acoy\u3382\u3386\u3391\u33A0rp;\u666F\u0100hy\u338B\u338Fcy;\u4449;\u4448rt\u026D\u3399\0\0\u339Ci\xE4\u1464ara\xEC\u2E6F\u803B\xAD\u40AD\u0100gm\u33A8\u33B4ma\u0180;fv\u33B1\u33B2\u33B2\u43C3;\u43C2\u0400;deglnpr\u12AB\u33C5\u33C9\u33CE\u33D6\u33DE\u33E1\u33E6ot;\u6A6A\u0100;q\u12B1\u12B0\u0100;E\u33D3\u33D4\u6A9E;\u6AA0\u0100;E\u33DB\u33DC\u6A9D;\u6A9Fe;\u6246lus;\u6A24arr;\u6972ar\xF2\u113D\u0200aeit\u33F8\u3408\u340F\u3417\u0100ls\u33FD\u3404lsetm\xE9\u336Ahp;\u6A33parsl;\u69E4\u0100dl\u1463\u3414e;\u6323\u0100;e\u341C\u341D\u6AAA\u0100;s\u3422\u3423\u6AAC;\uC000\u2AAC\uFE00\u0180flp\u342E\u3433\u3442tcy;\u444C\u0100;b\u3438\u3439\u402F\u0100;a\u343E\u343F\u69C4r;\u633Ff;\uC000\u{1D564}a\u0100dr\u344D\u0402es\u0100;u\u3454\u3455\u6660it\xBB\u3455\u0180csu\u3460\u3479\u349F\u0100au\u3465\u346Fp\u0100;s\u1188\u346B;\uC000\u2293\uFE00p\u0100;s\u11B4\u3475;\uC000\u2294\uFE00u\u0100bp\u347F\u348F\u0180;es\u1197\u119C\u3486et\u0100;e\u1197\u348D\xF1\u119D\u0180;es\u11A8\u11AD\u3496et\u0100;e\u11A8\u349D\xF1\u11AE\u0180;af\u117B\u34A6\u05B0r\u0165\u34AB\u05B1\xBB\u117Car\xF2\u1148\u0200cemt\u34B9\u34BE\u34C2\u34C5r;\uC000\u{1D4C8}tm\xEE\xF1i\xEC\u3415ar\xE6\u11BE\u0100ar\u34CE\u34D5r\u0100;f\u34D4\u17BF\u6606\u0100an\u34DA\u34EDight\u0100ep\u34E3\u34EApsilo\xEE\u1EE0h\xE9\u2EAFs\xBB\u2852\u0280bcmnp\u34FB\u355E\u1209\u358B\u358E\u0480;Edemnprs\u350E\u350F\u3511\u3515\u351E\u3523\u352C\u3531\u3536\u6282;\u6AC5ot;\u6ABD\u0100;d\u11DA\u351Aot;\u6AC3ult;\u6AC1\u0100Ee\u3528\u352A;\u6ACB;\u628Alus;\u6ABFarr;\u6979\u0180eiu\u353D\u3552\u3555t\u0180;en\u350E\u3545\u354Bq\u0100;q\u11DA\u350Feq\u0100;q\u352B\u3528m;\u6AC7\u0100bp\u355A\u355C;\u6AD5;\u6AD3c\u0300;acens\u11ED\u356C\u3572\u3579\u357B\u3326ppro\xF8\u32FAurlye\xF1\u11FE\xF1\u11F3\u0180aes\u3582\u3588\u331Bppro\xF8\u331Aq\xF1\u3317g;\u666A\u0680123;Edehlmnps\u35A9\u35AC\u35AF\u121C\u35B2\u35B4\u35C0\u35C9\u35D5\u35DA\u35DF\u35E8\u35ED\u803B\xB9\u40B9\u803B\xB2\u40B2\u803B\xB3\u40B3;\u6AC6\u0100os\u35B9\u35BCt;\u6ABEub;\u6AD8\u0100;d\u1222\u35C5ot;\u6AC4s\u0100ou\u35CF\u35D2l;\u67C9b;\u6AD7arr;\u697Bult;\u6AC2\u0100Ee\u35E4\u35E6;\u6ACC;\u628Blus;\u6AC0\u0180eiu\u35F4\u3609\u360Ct\u0180;en\u121C\u35FC\u3602q\u0100;q\u1222\u35B2eq\u0100;q\u35E7\u35E4m;\u6AC8\u0100bp\u3611\u3613;\u6AD4;\u6AD6\u0180Aan\u361C\u3620\u362Drr;\u61D9r\u0100hr\u3626\u3628\xEB\u222E\u0100;o\u0A2B\u0A29war;\u692Alig\u803B\xDF\u40DF\u0BE1\u3651\u365D\u3660\u12CE\u3673\u3679\0\u367E\u36C2\0\0\0\0\0\u36DB\u3703\0\u3709\u376C\0\0\0\u3787\u0272\u3656\0\0\u365Bget;\u6316;\u43C4r\xEB\u0E5F\u0180aey\u3666\u366B\u3670ron;\u4165dil;\u4163;\u4442lrec;\u6315r;\uC000\u{1D531}\u0200eiko\u3686\u369D\u36B5\u36BC\u01F2\u368B\0\u3691e\u01004f\u1284\u1281a\u0180;sv\u3698\u3699\u369B\u43B8ym;\u43D1\u0100cn\u36A2\u36B2k\u0100as\u36A8\u36AEppro\xF8\u12C1im\xBB\u12ACs\xF0\u129E\u0100as\u36BA\u36AE\xF0\u12C1rn\u803B\xFE\u40FE\u01EC\u031F\u36C6\u22E7es\u8180\xD7;bd\u36CF\u36D0\u36D8\u40D7\u0100;a\u190F\u36D5r;\u6A31;\u6A30\u0180eps\u36E1\u36E3\u3700\xE1\u2A4D\u0200;bcf\u0486\u36EC\u36F0\u36F4ot;\u6336ir;\u6AF1\u0100;o\u36F9\u36FC\uC000\u{1D565}rk;\u6ADA\xE1\u3362rime;\u6034\u0180aip\u370F\u3712\u3764d\xE5\u1248\u0380adempst\u3721\u374D\u3740\u3751\u3757\u375C\u375Fngle\u0280;dlqr\u3730\u3731\u3736\u3740\u3742\u65B5own\xBB\u1DBBeft\u0100;e\u2800\u373E\xF1\u092E;\u625Cight\u0100;e\u32AA\u374B\xF1\u105Aot;\u65ECinus;\u6A3Alus;\u6A39b;\u69CDime;\u6A3Bezium;\u63E2\u0180cht\u3772\u377D\u3781\u0100ry\u3777\u377B;\uC000\u{1D4C9};\u4446cy;\u445Brok;\u4167\u0100io\u378B\u378Ex\xF4\u1777head\u0100lr\u3797\u37A0eftarro\xF7\u084Fightarrow\xBB\u0F5D\u0900AHabcdfghlmoprstuw\u37D0\u37D3\u37D7\u37E4\u37F0\u37FC\u380E\u381C\u3823\u3834\u3851\u385D\u386B\u38A9\u38CC\u38D2\u38EA\u38F6r\xF2\u03EDar;\u6963\u0100cr\u37DC\u37E2ute\u803B\xFA\u40FA\xF2\u1150r\u01E3\u37EA\0\u37EDy;\u445Eve;\u416D\u0100iy\u37F5\u37FArc\u803B\xFB\u40FB;\u4443\u0180abh\u3803\u3806\u380Br\xF2\u13ADlac;\u4171a\xF2\u13C3\u0100ir\u3813\u3818sht;\u697E;\uC000\u{1D532}rave\u803B\xF9\u40F9\u0161\u3827\u3831r\u0100lr\u382C\u382E\xBB\u0957\xBB\u1083lk;\u6580\u0100ct\u3839\u384D\u026F\u383F\0\0\u384Arn\u0100;e\u3845\u3846\u631Cr\xBB\u3846op;\u630Fri;\u65F8\u0100al\u3856\u385Acr;\u416B\u80BB\xA8\u0349\u0100gp\u3862\u3866on;\u4173f;\uC000\u{1D566}\u0300adhlsu\u114B\u3878\u387D\u1372\u3891\u38A0own\xE1\u13B3arpoon\u0100lr\u3888\u388Cef\xF4\u382Digh\xF4\u382Fi\u0180;hl\u3899\u389A\u389C\u43C5\xBB\u13FAon\xBB\u389Aparrows;\u61C8\u0180cit\u38B0\u38C4\u38C8\u026F\u38B6\0\0\u38C1rn\u0100;e\u38BC\u38BD\u631Dr\xBB\u38BDop;\u630Eng;\u416Fri;\u65F9cr;\uC000\u{1D4CA}\u0180dir\u38D9\u38DD\u38E2ot;\u62F0lde;\u4169i\u0100;f\u3730\u38E8\xBB\u1813\u0100am\u38EF\u38F2r\xF2\u38A8l\u803B\xFC\u40FCangle;\u69A7\u0780ABDacdeflnoprsz\u391C\u391F\u3929\u392D\u39B5\u39B8\u39BD\u39DF\u39E4\u39E8\u39F3\u39F9\u39FD\u3A01\u3A20r\xF2\u03F7ar\u0100;v\u3926\u3927\u6AE8;\u6AE9as\xE8\u03E1\u0100nr\u3932\u3937grt;\u699C\u0380eknprst\u34E3\u3946\u394B\u3952\u395D\u3964\u3996app\xE1\u2415othin\xE7\u1E96\u0180hir\u34EB\u2EC8\u3959op\xF4\u2FB5\u0100;h\u13B7\u3962\xEF\u318D\u0100iu\u3969\u396Dgm\xE1\u33B3\u0100bp\u3972\u3984setneq\u0100;q\u397D\u3980\uC000\u228A\uFE00;\uC000\u2ACB\uFE00setneq\u0100;q\u398F\u3992\uC000\u228B\uFE00;\uC000\u2ACC\uFE00\u0100hr\u399B\u399Fet\xE1\u369Ciangle\u0100lr\u39AA\u39AFeft\xBB\u0925ight\xBB\u1051y;\u4432ash\xBB\u1036\u0180elr\u39C4\u39D2\u39D7\u0180;be\u2DEA\u39CB\u39CFar;\u62BBq;\u625Alip;\u62EE\u0100bt\u39DC\u1468a\xF2\u1469r;\uC000\u{1D533}tr\xE9\u39AEsu\u0100bp\u39EF\u39F1\xBB\u0D1C\xBB\u0D59pf;\uC000\u{1D567}ro\xF0\u0EFBtr\xE9\u39B4\u0100cu\u3A06\u3A0Br;\uC000\u{1D4CB}\u0100bp\u3A10\u3A18n\u0100Ee\u3980\u3A16\xBB\u397En\u0100Ee\u3992\u3A1E\xBB\u3990igzag;\u699A\u0380cefoprs\u3A36\u3A3B\u3A56\u3A5B\u3A54\u3A61\u3A6Airc;\u4175\u0100di\u3A40\u3A51\u0100bg\u3A45\u3A49ar;\u6A5Fe\u0100;q\u15FA\u3A4F;\u6259erp;\u6118r;\uC000\u{1D534}pf;\uC000\u{1D568}\u0100;e\u1479\u3A66at\xE8\u1479cr;\uC000\u{1D4CC}\u0AE3\u178E\u3A87\0\u3A8B\0\u3A90\u3A9B\0\0\u3A9D\u3AA8\u3AAB\u3AAF\0\0\u3AC3\u3ACE\0\u3AD8\u17DC\u17DFtr\xE9\u17D1r;\uC000\u{1D535}\u0100Aa\u3A94\u3A97r\xF2\u03C3r\xF2\u09F6;\u43BE\u0100Aa\u3AA1\u3AA4r\xF2\u03B8r\xF2\u09EBa\xF0\u2713is;\u62FB\u0180dpt\u17A4\u3AB5\u3ABE\u0100fl\u3ABA\u17A9;\uC000\u{1D569}im\xE5\u17B2\u0100Aa\u3AC7\u3ACAr\xF2\u03CEr\xF2\u0A01\u0100cq\u3AD2\u17B8r;\uC000\u{1D4CD}\u0100pt\u17D6\u3ADCr\xE9\u17D4\u0400acefiosu\u3AF0\u3AFD\u3B08\u3B0C\u3B11\u3B15\u3B1B\u3B21c\u0100uy\u3AF6\u3AFBte\u803B\xFD\u40FD;\u444F\u0100iy\u3B02\u3B06rc;\u4177;\u444Bn\u803B\xA5\u40A5r;\uC000\u{1D536}cy;\u4457pf;\uC000\u{1D56A}cr;\uC000\u{1D4CE}\u0100cm\u3B26\u3B29y;\u444El\u803B\xFF\u40FF\u0500acdefhiosw\u3B42\u3B48\u3B54\u3B58\u3B64\u3B69\u3B6D\u3B74\u3B7A\u3B80cute;\u417A\u0100ay\u3B4D\u3B52ron;\u417E;\u4437ot;\u417C\u0100et\u3B5D\u3B61tr\xE6\u155Fa;\u43B6r;\uC000\u{1D537}cy;\u4436grarr;\u61DDpf;\uC000\u{1D56B}cr;\uC000\u{1D4CF}\u0100jn\u3B85\u3B87;\u600Dj;\u600C'.split("").map((c) => c.charCodeAt(0))
  );

  // ../node_modules/.pnpm/entities@4.5.0/node_modules/entities/lib/esm/generated/decode-data-xml.js
  var decode_data_xml_default = new Uint16Array(
    // prettier-ignore
    "\u0200aglq	\x1B\u026D\0\0p;\u4026os;\u4027t;\u403Et;\u403Cuot;\u4022".split("").map((c) => c.charCodeAt(0))
  );

  // ../node_modules/.pnpm/entities@4.5.0/node_modules/entities/lib/esm/decode_codepoint.js
  var _a2;
  var decodeMap2 = /* @__PURE__ */ new Map([
    [0, 65533],
    // C1 Unicode control character reference replacements
    [128, 8364],
    [130, 8218],
    [131, 402],
    [132, 8222],
    [133, 8230],
    [134, 8224],
    [135, 8225],
    [136, 710],
    [137, 8240],
    [138, 352],
    [139, 8249],
    [140, 338],
    [142, 381],
    [145, 8216],
    [146, 8217],
    [147, 8220],
    [148, 8221],
    [149, 8226],
    [150, 8211],
    [151, 8212],
    [152, 732],
    [153, 8482],
    [154, 353],
    [155, 8250],
    [156, 339],
    [158, 382],
    [159, 376]
  ]);
  var fromCodePoint2 = (
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, node/no-unsupported-features/es-builtins
    (_a2 = String.fromCodePoint) !== null && _a2 !== void 0 ? _a2 : function(codePoint) {
      let output = "";
      if (codePoint > 65535) {
        codePoint -= 65536;
        output += String.fromCharCode(codePoint >>> 10 & 1023 | 55296);
        codePoint = 56320 | codePoint & 1023;
      }
      output += String.fromCharCode(codePoint);
      return output;
    }
  );
  function replaceCodePoint2(codePoint) {
    var _a3;
    if (codePoint >= 55296 && codePoint <= 57343 || codePoint > 1114111) {
      return 65533;
    }
    return (_a3 = decodeMap2.get(codePoint)) !== null && _a3 !== void 0 ? _a3 : codePoint;
  }

  // ../node_modules/.pnpm/entities@4.5.0/node_modules/entities/lib/esm/decode.js
  var CharCodes3;
  (function(CharCodes4) {
    CharCodes4[CharCodes4["NUM"] = 35] = "NUM";
    CharCodes4[CharCodes4["SEMI"] = 59] = "SEMI";
    CharCodes4[CharCodes4["EQUALS"] = 61] = "EQUALS";
    CharCodes4[CharCodes4["ZERO"] = 48] = "ZERO";
    CharCodes4[CharCodes4["NINE"] = 57] = "NINE";
    CharCodes4[CharCodes4["LOWER_A"] = 97] = "LOWER_A";
    CharCodes4[CharCodes4["LOWER_F"] = 102] = "LOWER_F";
    CharCodes4[CharCodes4["LOWER_X"] = 120] = "LOWER_X";
    CharCodes4[CharCodes4["LOWER_Z"] = 122] = "LOWER_Z";
    CharCodes4[CharCodes4["UPPER_A"] = 65] = "UPPER_A";
    CharCodes4[CharCodes4["UPPER_F"] = 70] = "UPPER_F";
    CharCodes4[CharCodes4["UPPER_Z"] = 90] = "UPPER_Z";
  })(CharCodes3 || (CharCodes3 = {}));
  var TO_LOWER_BIT2 = 32;
  var BinTrieFlags2;
  (function(BinTrieFlags3) {
    BinTrieFlags3[BinTrieFlags3["VALUE_LENGTH"] = 49152] = "VALUE_LENGTH";
    BinTrieFlags3[BinTrieFlags3["BRANCH_LENGTH"] = 16256] = "BRANCH_LENGTH";
    BinTrieFlags3[BinTrieFlags3["JUMP_TABLE"] = 127] = "JUMP_TABLE";
  })(BinTrieFlags2 || (BinTrieFlags2 = {}));
  function isNumber2(code) {
    return code >= CharCodes3.ZERO && code <= CharCodes3.NINE;
  }
  function isHexadecimalCharacter2(code) {
    return code >= CharCodes3.UPPER_A && code <= CharCodes3.UPPER_F || code >= CharCodes3.LOWER_A && code <= CharCodes3.LOWER_F;
  }
  function isAsciiAlphaNumeric2(code) {
    return code >= CharCodes3.UPPER_A && code <= CharCodes3.UPPER_Z || code >= CharCodes3.LOWER_A && code <= CharCodes3.LOWER_Z || isNumber2(code);
  }
  function isEntityInAttributeInvalidEnd2(code) {
    return code === CharCodes3.EQUALS || isAsciiAlphaNumeric2(code);
  }
  var EntityDecoderState2;
  (function(EntityDecoderState3) {
    EntityDecoderState3[EntityDecoderState3["EntityStart"] = 0] = "EntityStart";
    EntityDecoderState3[EntityDecoderState3["NumericStart"] = 1] = "NumericStart";
    EntityDecoderState3[EntityDecoderState3["NumericDecimal"] = 2] = "NumericDecimal";
    EntityDecoderState3[EntityDecoderState3["NumericHex"] = 3] = "NumericHex";
    EntityDecoderState3[EntityDecoderState3["NamedEntity"] = 4] = "NamedEntity";
  })(EntityDecoderState2 || (EntityDecoderState2 = {}));
  var DecodingMode2;
  (function(DecodingMode3) {
    DecodingMode3[DecodingMode3["Legacy"] = 0] = "Legacy";
    DecodingMode3[DecodingMode3["Strict"] = 1] = "Strict";
    DecodingMode3[DecodingMode3["Attribute"] = 2] = "Attribute";
  })(DecodingMode2 || (DecodingMode2 = {}));
  var EntityDecoder2 = class {
    constructor(decodeTree, emitCodePoint, errors) {
      this.decodeTree = decodeTree;
      this.emitCodePoint = emitCodePoint;
      this.errors = errors;
      this.state = EntityDecoderState2.EntityStart;
      this.consumed = 1;
      this.result = 0;
      this.treeIndex = 0;
      this.excess = 1;
      this.decodeMode = DecodingMode2.Strict;
    }
    /** Resets the instance to make it reusable. */
    startEntity(decodeMode) {
      this.decodeMode = decodeMode;
      this.state = EntityDecoderState2.EntityStart;
      this.result = 0;
      this.treeIndex = 0;
      this.excess = 1;
      this.consumed = 1;
    }
    /**
     * Write an entity to the decoder. This can be called multiple times with partial entities.
     * If the entity is incomplete, the decoder will return -1.
     *
     * Mirrors the implementation of `getDecoder`, but with the ability to stop decoding if the
     * entity is incomplete, and resume when the next string is written.
     *
     * @param string The string containing the entity (or a continuation of the entity).
     * @param offset The offset at which the entity begins. Should be 0 if this is not the first call.
     * @returns The number of characters that were consumed, or -1 if the entity is incomplete.
     */
    write(str, offset) {
      switch (this.state) {
        case EntityDecoderState2.EntityStart: {
          if (str.charCodeAt(offset) === CharCodes3.NUM) {
            this.state = EntityDecoderState2.NumericStart;
            this.consumed += 1;
            return this.stateNumericStart(str, offset + 1);
          }
          this.state = EntityDecoderState2.NamedEntity;
          return this.stateNamedEntity(str, offset);
        }
        case EntityDecoderState2.NumericStart: {
          return this.stateNumericStart(str, offset);
        }
        case EntityDecoderState2.NumericDecimal: {
          return this.stateNumericDecimal(str, offset);
        }
        case EntityDecoderState2.NumericHex: {
          return this.stateNumericHex(str, offset);
        }
        case EntityDecoderState2.NamedEntity: {
          return this.stateNamedEntity(str, offset);
        }
      }
    }
    /**
     * Switches between the numeric decimal and hexadecimal states.
     *
     * Equivalent to the `Numeric character reference state` in the HTML spec.
     *
     * @param str The string containing the entity (or a continuation of the entity).
     * @param offset The current offset.
     * @returns The number of characters that were consumed, or -1 if the entity is incomplete.
     */
    stateNumericStart(str, offset) {
      if (offset >= str.length) {
        return -1;
      }
      if ((str.charCodeAt(offset) | TO_LOWER_BIT2) === CharCodes3.LOWER_X) {
        this.state = EntityDecoderState2.NumericHex;
        this.consumed += 1;
        return this.stateNumericHex(str, offset + 1);
      }
      this.state = EntityDecoderState2.NumericDecimal;
      return this.stateNumericDecimal(str, offset);
    }
    addToNumericResult(str, start, end, base) {
      if (start !== end) {
        const digitCount = end - start;
        this.result = this.result * Math.pow(base, digitCount) + parseInt(str.substr(start, digitCount), base);
        this.consumed += digitCount;
      }
    }
    /**
     * Parses a hexadecimal numeric entity.
     *
     * Equivalent to the `Hexademical character reference state` in the HTML spec.
     *
     * @param str The string containing the entity (or a continuation of the entity).
     * @param offset The current offset.
     * @returns The number of characters that were consumed, or -1 if the entity is incomplete.
     */
    stateNumericHex(str, offset) {
      const startIdx = offset;
      while (offset < str.length) {
        const char = str.charCodeAt(offset);
        if (isNumber2(char) || isHexadecimalCharacter2(char)) {
          offset += 1;
        } else {
          this.addToNumericResult(str, startIdx, offset, 16);
          return this.emitNumericEntity(char, 3);
        }
      }
      this.addToNumericResult(str, startIdx, offset, 16);
      return -1;
    }
    /**
     * Parses a decimal numeric entity.
     *
     * Equivalent to the `Decimal character reference state` in the HTML spec.
     *
     * @param str The string containing the entity (or a continuation of the entity).
     * @param offset The current offset.
     * @returns The number of characters that were consumed, or -1 if the entity is incomplete.
     */
    stateNumericDecimal(str, offset) {
      const startIdx = offset;
      while (offset < str.length) {
        const char = str.charCodeAt(offset);
        if (isNumber2(char)) {
          offset += 1;
        } else {
          this.addToNumericResult(str, startIdx, offset, 10);
          return this.emitNumericEntity(char, 2);
        }
      }
      this.addToNumericResult(str, startIdx, offset, 10);
      return -1;
    }
    /**
     * Validate and emit a numeric entity.
     *
     * Implements the logic from the `Hexademical character reference start
     * state` and `Numeric character reference end state` in the HTML spec.
     *
     * @param lastCp The last code point of the entity. Used to see if the
     *               entity was terminated with a semicolon.
     * @param expectedLength The minimum number of characters that should be
     *                       consumed. Used to validate that at least one digit
     *                       was consumed.
     * @returns The number of characters that were consumed.
     */
    emitNumericEntity(lastCp, expectedLength) {
      var _a3;
      if (this.consumed <= expectedLength) {
        (_a3 = this.errors) === null || _a3 === void 0 ? void 0 : _a3.absenceOfDigitsInNumericCharacterReference(this.consumed);
        return 0;
      }
      if (lastCp === CharCodes3.SEMI) {
        this.consumed += 1;
      } else if (this.decodeMode === DecodingMode2.Strict) {
        return 0;
      }
      this.emitCodePoint(replaceCodePoint2(this.result), this.consumed);
      if (this.errors) {
        if (lastCp !== CharCodes3.SEMI) {
          this.errors.missingSemicolonAfterCharacterReference();
        }
        this.errors.validateNumericCharacterReference(this.result);
      }
      return this.consumed;
    }
    /**
     * Parses a named entity.
     *
     * Equivalent to the `Named character reference state` in the HTML spec.
     *
     * @param str The string containing the entity (or a continuation of the entity).
     * @param offset The current offset.
     * @returns The number of characters that were consumed, or -1 if the entity is incomplete.
     */
    stateNamedEntity(str, offset) {
      const { decodeTree } = this;
      let current = decodeTree[this.treeIndex];
      let valueLength = (current & BinTrieFlags2.VALUE_LENGTH) >> 14;
      for (; offset < str.length; offset++, this.excess++) {
        const char = str.charCodeAt(offset);
        this.treeIndex = determineBranch2(decodeTree, current, this.treeIndex + Math.max(1, valueLength), char);
        if (this.treeIndex < 0) {
          return this.result === 0 || // If we are parsing an attribute
          this.decodeMode === DecodingMode2.Attribute && // We shouldn't have consumed any characters after the entity,
          (valueLength === 0 || // And there should be no invalid characters.
          isEntityInAttributeInvalidEnd2(char)) ? 0 : this.emitNotTerminatedNamedEntity();
        }
        current = decodeTree[this.treeIndex];
        valueLength = (current & BinTrieFlags2.VALUE_LENGTH) >> 14;
        if (valueLength !== 0) {
          if (char === CharCodes3.SEMI) {
            return this.emitNamedEntityData(this.treeIndex, valueLength, this.consumed + this.excess);
          }
          if (this.decodeMode !== DecodingMode2.Strict) {
            this.result = this.treeIndex;
            this.consumed += this.excess;
            this.excess = 0;
          }
        }
      }
      return -1;
    }
    /**
     * Emit a named entity that was not terminated with a semicolon.
     *
     * @returns The number of characters consumed.
     */
    emitNotTerminatedNamedEntity() {
      var _a3;
      const { result, decodeTree } = this;
      const valueLength = (decodeTree[result] & BinTrieFlags2.VALUE_LENGTH) >> 14;
      this.emitNamedEntityData(result, valueLength, this.consumed);
      (_a3 = this.errors) === null || _a3 === void 0 ? void 0 : _a3.missingSemicolonAfterCharacterReference();
      return this.consumed;
    }
    /**
     * Emit a named entity.
     *
     * @param result The index of the entity in the decode tree.
     * @param valueLength The number of bytes in the entity.
     * @param consumed The number of characters consumed.
     *
     * @returns The number of characters consumed.
     */
    emitNamedEntityData(result, valueLength, consumed) {
      const { decodeTree } = this;
      this.emitCodePoint(valueLength === 1 ? decodeTree[result] & ~BinTrieFlags2.VALUE_LENGTH : decodeTree[result + 1], consumed);
      if (valueLength === 3) {
        this.emitCodePoint(decodeTree[result + 2], consumed);
      }
      return consumed;
    }
    /**
     * Signal to the parser that the end of the input was reached.
     *
     * Remaining data will be emitted and relevant errors will be produced.
     *
     * @returns The number of characters consumed.
     */
    end() {
      var _a3;
      switch (this.state) {
        case EntityDecoderState2.NamedEntity: {
          return this.result !== 0 && (this.decodeMode !== DecodingMode2.Attribute || this.result === this.treeIndex) ? this.emitNotTerminatedNamedEntity() : 0;
        }
        // Otherwise, emit a numeric entity if we have one.
        case EntityDecoderState2.NumericDecimal: {
          return this.emitNumericEntity(0, 2);
        }
        case EntityDecoderState2.NumericHex: {
          return this.emitNumericEntity(0, 3);
        }
        case EntityDecoderState2.NumericStart: {
          (_a3 = this.errors) === null || _a3 === void 0 ? void 0 : _a3.absenceOfDigitsInNumericCharacterReference(this.consumed);
          return 0;
        }
        case EntityDecoderState2.EntityStart: {
          return 0;
        }
      }
    }
  };
  function getDecoder(decodeTree) {
    let ret = "";
    const decoder = new EntityDecoder2(decodeTree, (str) => ret += fromCodePoint2(str));
    return function decodeWithTrie(str, decodeMode) {
      let lastIndex = 0;
      let offset = 0;
      while ((offset = str.indexOf("&", offset)) >= 0) {
        ret += str.slice(lastIndex, offset);
        decoder.startEntity(decodeMode);
        const len = decoder.write(
          str,
          // Skip the "&"
          offset + 1
        );
        if (len < 0) {
          lastIndex = offset + decoder.end();
          break;
        }
        lastIndex = offset + len;
        offset = len === 0 ? lastIndex + 1 : lastIndex;
      }
      const result = ret + str.slice(lastIndex);
      ret = "";
      return result;
    };
  }
  function determineBranch2(decodeTree, current, nodeIdx, char) {
    const branchCount = (current & BinTrieFlags2.BRANCH_LENGTH) >> 7;
    const jumpOffset = current & BinTrieFlags2.JUMP_TABLE;
    if (branchCount === 0) {
      return jumpOffset !== 0 && char === jumpOffset ? nodeIdx : -1;
    }
    if (jumpOffset) {
      const value = char - jumpOffset;
      return value < 0 || value >= branchCount ? -1 : decodeTree[nodeIdx + value] - 1;
    }
    let lo = nodeIdx;
    let hi = lo + branchCount - 1;
    while (lo <= hi) {
      const mid = lo + hi >>> 1;
      const midVal = decodeTree[mid];
      if (midVal < char) {
        lo = mid + 1;
      } else if (midVal > char) {
        hi = mid - 1;
      } else {
        return decodeTree[mid + branchCount];
      }
    }
    return -1;
  }
  var htmlDecoder = getDecoder(decode_data_html_default);
  var xmlDecoder = getDecoder(decode_data_xml_default);

  // ../node_modules/.pnpm/entities@4.5.0/node_modules/entities/lib/esm/generated/encode-html.js
  function restoreDiff(arr) {
    for (let i = 1; i < arr.length; i++) {
      arr[i][0] += arr[i - 1][0] + 1;
    }
    return arr;
  }
  var encode_html_default = new Map(/* @__PURE__ */ restoreDiff([[9, "&Tab;"], [0, "&NewLine;"], [22, "&excl;"], [0, "&quot;"], [0, "&num;"], [0, "&dollar;"], [0, "&percnt;"], [0, "&amp;"], [0, "&apos;"], [0, "&lpar;"], [0, "&rpar;"], [0, "&ast;"], [0, "&plus;"], [0, "&comma;"], [1, "&period;"], [0, "&sol;"], [10, "&colon;"], [0, "&semi;"], [0, { v: "&lt;", n: 8402, o: "&nvlt;" }], [0, { v: "&equals;", n: 8421, o: "&bne;" }], [0, { v: "&gt;", n: 8402, o: "&nvgt;" }], [0, "&quest;"], [0, "&commat;"], [26, "&lbrack;"], [0, "&bsol;"], [0, "&rbrack;"], [0, "&Hat;"], [0, "&lowbar;"], [0, "&DiacriticalGrave;"], [5, { n: 106, o: "&fjlig;" }], [20, "&lbrace;"], [0, "&verbar;"], [0, "&rbrace;"], [34, "&nbsp;"], [0, "&iexcl;"], [0, "&cent;"], [0, "&pound;"], [0, "&curren;"], [0, "&yen;"], [0, "&brvbar;"], [0, "&sect;"], [0, "&die;"], [0, "&copy;"], [0, "&ordf;"], [0, "&laquo;"], [0, "&not;"], [0, "&shy;"], [0, "&circledR;"], [0, "&macr;"], [0, "&deg;"], [0, "&PlusMinus;"], [0, "&sup2;"], [0, "&sup3;"], [0, "&acute;"], [0, "&micro;"], [0, "&para;"], [0, "&centerdot;"], [0, "&cedil;"], [0, "&sup1;"], [0, "&ordm;"], [0, "&raquo;"], [0, "&frac14;"], [0, "&frac12;"], [0, "&frac34;"], [0, "&iquest;"], [0, "&Agrave;"], [0, "&Aacute;"], [0, "&Acirc;"], [0, "&Atilde;"], [0, "&Auml;"], [0, "&angst;"], [0, "&AElig;"], [0, "&Ccedil;"], [0, "&Egrave;"], [0, "&Eacute;"], [0, "&Ecirc;"], [0, "&Euml;"], [0, "&Igrave;"], [0, "&Iacute;"], [0, "&Icirc;"], [0, "&Iuml;"], [0, "&ETH;"], [0, "&Ntilde;"], [0, "&Ograve;"], [0, "&Oacute;"], [0, "&Ocirc;"], [0, "&Otilde;"], [0, "&Ouml;"], [0, "&times;"], [0, "&Oslash;"], [0, "&Ugrave;"], [0, "&Uacute;"], [0, "&Ucirc;"], [0, "&Uuml;"], [0, "&Yacute;"], [0, "&THORN;"], [0, "&szlig;"], [0, "&agrave;"], [0, "&aacute;"], [0, "&acirc;"], [0, "&atilde;"], [0, "&auml;"], [0, "&aring;"], [0, "&aelig;"], [0, "&ccedil;"], [0, "&egrave;"], [0, "&eacute;"], [0, "&ecirc;"], [0, "&euml;"], [0, "&igrave;"], [0, "&iacute;"], [0, "&icirc;"], [0, "&iuml;"], [0, "&eth;"], [0, "&ntilde;"], [0, "&ograve;"], [0, "&oacute;"], [0, "&ocirc;"], [0, "&otilde;"], [0, "&ouml;"], [0, "&div;"], [0, "&oslash;"], [0, "&ugrave;"], [0, "&uacute;"], [0, "&ucirc;"], [0, "&uuml;"], [0, "&yacute;"], [0, "&thorn;"], [0, "&yuml;"], [0, "&Amacr;"], [0, "&amacr;"], [0, "&Abreve;"], [0, "&abreve;"], [0, "&Aogon;"], [0, "&aogon;"], [0, "&Cacute;"], [0, "&cacute;"], [0, "&Ccirc;"], [0, "&ccirc;"], [0, "&Cdot;"], [0, "&cdot;"], [0, "&Ccaron;"], [0, "&ccaron;"], [0, "&Dcaron;"], [0, "&dcaron;"], [0, "&Dstrok;"], [0, "&dstrok;"], [0, "&Emacr;"], [0, "&emacr;"], [2, "&Edot;"], [0, "&edot;"], [0, "&Eogon;"], [0, "&eogon;"], [0, "&Ecaron;"], [0, "&ecaron;"], [0, "&Gcirc;"], [0, "&gcirc;"], [0, "&Gbreve;"], [0, "&gbreve;"], [0, "&Gdot;"], [0, "&gdot;"], [0, "&Gcedil;"], [1, "&Hcirc;"], [0, "&hcirc;"], [0, "&Hstrok;"], [0, "&hstrok;"], [0, "&Itilde;"], [0, "&itilde;"], [0, "&Imacr;"], [0, "&imacr;"], [2, "&Iogon;"], [0, "&iogon;"], [0, "&Idot;"], [0, "&imath;"], [0, "&IJlig;"], [0, "&ijlig;"], [0, "&Jcirc;"], [0, "&jcirc;"], [0, "&Kcedil;"], [0, "&kcedil;"], [0, "&kgreen;"], [0, "&Lacute;"], [0, "&lacute;"], [0, "&Lcedil;"], [0, "&lcedil;"], [0, "&Lcaron;"], [0, "&lcaron;"], [0, "&Lmidot;"], [0, "&lmidot;"], [0, "&Lstrok;"], [0, "&lstrok;"], [0, "&Nacute;"], [0, "&nacute;"], [0, "&Ncedil;"], [0, "&ncedil;"], [0, "&Ncaron;"], [0, "&ncaron;"], [0, "&napos;"], [0, "&ENG;"], [0, "&eng;"], [0, "&Omacr;"], [0, "&omacr;"], [2, "&Odblac;"], [0, "&odblac;"], [0, "&OElig;"], [0, "&oelig;"], [0, "&Racute;"], [0, "&racute;"], [0, "&Rcedil;"], [0, "&rcedil;"], [0, "&Rcaron;"], [0, "&rcaron;"], [0, "&Sacute;"], [0, "&sacute;"], [0, "&Scirc;"], [0, "&scirc;"], [0, "&Scedil;"], [0, "&scedil;"], [0, "&Scaron;"], [0, "&scaron;"], [0, "&Tcedil;"], [0, "&tcedil;"], [0, "&Tcaron;"], [0, "&tcaron;"], [0, "&Tstrok;"], [0, "&tstrok;"], [0, "&Utilde;"], [0, "&utilde;"], [0, "&Umacr;"], [0, "&umacr;"], [0, "&Ubreve;"], [0, "&ubreve;"], [0, "&Uring;"], [0, "&uring;"], [0, "&Udblac;"], [0, "&udblac;"], [0, "&Uogon;"], [0, "&uogon;"], [0, "&Wcirc;"], [0, "&wcirc;"], [0, "&Ycirc;"], [0, "&ycirc;"], [0, "&Yuml;"], [0, "&Zacute;"], [0, "&zacute;"], [0, "&Zdot;"], [0, "&zdot;"], [0, "&Zcaron;"], [0, "&zcaron;"], [19, "&fnof;"], [34, "&imped;"], [63, "&gacute;"], [65, "&jmath;"], [142, "&circ;"], [0, "&caron;"], [16, "&breve;"], [0, "&DiacriticalDot;"], [0, "&ring;"], [0, "&ogon;"], [0, "&DiacriticalTilde;"], [0, "&dblac;"], [51, "&DownBreve;"], [127, "&Alpha;"], [0, "&Beta;"], [0, "&Gamma;"], [0, "&Delta;"], [0, "&Epsilon;"], [0, "&Zeta;"], [0, "&Eta;"], [0, "&Theta;"], [0, "&Iota;"], [0, "&Kappa;"], [0, "&Lambda;"], [0, "&Mu;"], [0, "&Nu;"], [0, "&Xi;"], [0, "&Omicron;"], [0, "&Pi;"], [0, "&Rho;"], [1, "&Sigma;"], [0, "&Tau;"], [0, "&Upsilon;"], [0, "&Phi;"], [0, "&Chi;"], [0, "&Psi;"], [0, "&ohm;"], [7, "&alpha;"], [0, "&beta;"], [0, "&gamma;"], [0, "&delta;"], [0, "&epsi;"], [0, "&zeta;"], [0, "&eta;"], [0, "&theta;"], [0, "&iota;"], [0, "&kappa;"], [0, "&lambda;"], [0, "&mu;"], [0, "&nu;"], [0, "&xi;"], [0, "&omicron;"], [0, "&pi;"], [0, "&rho;"], [0, "&sigmaf;"], [0, "&sigma;"], [0, "&tau;"], [0, "&upsi;"], [0, "&phi;"], [0, "&chi;"], [0, "&psi;"], [0, "&omega;"], [7, "&thetasym;"], [0, "&Upsi;"], [2, "&phiv;"], [0, "&piv;"], [5, "&Gammad;"], [0, "&digamma;"], [18, "&kappav;"], [0, "&rhov;"], [3, "&epsiv;"], [0, "&backepsilon;"], [10, "&IOcy;"], [0, "&DJcy;"], [0, "&GJcy;"], [0, "&Jukcy;"], [0, "&DScy;"], [0, "&Iukcy;"], [0, "&YIcy;"], [0, "&Jsercy;"], [0, "&LJcy;"], [0, "&NJcy;"], [0, "&TSHcy;"], [0, "&KJcy;"], [1, "&Ubrcy;"], [0, "&DZcy;"], [0, "&Acy;"], [0, "&Bcy;"], [0, "&Vcy;"], [0, "&Gcy;"], [0, "&Dcy;"], [0, "&IEcy;"], [0, "&ZHcy;"], [0, "&Zcy;"], [0, "&Icy;"], [0, "&Jcy;"], [0, "&Kcy;"], [0, "&Lcy;"], [0, "&Mcy;"], [0, "&Ncy;"], [0, "&Ocy;"], [0, "&Pcy;"], [0, "&Rcy;"], [0, "&Scy;"], [0, "&Tcy;"], [0, "&Ucy;"], [0, "&Fcy;"], [0, "&KHcy;"], [0, "&TScy;"], [0, "&CHcy;"], [0, "&SHcy;"], [0, "&SHCHcy;"], [0, "&HARDcy;"], [0, "&Ycy;"], [0, "&SOFTcy;"], [0, "&Ecy;"], [0, "&YUcy;"], [0, "&YAcy;"], [0, "&acy;"], [0, "&bcy;"], [0, "&vcy;"], [0, "&gcy;"], [0, "&dcy;"], [0, "&iecy;"], [0, "&zhcy;"], [0, "&zcy;"], [0, "&icy;"], [0, "&jcy;"], [0, "&kcy;"], [0, "&lcy;"], [0, "&mcy;"], [0, "&ncy;"], [0, "&ocy;"], [0, "&pcy;"], [0, "&rcy;"], [0, "&scy;"], [0, "&tcy;"], [0, "&ucy;"], [0, "&fcy;"], [0, "&khcy;"], [0, "&tscy;"], [0, "&chcy;"], [0, "&shcy;"], [0, "&shchcy;"], [0, "&hardcy;"], [0, "&ycy;"], [0, "&softcy;"], [0, "&ecy;"], [0, "&yucy;"], [0, "&yacy;"], [1, "&iocy;"], [0, "&djcy;"], [0, "&gjcy;"], [0, "&jukcy;"], [0, "&dscy;"], [0, "&iukcy;"], [0, "&yicy;"], [0, "&jsercy;"], [0, "&ljcy;"], [0, "&njcy;"], [0, "&tshcy;"], [0, "&kjcy;"], [1, "&ubrcy;"], [0, "&dzcy;"], [7074, "&ensp;"], [0, "&emsp;"], [0, "&emsp13;"], [0, "&emsp14;"], [1, "&numsp;"], [0, "&puncsp;"], [0, "&ThinSpace;"], [0, "&hairsp;"], [0, "&NegativeMediumSpace;"], [0, "&zwnj;"], [0, "&zwj;"], [0, "&lrm;"], [0, "&rlm;"], [0, "&dash;"], [2, "&ndash;"], [0, "&mdash;"], [0, "&horbar;"], [0, "&Verbar;"], [1, "&lsquo;"], [0, "&CloseCurlyQuote;"], [0, "&lsquor;"], [1, "&ldquo;"], [0, "&CloseCurlyDoubleQuote;"], [0, "&bdquo;"], [1, "&dagger;"], [0, "&Dagger;"], [0, "&bull;"], [2, "&nldr;"], [0, "&hellip;"], [9, "&permil;"], [0, "&pertenk;"], [0, "&prime;"], [0, "&Prime;"], [0, "&tprime;"], [0, "&backprime;"], [3, "&lsaquo;"], [0, "&rsaquo;"], [3, "&oline;"], [2, "&caret;"], [1, "&hybull;"], [0, "&frasl;"], [10, "&bsemi;"], [7, "&qprime;"], [7, { v: "&MediumSpace;", n: 8202, o: "&ThickSpace;" }], [0, "&NoBreak;"], [0, "&af;"], [0, "&InvisibleTimes;"], [0, "&ic;"], [72, "&euro;"], [46, "&tdot;"], [0, "&DotDot;"], [37, "&complexes;"], [2, "&incare;"], [4, "&gscr;"], [0, "&hamilt;"], [0, "&Hfr;"], [0, "&Hopf;"], [0, "&planckh;"], [0, "&hbar;"], [0, "&imagline;"], [0, "&Ifr;"], [0, "&lagran;"], [0, "&ell;"], [1, "&naturals;"], [0, "&numero;"], [0, "&copysr;"], [0, "&weierp;"], [0, "&Popf;"], [0, "&Qopf;"], [0, "&realine;"], [0, "&real;"], [0, "&reals;"], [0, "&rx;"], [3, "&trade;"], [1, "&integers;"], [2, "&mho;"], [0, "&zeetrf;"], [0, "&iiota;"], [2, "&bernou;"], [0, "&Cayleys;"], [1, "&escr;"], [0, "&Escr;"], [0, "&Fouriertrf;"], [1, "&Mellintrf;"], [0, "&order;"], [0, "&alefsym;"], [0, "&beth;"], [0, "&gimel;"], [0, "&daleth;"], [12, "&CapitalDifferentialD;"], [0, "&dd;"], [0, "&ee;"], [0, "&ii;"], [10, "&frac13;"], [0, "&frac23;"], [0, "&frac15;"], [0, "&frac25;"], [0, "&frac35;"], [0, "&frac45;"], [0, "&frac16;"], [0, "&frac56;"], [0, "&frac18;"], [0, "&frac38;"], [0, "&frac58;"], [0, "&frac78;"], [49, "&larr;"], [0, "&ShortUpArrow;"], [0, "&rarr;"], [0, "&darr;"], [0, "&harr;"], [0, "&updownarrow;"], [0, "&nwarr;"], [0, "&nearr;"], [0, "&LowerRightArrow;"], [0, "&LowerLeftArrow;"], [0, "&nlarr;"], [0, "&nrarr;"], [1, { v: "&rarrw;", n: 824, o: "&nrarrw;" }], [0, "&Larr;"], [0, "&Uarr;"], [0, "&Rarr;"], [0, "&Darr;"], [0, "&larrtl;"], [0, "&rarrtl;"], [0, "&LeftTeeArrow;"], [0, "&mapstoup;"], [0, "&map;"], [0, "&DownTeeArrow;"], [1, "&hookleftarrow;"], [0, "&hookrightarrow;"], [0, "&larrlp;"], [0, "&looparrowright;"], [0, "&harrw;"], [0, "&nharr;"], [1, "&lsh;"], [0, "&rsh;"], [0, "&ldsh;"], [0, "&rdsh;"], [1, "&crarr;"], [0, "&cularr;"], [0, "&curarr;"], [2, "&circlearrowleft;"], [0, "&circlearrowright;"], [0, "&leftharpoonup;"], [0, "&DownLeftVector;"], [0, "&RightUpVector;"], [0, "&LeftUpVector;"], [0, "&rharu;"], [0, "&DownRightVector;"], [0, "&dharr;"], [0, "&dharl;"], [0, "&RightArrowLeftArrow;"], [0, "&udarr;"], [0, "&LeftArrowRightArrow;"], [0, "&leftleftarrows;"], [0, "&upuparrows;"], [0, "&rightrightarrows;"], [0, "&ddarr;"], [0, "&leftrightharpoons;"], [0, "&Equilibrium;"], [0, "&nlArr;"], [0, "&nhArr;"], [0, "&nrArr;"], [0, "&DoubleLeftArrow;"], [0, "&DoubleUpArrow;"], [0, "&DoubleRightArrow;"], [0, "&dArr;"], [0, "&DoubleLeftRightArrow;"], [0, "&DoubleUpDownArrow;"], [0, "&nwArr;"], [0, "&neArr;"], [0, "&seArr;"], [0, "&swArr;"], [0, "&lAarr;"], [0, "&rAarr;"], [1, "&zigrarr;"], [6, "&larrb;"], [0, "&rarrb;"], [15, "&DownArrowUpArrow;"], [7, "&loarr;"], [0, "&roarr;"], [0, "&hoarr;"], [0, "&forall;"], [0, "&comp;"], [0, { v: "&part;", n: 824, o: "&npart;" }], [0, "&exist;"], [0, "&nexist;"], [0, "&empty;"], [1, "&Del;"], [0, "&Element;"], [0, "&NotElement;"], [1, "&ni;"], [0, "&notni;"], [2, "&prod;"], [0, "&coprod;"], [0, "&sum;"], [0, "&minus;"], [0, "&MinusPlus;"], [0, "&dotplus;"], [1, "&Backslash;"], [0, "&lowast;"], [0, "&compfn;"], [1, "&radic;"], [2, "&prop;"], [0, "&infin;"], [0, "&angrt;"], [0, { v: "&ang;", n: 8402, o: "&nang;" }], [0, "&angmsd;"], [0, "&angsph;"], [0, "&mid;"], [0, "&nmid;"], [0, "&DoubleVerticalBar;"], [0, "&NotDoubleVerticalBar;"], [0, "&and;"], [0, "&or;"], [0, { v: "&cap;", n: 65024, o: "&caps;" }], [0, { v: "&cup;", n: 65024, o: "&cups;" }], [0, "&int;"], [0, "&Int;"], [0, "&iiint;"], [0, "&conint;"], [0, "&Conint;"], [0, "&Cconint;"], [0, "&cwint;"], [0, "&ClockwiseContourIntegral;"], [0, "&awconint;"], [0, "&there4;"], [0, "&becaus;"], [0, "&ratio;"], [0, "&Colon;"], [0, "&dotminus;"], [1, "&mDDot;"], [0, "&homtht;"], [0, { v: "&sim;", n: 8402, o: "&nvsim;" }], [0, { v: "&backsim;", n: 817, o: "&race;" }], [0, { v: "&ac;", n: 819, o: "&acE;" }], [0, "&acd;"], [0, "&VerticalTilde;"], [0, "&NotTilde;"], [0, { v: "&eqsim;", n: 824, o: "&nesim;" }], [0, "&sime;"], [0, "&NotTildeEqual;"], [0, "&cong;"], [0, "&simne;"], [0, "&ncong;"], [0, "&ap;"], [0, "&nap;"], [0, "&ape;"], [0, { v: "&apid;", n: 824, o: "&napid;" }], [0, "&backcong;"], [0, { v: "&asympeq;", n: 8402, o: "&nvap;" }], [0, { v: "&bump;", n: 824, o: "&nbump;" }], [0, { v: "&bumpe;", n: 824, o: "&nbumpe;" }], [0, { v: "&doteq;", n: 824, o: "&nedot;" }], [0, "&doteqdot;"], [0, "&efDot;"], [0, "&erDot;"], [0, "&Assign;"], [0, "&ecolon;"], [0, "&ecir;"], [0, "&circeq;"], [1, "&wedgeq;"], [0, "&veeeq;"], [1, "&triangleq;"], [2, "&equest;"], [0, "&ne;"], [0, { v: "&Congruent;", n: 8421, o: "&bnequiv;" }], [0, "&nequiv;"], [1, { v: "&le;", n: 8402, o: "&nvle;" }], [0, { v: "&ge;", n: 8402, o: "&nvge;" }], [0, { v: "&lE;", n: 824, o: "&nlE;" }], [0, { v: "&gE;", n: 824, o: "&ngE;" }], [0, { v: "&lnE;", n: 65024, o: "&lvertneqq;" }], [0, { v: "&gnE;", n: 65024, o: "&gvertneqq;" }], [0, { v: "&ll;", n: new Map(/* @__PURE__ */ restoreDiff([[824, "&nLtv;"], [7577, "&nLt;"]])) }], [0, { v: "&gg;", n: new Map(/* @__PURE__ */ restoreDiff([[824, "&nGtv;"], [7577, "&nGt;"]])) }], [0, "&between;"], [0, "&NotCupCap;"], [0, "&nless;"], [0, "&ngt;"], [0, "&nle;"], [0, "&nge;"], [0, "&lesssim;"], [0, "&GreaterTilde;"], [0, "&nlsim;"], [0, "&ngsim;"], [0, "&LessGreater;"], [0, "&gl;"], [0, "&NotLessGreater;"], [0, "&NotGreaterLess;"], [0, "&pr;"], [0, "&sc;"], [0, "&prcue;"], [0, "&sccue;"], [0, "&PrecedesTilde;"], [0, { v: "&scsim;", n: 824, o: "&NotSucceedsTilde;" }], [0, "&NotPrecedes;"], [0, "&NotSucceeds;"], [0, { v: "&sub;", n: 8402, o: "&NotSubset;" }], [0, { v: "&sup;", n: 8402, o: "&NotSuperset;" }], [0, "&nsub;"], [0, "&nsup;"], [0, "&sube;"], [0, "&supe;"], [0, "&NotSubsetEqual;"], [0, "&NotSupersetEqual;"], [0, { v: "&subne;", n: 65024, o: "&varsubsetneq;" }], [0, { v: "&supne;", n: 65024, o: "&varsupsetneq;" }], [1, "&cupdot;"], [0, "&UnionPlus;"], [0, { v: "&sqsub;", n: 824, o: "&NotSquareSubset;" }], [0, { v: "&sqsup;", n: 824, o: "&NotSquareSuperset;" }], [0, "&sqsube;"], [0, "&sqsupe;"], [0, { v: "&sqcap;", n: 65024, o: "&sqcaps;" }], [0, { v: "&sqcup;", n: 65024, o: "&sqcups;" }], [0, "&CirclePlus;"], [0, "&CircleMinus;"], [0, "&CircleTimes;"], [0, "&osol;"], [0, "&CircleDot;"], [0, "&circledcirc;"], [0, "&circledast;"], [1, "&circleddash;"], [0, "&boxplus;"], [0, "&boxminus;"], [0, "&boxtimes;"], [0, "&dotsquare;"], [0, "&RightTee;"], [0, "&dashv;"], [0, "&DownTee;"], [0, "&bot;"], [1, "&models;"], [0, "&DoubleRightTee;"], [0, "&Vdash;"], [0, "&Vvdash;"], [0, "&VDash;"], [0, "&nvdash;"], [0, "&nvDash;"], [0, "&nVdash;"], [0, "&nVDash;"], [0, "&prurel;"], [1, "&LeftTriangle;"], [0, "&RightTriangle;"], [0, { v: "&LeftTriangleEqual;", n: 8402, o: "&nvltrie;" }], [0, { v: "&RightTriangleEqual;", n: 8402, o: "&nvrtrie;" }], [0, "&origof;"], [0, "&imof;"], [0, "&multimap;"], [0, "&hercon;"], [0, "&intcal;"], [0, "&veebar;"], [1, "&barvee;"], [0, "&angrtvb;"], [0, "&lrtri;"], [0, "&bigwedge;"], [0, "&bigvee;"], [0, "&bigcap;"], [0, "&bigcup;"], [0, "&diam;"], [0, "&sdot;"], [0, "&sstarf;"], [0, "&divideontimes;"], [0, "&bowtie;"], [0, "&ltimes;"], [0, "&rtimes;"], [0, "&leftthreetimes;"], [0, "&rightthreetimes;"], [0, "&backsimeq;"], [0, "&curlyvee;"], [0, "&curlywedge;"], [0, "&Sub;"], [0, "&Sup;"], [0, "&Cap;"], [0, "&Cup;"], [0, "&fork;"], [0, "&epar;"], [0, "&lessdot;"], [0, "&gtdot;"], [0, { v: "&Ll;", n: 824, o: "&nLl;" }], [0, { v: "&Gg;", n: 824, o: "&nGg;" }], [0, { v: "&leg;", n: 65024, o: "&lesg;" }], [0, { v: "&gel;", n: 65024, o: "&gesl;" }], [2, "&cuepr;"], [0, "&cuesc;"], [0, "&NotPrecedesSlantEqual;"], [0, "&NotSucceedsSlantEqual;"], [0, "&NotSquareSubsetEqual;"], [0, "&NotSquareSupersetEqual;"], [2, "&lnsim;"], [0, "&gnsim;"], [0, "&precnsim;"], [0, "&scnsim;"], [0, "&nltri;"], [0, "&NotRightTriangle;"], [0, "&nltrie;"], [0, "&NotRightTriangleEqual;"], [0, "&vellip;"], [0, "&ctdot;"], [0, "&utdot;"], [0, "&dtdot;"], [0, "&disin;"], [0, "&isinsv;"], [0, "&isins;"], [0, { v: "&isindot;", n: 824, o: "&notindot;" }], [0, "&notinvc;"], [0, "&notinvb;"], [1, { v: "&isinE;", n: 824, o: "&notinE;" }], [0, "&nisd;"], [0, "&xnis;"], [0, "&nis;"], [0, "&notnivc;"], [0, "&notnivb;"], [6, "&barwed;"], [0, "&Barwed;"], [1, "&lceil;"], [0, "&rceil;"], [0, "&LeftFloor;"], [0, "&rfloor;"], [0, "&drcrop;"], [0, "&dlcrop;"], [0, "&urcrop;"], [0, "&ulcrop;"], [0, "&bnot;"], [1, "&profline;"], [0, "&profsurf;"], [1, "&telrec;"], [0, "&target;"], [5, "&ulcorn;"], [0, "&urcorn;"], [0, "&dlcorn;"], [0, "&drcorn;"], [2, "&frown;"], [0, "&smile;"], [9, "&cylcty;"], [0, "&profalar;"], [7, "&topbot;"], [6, "&ovbar;"], [1, "&solbar;"], [60, "&angzarr;"], [51, "&lmoustache;"], [0, "&rmoustache;"], [2, "&OverBracket;"], [0, "&bbrk;"], [0, "&bbrktbrk;"], [37, "&OverParenthesis;"], [0, "&UnderParenthesis;"], [0, "&OverBrace;"], [0, "&UnderBrace;"], [2, "&trpezium;"], [4, "&elinters;"], [59, "&blank;"], [164, "&circledS;"], [55, "&boxh;"], [1, "&boxv;"], [9, "&boxdr;"], [3, "&boxdl;"], [3, "&boxur;"], [3, "&boxul;"], [3, "&boxvr;"], [7, "&boxvl;"], [7, "&boxhd;"], [7, "&boxhu;"], [7, "&boxvh;"], [19, "&boxH;"], [0, "&boxV;"], [0, "&boxdR;"], [0, "&boxDr;"], [0, "&boxDR;"], [0, "&boxdL;"], [0, "&boxDl;"], [0, "&boxDL;"], [0, "&boxuR;"], [0, "&boxUr;"], [0, "&boxUR;"], [0, "&boxuL;"], [0, "&boxUl;"], [0, "&boxUL;"], [0, "&boxvR;"], [0, "&boxVr;"], [0, "&boxVR;"], [0, "&boxvL;"], [0, "&boxVl;"], [0, "&boxVL;"], [0, "&boxHd;"], [0, "&boxhD;"], [0, "&boxHD;"], [0, "&boxHu;"], [0, "&boxhU;"], [0, "&boxHU;"], [0, "&boxvH;"], [0, "&boxVh;"], [0, "&boxVH;"], [19, "&uhblk;"], [3, "&lhblk;"], [3, "&block;"], [8, "&blk14;"], [0, "&blk12;"], [0, "&blk34;"], [13, "&square;"], [8, "&blacksquare;"], [0, "&EmptyVerySmallSquare;"], [1, "&rect;"], [0, "&marker;"], [2, "&fltns;"], [1, "&bigtriangleup;"], [0, "&blacktriangle;"], [0, "&triangle;"], [2, "&blacktriangleright;"], [0, "&rtri;"], [3, "&bigtriangledown;"], [0, "&blacktriangledown;"], [0, "&dtri;"], [2, "&blacktriangleleft;"], [0, "&ltri;"], [6, "&loz;"], [0, "&cir;"], [32, "&tridot;"], [2, "&bigcirc;"], [8, "&ultri;"], [0, "&urtri;"], [0, "&lltri;"], [0, "&EmptySmallSquare;"], [0, "&FilledSmallSquare;"], [8, "&bigstar;"], [0, "&star;"], [7, "&phone;"], [49, "&female;"], [1, "&male;"], [29, "&spades;"], [2, "&clubs;"], [1, "&hearts;"], [0, "&diamondsuit;"], [3, "&sung;"], [2, "&flat;"], [0, "&natural;"], [0, "&sharp;"], [163, "&check;"], [3, "&cross;"], [8, "&malt;"], [21, "&sext;"], [33, "&VerticalSeparator;"], [25, "&lbbrk;"], [0, "&rbbrk;"], [84, "&bsolhsub;"], [0, "&suphsol;"], [28, "&LeftDoubleBracket;"], [0, "&RightDoubleBracket;"], [0, "&lang;"], [0, "&rang;"], [0, "&Lang;"], [0, "&Rang;"], [0, "&loang;"], [0, "&roang;"], [7, "&longleftarrow;"], [0, "&longrightarrow;"], [0, "&longleftrightarrow;"], [0, "&DoubleLongLeftArrow;"], [0, "&DoubleLongRightArrow;"], [0, "&DoubleLongLeftRightArrow;"], [1, "&longmapsto;"], [2, "&dzigrarr;"], [258, "&nvlArr;"], [0, "&nvrArr;"], [0, "&nvHarr;"], [0, "&Map;"], [6, "&lbarr;"], [0, "&bkarow;"], [0, "&lBarr;"], [0, "&dbkarow;"], [0, "&drbkarow;"], [0, "&DDotrahd;"], [0, "&UpArrowBar;"], [0, "&DownArrowBar;"], [2, "&Rarrtl;"], [2, "&latail;"], [0, "&ratail;"], [0, "&lAtail;"], [0, "&rAtail;"], [0, "&larrfs;"], [0, "&rarrfs;"], [0, "&larrbfs;"], [0, "&rarrbfs;"], [2, "&nwarhk;"], [0, "&nearhk;"], [0, "&hksearow;"], [0, "&hkswarow;"], [0, "&nwnear;"], [0, "&nesear;"], [0, "&seswar;"], [0, "&swnwar;"], [8, { v: "&rarrc;", n: 824, o: "&nrarrc;" }], [1, "&cudarrr;"], [0, "&ldca;"], [0, "&rdca;"], [0, "&cudarrl;"], [0, "&larrpl;"], [2, "&curarrm;"], [0, "&cularrp;"], [7, "&rarrpl;"], [2, "&harrcir;"], [0, "&Uarrocir;"], [0, "&lurdshar;"], [0, "&ldrushar;"], [2, "&LeftRightVector;"], [0, "&RightUpDownVector;"], [0, "&DownLeftRightVector;"], [0, "&LeftUpDownVector;"], [0, "&LeftVectorBar;"], [0, "&RightVectorBar;"], [0, "&RightUpVectorBar;"], [0, "&RightDownVectorBar;"], [0, "&DownLeftVectorBar;"], [0, "&DownRightVectorBar;"], [0, "&LeftUpVectorBar;"], [0, "&LeftDownVectorBar;"], [0, "&LeftTeeVector;"], [0, "&RightTeeVector;"], [0, "&RightUpTeeVector;"], [0, "&RightDownTeeVector;"], [0, "&DownLeftTeeVector;"], [0, "&DownRightTeeVector;"], [0, "&LeftUpTeeVector;"], [0, "&LeftDownTeeVector;"], [0, "&lHar;"], [0, "&uHar;"], [0, "&rHar;"], [0, "&dHar;"], [0, "&luruhar;"], [0, "&ldrdhar;"], [0, "&ruluhar;"], [0, "&rdldhar;"], [0, "&lharul;"], [0, "&llhard;"], [0, "&rharul;"], [0, "&lrhard;"], [0, "&udhar;"], [0, "&duhar;"], [0, "&RoundImplies;"], [0, "&erarr;"], [0, "&simrarr;"], [0, "&larrsim;"], [0, "&rarrsim;"], [0, "&rarrap;"], [0, "&ltlarr;"], [1, "&gtrarr;"], [0, "&subrarr;"], [1, "&suplarr;"], [0, "&lfisht;"], [0, "&rfisht;"], [0, "&ufisht;"], [0, "&dfisht;"], [5, "&lopar;"], [0, "&ropar;"], [4, "&lbrke;"], [0, "&rbrke;"], [0, "&lbrkslu;"], [0, "&rbrksld;"], [0, "&lbrksld;"], [0, "&rbrkslu;"], [0, "&langd;"], [0, "&rangd;"], [0, "&lparlt;"], [0, "&rpargt;"], [0, "&gtlPar;"], [0, "&ltrPar;"], [3, "&vzigzag;"], [1, "&vangrt;"], [0, "&angrtvbd;"], [6, "&ange;"], [0, "&range;"], [0, "&dwangle;"], [0, "&uwangle;"], [0, "&angmsdaa;"], [0, "&angmsdab;"], [0, "&angmsdac;"], [0, "&angmsdad;"], [0, "&angmsdae;"], [0, "&angmsdaf;"], [0, "&angmsdag;"], [0, "&angmsdah;"], [0, "&bemptyv;"], [0, "&demptyv;"], [0, "&cemptyv;"], [0, "&raemptyv;"], [0, "&laemptyv;"], [0, "&ohbar;"], [0, "&omid;"], [0, "&opar;"], [1, "&operp;"], [1, "&olcross;"], [0, "&odsold;"], [1, "&olcir;"], [0, "&ofcir;"], [0, "&olt;"], [0, "&ogt;"], [0, "&cirscir;"], [0, "&cirE;"], [0, "&solb;"], [0, "&bsolb;"], [3, "&boxbox;"], [3, "&trisb;"], [0, "&rtriltri;"], [0, { v: "&LeftTriangleBar;", n: 824, o: "&NotLeftTriangleBar;" }], [0, { v: "&RightTriangleBar;", n: 824, o: "&NotRightTriangleBar;" }], [11, "&iinfin;"], [0, "&infintie;"], [0, "&nvinfin;"], [4, "&eparsl;"], [0, "&smeparsl;"], [0, "&eqvparsl;"], [5, "&blacklozenge;"], [8, "&RuleDelayed;"], [1, "&dsol;"], [9, "&bigodot;"], [0, "&bigoplus;"], [0, "&bigotimes;"], [1, "&biguplus;"], [1, "&bigsqcup;"], [5, "&iiiint;"], [0, "&fpartint;"], [2, "&cirfnint;"], [0, "&awint;"], [0, "&rppolint;"], [0, "&scpolint;"], [0, "&npolint;"], [0, "&pointint;"], [0, "&quatint;"], [0, "&intlarhk;"], [10, "&pluscir;"], [0, "&plusacir;"], [0, "&simplus;"], [0, "&plusdu;"], [0, "&plussim;"], [0, "&plustwo;"], [1, "&mcomma;"], [0, "&minusdu;"], [2, "&loplus;"], [0, "&roplus;"], [0, "&Cross;"], [0, "&timesd;"], [0, "&timesbar;"], [1, "&smashp;"], [0, "&lotimes;"], [0, "&rotimes;"], [0, "&otimesas;"], [0, "&Otimes;"], [0, "&odiv;"], [0, "&triplus;"], [0, "&triminus;"], [0, "&tritime;"], [0, "&intprod;"], [2, "&amalg;"], [0, "&capdot;"], [1, "&ncup;"], [0, "&ncap;"], [0, "&capand;"], [0, "&cupor;"], [0, "&cupcap;"], [0, "&capcup;"], [0, "&cupbrcap;"], [0, "&capbrcup;"], [0, "&cupcup;"], [0, "&capcap;"], [0, "&ccups;"], [0, "&ccaps;"], [2, "&ccupssm;"], [2, "&And;"], [0, "&Or;"], [0, "&andand;"], [0, "&oror;"], [0, "&orslope;"], [0, "&andslope;"], [1, "&andv;"], [0, "&orv;"], [0, "&andd;"], [0, "&ord;"], [1, "&wedbar;"], [6, "&sdote;"], [3, "&simdot;"], [2, { v: "&congdot;", n: 824, o: "&ncongdot;" }], [0, "&easter;"], [0, "&apacir;"], [0, { v: "&apE;", n: 824, o: "&napE;" }], [0, "&eplus;"], [0, "&pluse;"], [0, "&Esim;"], [0, "&Colone;"], [0, "&Equal;"], [1, "&ddotseq;"], [0, "&equivDD;"], [0, "&ltcir;"], [0, "&gtcir;"], [0, "&ltquest;"], [0, "&gtquest;"], [0, { v: "&leqslant;", n: 824, o: "&nleqslant;" }], [0, { v: "&geqslant;", n: 824, o: "&ngeqslant;" }], [0, "&lesdot;"], [0, "&gesdot;"], [0, "&lesdoto;"], [0, "&gesdoto;"], [0, "&lesdotor;"], [0, "&gesdotol;"], [0, "&lap;"], [0, "&gap;"], [0, "&lne;"], [0, "&gne;"], [0, "&lnap;"], [0, "&gnap;"], [0, "&lEg;"], [0, "&gEl;"], [0, "&lsime;"], [0, "&gsime;"], [0, "&lsimg;"], [0, "&gsiml;"], [0, "&lgE;"], [0, "&glE;"], [0, "&lesges;"], [0, "&gesles;"], [0, "&els;"], [0, "&egs;"], [0, "&elsdot;"], [0, "&egsdot;"], [0, "&el;"], [0, "&eg;"], [2, "&siml;"], [0, "&simg;"], [0, "&simlE;"], [0, "&simgE;"], [0, { v: "&LessLess;", n: 824, o: "&NotNestedLessLess;" }], [0, { v: "&GreaterGreater;", n: 824, o: "&NotNestedGreaterGreater;" }], [1, "&glj;"], [0, "&gla;"], [0, "&ltcc;"], [0, "&gtcc;"], [0, "&lescc;"], [0, "&gescc;"], [0, "&smt;"], [0, "&lat;"], [0, { v: "&smte;", n: 65024, o: "&smtes;" }], [0, { v: "&late;", n: 65024, o: "&lates;" }], [0, "&bumpE;"], [0, { v: "&PrecedesEqual;", n: 824, o: "&NotPrecedesEqual;" }], [0, { v: "&sce;", n: 824, o: "&NotSucceedsEqual;" }], [2, "&prE;"], [0, "&scE;"], [0, "&precneqq;"], [0, "&scnE;"], [0, "&prap;"], [0, "&scap;"], [0, "&precnapprox;"], [0, "&scnap;"], [0, "&Pr;"], [0, "&Sc;"], [0, "&subdot;"], [0, "&supdot;"], [0, "&subplus;"], [0, "&supplus;"], [0, "&submult;"], [0, "&supmult;"], [0, "&subedot;"], [0, "&supedot;"], [0, { v: "&subE;", n: 824, o: "&nsubE;" }], [0, { v: "&supE;", n: 824, o: "&nsupE;" }], [0, "&subsim;"], [0, "&supsim;"], [2, { v: "&subnE;", n: 65024, o: "&varsubsetneqq;" }], [0, { v: "&supnE;", n: 65024, o: "&varsupsetneqq;" }], [2, "&csub;"], [0, "&csup;"], [0, "&csube;"], [0, "&csupe;"], [0, "&subsup;"], [0, "&supsub;"], [0, "&subsub;"], [0, "&supsup;"], [0, "&suphsub;"], [0, "&supdsub;"], [0, "&forkv;"], [0, "&topfork;"], [0, "&mlcp;"], [8, "&Dashv;"], [1, "&Vdashl;"], [0, "&Barv;"], [0, "&vBar;"], [0, "&vBarv;"], [1, "&Vbar;"], [0, "&Not;"], [0, "&bNot;"], [0, "&rnmid;"], [0, "&cirmid;"], [0, "&midcir;"], [0, "&topcir;"], [0, "&nhpar;"], [0, "&parsim;"], [9, { v: "&parsl;", n: 8421, o: "&nparsl;" }], [44343, { n: new Map(/* @__PURE__ */ restoreDiff([[56476, "&Ascr;"], [1, "&Cscr;"], [0, "&Dscr;"], [2, "&Gscr;"], [2, "&Jscr;"], [0, "&Kscr;"], [2, "&Nscr;"], [0, "&Oscr;"], [0, "&Pscr;"], [0, "&Qscr;"], [1, "&Sscr;"], [0, "&Tscr;"], [0, "&Uscr;"], [0, "&Vscr;"], [0, "&Wscr;"], [0, "&Xscr;"], [0, "&Yscr;"], [0, "&Zscr;"], [0, "&ascr;"], [0, "&bscr;"], [0, "&cscr;"], [0, "&dscr;"], [1, "&fscr;"], [1, "&hscr;"], [0, "&iscr;"], [0, "&jscr;"], [0, "&kscr;"], [0, "&lscr;"], [0, "&mscr;"], [0, "&nscr;"], [1, "&pscr;"], [0, "&qscr;"], [0, "&rscr;"], [0, "&sscr;"], [0, "&tscr;"], [0, "&uscr;"], [0, "&vscr;"], [0, "&wscr;"], [0, "&xscr;"], [0, "&yscr;"], [0, "&zscr;"], [52, "&Afr;"], [0, "&Bfr;"], [1, "&Dfr;"], [0, "&Efr;"], [0, "&Ffr;"], [0, "&Gfr;"], [2, "&Jfr;"], [0, "&Kfr;"], [0, "&Lfr;"], [0, "&Mfr;"], [0, "&Nfr;"], [0, "&Ofr;"], [0, "&Pfr;"], [0, "&Qfr;"], [1, "&Sfr;"], [0, "&Tfr;"], [0, "&Ufr;"], [0, "&Vfr;"], [0, "&Wfr;"], [0, "&Xfr;"], [0, "&Yfr;"], [1, "&afr;"], [0, "&bfr;"], [0, "&cfr;"], [0, "&dfr;"], [0, "&efr;"], [0, "&ffr;"], [0, "&gfr;"], [0, "&hfr;"], [0, "&ifr;"], [0, "&jfr;"], [0, "&kfr;"], [0, "&lfr;"], [0, "&mfr;"], [0, "&nfr;"], [0, "&ofr;"], [0, "&pfr;"], [0, "&qfr;"], [0, "&rfr;"], [0, "&sfr;"], [0, "&tfr;"], [0, "&ufr;"], [0, "&vfr;"], [0, "&wfr;"], [0, "&xfr;"], [0, "&yfr;"], [0, "&zfr;"], [0, "&Aopf;"], [0, "&Bopf;"], [1, "&Dopf;"], [0, "&Eopf;"], [0, "&Fopf;"], [0, "&Gopf;"], [1, "&Iopf;"], [0, "&Jopf;"], [0, "&Kopf;"], [0, "&Lopf;"], [0, "&Mopf;"], [1, "&Oopf;"], [3, "&Sopf;"], [0, "&Topf;"], [0, "&Uopf;"], [0, "&Vopf;"], [0, "&Wopf;"], [0, "&Xopf;"], [0, "&Yopf;"], [1, "&aopf;"], [0, "&bopf;"], [0, "&copf;"], [0, "&dopf;"], [0, "&eopf;"], [0, "&fopf;"], [0, "&gopf;"], [0, "&hopf;"], [0, "&iopf;"], [0, "&jopf;"], [0, "&kopf;"], [0, "&lopf;"], [0, "&mopf;"], [0, "&nopf;"], [0, "&oopf;"], [0, "&popf;"], [0, "&qopf;"], [0, "&ropf;"], [0, "&sopf;"], [0, "&topf;"], [0, "&uopf;"], [0, "&vopf;"], [0, "&wopf;"], [0, "&xopf;"], [0, "&yopf;"], [0, "&zopf;"]])) }], [8906, "&fflig;"], [0, "&filig;"], [0, "&fllig;"], [0, "&ffilig;"], [0, "&ffllig;"]]));

  // ../node_modules/.pnpm/entities@4.5.0/node_modules/entities/lib/esm/escape.js
  var xmlReplacer = /["&'<>$\x80-\uFFFF]/g;
  var xmlCodeMap = /* @__PURE__ */ new Map([
    [34, "&quot;"],
    [38, "&amp;"],
    [39, "&apos;"],
    [60, "&lt;"],
    [62, "&gt;"]
  ]);
  var getCodePoint = (
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    String.prototype.codePointAt != null ? (str, index) => str.codePointAt(index) : (
      // http://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
      (c, index) => (c.charCodeAt(index) & 64512) === 55296 ? (c.charCodeAt(index) - 55296) * 1024 + c.charCodeAt(index + 1) - 56320 + 65536 : c.charCodeAt(index)
    )
  );
  function encodeXML(str) {
    let ret = "";
    let lastIdx = 0;
    let match;
    while ((match = xmlReplacer.exec(str)) !== null) {
      const i = match.index;
      const char = str.charCodeAt(i);
      const next = xmlCodeMap.get(char);
      if (next !== void 0) {
        ret += str.substring(lastIdx, i) + next;
        lastIdx = i + 1;
      } else {
        ret += `${str.substring(lastIdx, i)}&#x${getCodePoint(str, i).toString(16)};`;
        lastIdx = xmlReplacer.lastIndex += Number((char & 64512) === 55296);
      }
    }
    return ret + str.substr(lastIdx);
  }
  function getEscaper(regex, map) {
    return function escape3(data) {
      let match;
      let lastIdx = 0;
      let result = "";
      while (match = regex.exec(data)) {
        if (lastIdx !== match.index) {
          result += data.substring(lastIdx, match.index);
        }
        result += map.get(match[0].charCodeAt(0));
        lastIdx = match.index + 1;
      }
      return result + data.substring(lastIdx);
    };
  }
  var escapeUTF8 = getEscaper(/[&<>'"]/g, xmlCodeMap);
  var escapeAttribute = getEscaper(/["&\u00A0]/g, /* @__PURE__ */ new Map([
    [34, "&quot;"],
    [38, "&amp;"],
    [160, "&nbsp;"]
  ]));
  var escapeText = getEscaper(/[&<>\u00A0]/g, /* @__PURE__ */ new Map([
    [38, "&amp;"],
    [60, "&lt;"],
    [62, "&gt;"],
    [160, "&nbsp;"]
  ]));

  // ../node_modules/.pnpm/entities@4.5.0/node_modules/entities/lib/esm/index.js
  var EntityLevel;
  (function(EntityLevel2) {
    EntityLevel2[EntityLevel2["XML"] = 0] = "XML";
    EntityLevel2[EntityLevel2["HTML"] = 1] = "HTML";
  })(EntityLevel || (EntityLevel = {}));
  var EncodingMode;
  (function(EncodingMode2) {
    EncodingMode2[EncodingMode2["UTF8"] = 0] = "UTF8";
    EncodingMode2[EncodingMode2["ASCII"] = 1] = "ASCII";
    EncodingMode2[EncodingMode2["Extensive"] = 2] = "Extensive";
    EncodingMode2[EncodingMode2["Attribute"] = 3] = "Attribute";
    EncodingMode2[EncodingMode2["Text"] = 4] = "Text";
  })(EncodingMode || (EncodingMode = {}));

  // ../node_modules/.pnpm/dom-serializer@2.0.0/node_modules/dom-serializer/lib/esm/foreignNames.js
  var elementNames = new Map([
    "altGlyph",
    "altGlyphDef",
    "altGlyphItem",
    "animateColor",
    "animateMotion",
    "animateTransform",
    "clipPath",
    "feBlend",
    "feColorMatrix",
    "feComponentTransfer",
    "feComposite",
    "feConvolveMatrix",
    "feDiffuseLighting",
    "feDisplacementMap",
    "feDistantLight",
    "feDropShadow",
    "feFlood",
    "feFuncA",
    "feFuncB",
    "feFuncG",
    "feFuncR",
    "feGaussianBlur",
    "feImage",
    "feMerge",
    "feMergeNode",
    "feMorphology",
    "feOffset",
    "fePointLight",
    "feSpecularLighting",
    "feSpotLight",
    "feTile",
    "feTurbulence",
    "foreignObject",
    "glyphRef",
    "linearGradient",
    "radialGradient",
    "textPath"
  ].map((val) => [val.toLowerCase(), val]));
  var attributeNames = new Map([
    "definitionURL",
    "attributeName",
    "attributeType",
    "baseFrequency",
    "baseProfile",
    "calcMode",
    "clipPathUnits",
    "diffuseConstant",
    "edgeMode",
    "filterUnits",
    "glyphRef",
    "gradientTransform",
    "gradientUnits",
    "kernelMatrix",
    "kernelUnitLength",
    "keyPoints",
    "keySplines",
    "keyTimes",
    "lengthAdjust",
    "limitingConeAngle",
    "markerHeight",
    "markerUnits",
    "markerWidth",
    "maskContentUnits",
    "maskUnits",
    "numOctaves",
    "pathLength",
    "patternContentUnits",
    "patternTransform",
    "patternUnits",
    "pointsAtX",
    "pointsAtY",
    "pointsAtZ",
    "preserveAlpha",
    "preserveAspectRatio",
    "primitiveUnits",
    "refX",
    "refY",
    "repeatCount",
    "repeatDur",
    "requiredExtensions",
    "requiredFeatures",
    "specularConstant",
    "specularExponent",
    "spreadMethod",
    "startOffset",
    "stdDeviation",
    "stitchTiles",
    "surfaceScale",
    "systemLanguage",
    "tableValues",
    "targetX",
    "targetY",
    "textLength",
    "viewBox",
    "viewTarget",
    "xChannelSelector",
    "yChannelSelector",
    "zoomAndPan"
  ].map((val) => [val.toLowerCase(), val]));

  // ../node_modules/.pnpm/dom-serializer@2.0.0/node_modules/dom-serializer/lib/esm/index.js
  var unencodedElements = /* @__PURE__ */ new Set([
    "style",
    "script",
    "xmp",
    "iframe",
    "noembed",
    "noframes",
    "plaintext",
    "noscript"
  ]);
  function replaceQuotes(value) {
    return value.replace(/"/g, "&quot;");
  }
  function formatAttributes(attributes2, opts) {
    var _a3;
    if (!attributes2)
      return;
    const encode = ((_a3 = opts.encodeEntities) !== null && _a3 !== void 0 ? _a3 : opts.decodeEntities) === false ? replaceQuotes : opts.xmlMode || opts.encodeEntities !== "utf8" ? encodeXML : escapeAttribute;
    return Object.keys(attributes2).map((key2) => {
      var _a4, _b;
      const value = (_a4 = attributes2[key2]) !== null && _a4 !== void 0 ? _a4 : "";
      if (opts.xmlMode === "foreign") {
        key2 = (_b = attributeNames.get(key2)) !== null && _b !== void 0 ? _b : key2;
      }
      if (!opts.emptyAttrs && !opts.xmlMode && value === "") {
        return key2;
      }
      return `${key2}="${encode(value)}"`;
    }).join(" ");
  }
  var singleTag = /* @__PURE__ */ new Set([
    "area",
    "base",
    "basefont",
    "br",
    "col",
    "command",
    "embed",
    "frame",
    "hr",
    "img",
    "input",
    "isindex",
    "keygen",
    "link",
    "meta",
    "param",
    "source",
    "track",
    "wbr"
  ]);
  function render(node, options = {}) {
    const nodes = "length" in node ? node : [node];
    let output = "";
    for (let i = 0; i < nodes.length; i++) {
      output += renderNode(nodes[i], options);
    }
    return output;
  }
  var esm_default = render;
  function renderNode(node, options) {
    switch (node.type) {
      case Root:
        return render(node.children, options);
      // @ts-expect-error We don't use `Doctype` yet
      case Doctype:
      case Directive:
        return renderDirective(node);
      case Comment:
        return renderComment(node);
      case CDATA:
        return renderCdata(node);
      case Script:
      case Style:
      case Tag:
        return renderTag(node, options);
      case Text:
        return renderText(node, options);
    }
  }
  var foreignModeIntegrationPoints = /* @__PURE__ */ new Set([
    "mi",
    "mo",
    "mn",
    "ms",
    "mtext",
    "annotation-xml",
    "foreignObject",
    "desc",
    "title"
  ]);
  var foreignElements = /* @__PURE__ */ new Set(["svg", "math"]);
  function renderTag(elem, opts) {
    var _a3;
    if (opts.xmlMode === "foreign") {
      elem.name = (_a3 = elementNames.get(elem.name)) !== null && _a3 !== void 0 ? _a3 : elem.name;
      if (elem.parent && foreignModeIntegrationPoints.has(elem.parent.name)) {
        opts = { ...opts, xmlMode: false };
      }
    }
    if (!opts.xmlMode && foreignElements.has(elem.name)) {
      opts = { ...opts, xmlMode: "foreign" };
    }
    let tag = `<${elem.name}`;
    const attribs = formatAttributes(elem.attribs, opts);
    if (attribs) {
      tag += ` ${attribs}`;
    }
    if (elem.children.length === 0 && (opts.xmlMode ? (
      // In XML mode or foreign mode, and user hasn't explicitly turned off self-closing tags
      opts.selfClosingTags !== false
    ) : (
      // User explicitly asked for self-closing tags, even in HTML mode
      opts.selfClosingTags && singleTag.has(elem.name)
    ))) {
      if (!opts.xmlMode)
        tag += " ";
      tag += "/>";
    } else {
      tag += ">";
      if (elem.children.length > 0) {
        tag += render(elem.children, opts);
      }
      if (opts.xmlMode || !singleTag.has(elem.name)) {
        tag += `</${elem.name}>`;
      }
    }
    return tag;
  }
  function renderDirective(elem) {
    return `<${elem.data}>`;
  }
  function renderText(elem, opts) {
    var _a3;
    let data = elem.data || "";
    if (((_a3 = opts.encodeEntities) !== null && _a3 !== void 0 ? _a3 : opts.decodeEntities) !== false && !(!opts.xmlMode && elem.parent && unencodedElements.has(elem.parent.name))) {
      data = opts.xmlMode || opts.encodeEntities !== "utf8" ? encodeXML(data) : escapeText(data);
    }
    return data;
  }
  function renderCdata(elem) {
    return `<![CDATA[${elem.children[0].data}]]>`;
  }
  function renderComment(elem) {
    return `<!--${elem.data}-->`;
  }

  // ../node_modules/.pnpm/domutils@3.2.2/node_modules/domutils/lib/esm/stringify.js
  function getOuterHTML(node, options) {
    return esm_default(node, options);
  }
  function getInnerHTML(node, options) {
    return hasChildren(node) ? node.children.map((node2) => getOuterHTML(node2, options)).join("") : "";
  }
  function getText(node) {
    if (Array.isArray(node))
      return node.map(getText).join("");
    if (isTag2(node))
      return node.name === "br" ? "\n" : getText(node.children);
    if (isCDATA(node))
      return getText(node.children);
    if (isText(node))
      return node.data;
    return "";
  }
  function textContent(node) {
    if (Array.isArray(node))
      return node.map(textContent).join("");
    if (hasChildren(node) && !isComment(node)) {
      return textContent(node.children);
    }
    if (isText(node))
      return node.data;
    return "";
  }
  function innerText(node) {
    if (Array.isArray(node))
      return node.map(innerText).join("");
    if (hasChildren(node) && (node.type === ElementType.Tag || isCDATA(node))) {
      return innerText(node.children);
    }
    if (isText(node))
      return node.data;
    return "";
  }

  // ../node_modules/.pnpm/domutils@3.2.2/node_modules/domutils/lib/esm/traversal.js
  function getChildren(elem) {
    return hasChildren(elem) ? elem.children : [];
  }
  function getParent(elem) {
    return elem.parent || null;
  }
  function getSiblings(elem) {
    const parent = getParent(elem);
    if (parent != null)
      return getChildren(parent);
    const siblings = [elem];
    let { prev, next } = elem;
    while (prev != null) {
      siblings.unshift(prev);
      ({ prev } = prev);
    }
    while (next != null) {
      siblings.push(next);
      ({ next } = next);
    }
    return siblings;
  }
  function getAttributeValue(elem, name) {
    var _a3;
    return (_a3 = elem.attribs) === null || _a3 === void 0 ? void 0 : _a3[name];
  }
  function hasAttrib(elem, name) {
    return elem.attribs != null && Object.prototype.hasOwnProperty.call(elem.attribs, name) && elem.attribs[name] != null;
  }
  function getName(elem) {
    return elem.name;
  }
  function nextElementSibling(elem) {
    let { next } = elem;
    while (next !== null && !isTag2(next))
      ({ next } = next);
    return next;
  }
  function prevElementSibling(elem) {
    let { prev } = elem;
    while (prev !== null && !isTag2(prev))
      ({ prev } = prev);
    return prev;
  }

  // ../node_modules/.pnpm/domutils@3.2.2/node_modules/domutils/lib/esm/manipulation.js
  function removeElement(elem) {
    if (elem.prev)
      elem.prev.next = elem.next;
    if (elem.next)
      elem.next.prev = elem.prev;
    if (elem.parent) {
      const childs = elem.parent.children;
      const childsIndex = childs.lastIndexOf(elem);
      if (childsIndex >= 0) {
        childs.splice(childsIndex, 1);
      }
    }
    elem.next = null;
    elem.prev = null;
    elem.parent = null;
  }
  function replaceElement(elem, replacement) {
    const prev = replacement.prev = elem.prev;
    if (prev) {
      prev.next = replacement;
    }
    const next = replacement.next = elem.next;
    if (next) {
      next.prev = replacement;
    }
    const parent = replacement.parent = elem.parent;
    if (parent) {
      const childs = parent.children;
      childs[childs.lastIndexOf(elem)] = replacement;
      elem.parent = null;
    }
  }
  function appendChild(parent, child) {
    removeElement(child);
    child.next = null;
    child.parent = parent;
    if (parent.children.push(child) > 1) {
      const sibling = parent.children[parent.children.length - 2];
      sibling.next = child;
      child.prev = sibling;
    } else {
      child.prev = null;
    }
  }
  function append(elem, next) {
    removeElement(next);
    const { parent } = elem;
    const currNext = elem.next;
    next.next = currNext;
    next.prev = elem;
    elem.next = next;
    next.parent = parent;
    if (currNext) {
      currNext.prev = next;
      if (parent) {
        const childs = parent.children;
        childs.splice(childs.lastIndexOf(currNext), 0, next);
      }
    } else if (parent) {
      parent.children.push(next);
    }
  }
  function prependChild(parent, child) {
    removeElement(child);
    child.parent = parent;
    child.prev = null;
    if (parent.children.unshift(child) !== 1) {
      const sibling = parent.children[1];
      sibling.prev = child;
      child.next = sibling;
    } else {
      child.next = null;
    }
  }
  function prepend(elem, prev) {
    removeElement(prev);
    const { parent } = elem;
    if (parent) {
      const childs = parent.children;
      childs.splice(childs.indexOf(elem), 0, prev);
    }
    if (elem.prev) {
      elem.prev.next = prev;
    }
    prev.parent = parent;
    prev.prev = elem.prev;
    prev.next = elem;
    elem.prev = prev;
  }

  // ../node_modules/.pnpm/domutils@3.2.2/node_modules/domutils/lib/esm/querying.js
  function filter(test, node, recurse = true, limit = Infinity) {
    return find(test, Array.isArray(node) ? node : [node], recurse, limit);
  }
  function find(test, nodes, recurse, limit) {
    const result = [];
    const nodeStack = [Array.isArray(nodes) ? nodes : [nodes]];
    const indexStack = [0];
    for (; ; ) {
      if (indexStack[0] >= nodeStack[0].length) {
        if (indexStack.length === 1) {
          return result;
        }
        nodeStack.shift();
        indexStack.shift();
        continue;
      }
      const elem = nodeStack[0][indexStack[0]++];
      if (test(elem)) {
        result.push(elem);
        if (--limit <= 0)
          return result;
      }
      if (recurse && hasChildren(elem) && elem.children.length > 0) {
        indexStack.unshift(0);
        nodeStack.unshift(elem.children);
      }
    }
  }
  function findOneChild(test, nodes) {
    return nodes.find(test);
  }
  function findOne(test, nodes, recurse = true) {
    const searchedNodes = Array.isArray(nodes) ? nodes : [nodes];
    for (let i = 0; i < searchedNodes.length; i++) {
      const node = searchedNodes[i];
      if (isTag2(node) && test(node)) {
        return node;
      }
      if (recurse && hasChildren(node) && node.children.length > 0) {
        const found = findOne(test, node.children, true);
        if (found)
          return found;
      }
    }
    return null;
  }
  function existsOne(test, nodes) {
    return (Array.isArray(nodes) ? nodes : [nodes]).some((node) => isTag2(node) && test(node) || hasChildren(node) && existsOne(test, node.children));
  }
  function findAll(test, nodes) {
    const result = [];
    const nodeStack = [Array.isArray(nodes) ? nodes : [nodes]];
    const indexStack = [0];
    for (; ; ) {
      if (indexStack[0] >= nodeStack[0].length) {
        if (nodeStack.length === 1) {
          return result;
        }
        nodeStack.shift();
        indexStack.shift();
        continue;
      }
      const elem = nodeStack[0][indexStack[0]++];
      if (isTag2(elem) && test(elem))
        result.push(elem);
      if (hasChildren(elem) && elem.children.length > 0) {
        indexStack.unshift(0);
        nodeStack.unshift(elem.children);
      }
    }
  }

  // ../node_modules/.pnpm/domutils@3.2.2/node_modules/domutils/lib/esm/legacy.js
  var Checks = {
    tag_name(name) {
      if (typeof name === "function") {
        return (elem) => isTag2(elem) && name(elem.name);
      } else if (name === "*") {
        return isTag2;
      }
      return (elem) => isTag2(elem) && elem.name === name;
    },
    tag_type(type) {
      if (typeof type === "function") {
        return (elem) => type(elem.type);
      }
      return (elem) => elem.type === type;
    },
    tag_contains(data) {
      if (typeof data === "function") {
        return (elem) => isText(elem) && data(elem.data);
      }
      return (elem) => isText(elem) && elem.data === data;
    }
  };
  function getAttribCheck(attrib, value) {
    if (typeof value === "function") {
      return (elem) => isTag2(elem) && value(elem.attribs[attrib]);
    }
    return (elem) => isTag2(elem) && elem.attribs[attrib] === value;
  }
  function combineFuncs(a, b) {
    return (elem) => a(elem) || b(elem);
  }
  function compileTest(options) {
    const funcs = Object.keys(options).map((key2) => {
      const value = options[key2];
      return Object.prototype.hasOwnProperty.call(Checks, key2) ? Checks[key2](value) : getAttribCheck(key2, value);
    });
    return funcs.length === 0 ? null : funcs.reduce(combineFuncs);
  }
  function testElement(options, node) {
    const test = compileTest(options);
    return test ? test(node) : true;
  }
  function getElements(options, nodes, recurse, limit = Infinity) {
    const test = compileTest(options);
    return test ? filter(test, nodes, recurse, limit) : [];
  }
  function getElementById(id, nodes, recurse = true) {
    if (!Array.isArray(nodes))
      nodes = [nodes];
    return findOne(getAttribCheck("id", id), nodes, recurse);
  }
  function getElementsByTagName(tagName19, nodes, recurse = true, limit = Infinity) {
    return filter(Checks["tag_name"](tagName19), nodes, recurse, limit);
  }
  function getElementsByClassName(className, nodes, recurse = true, limit = Infinity) {
    return filter(getAttribCheck("class", className), nodes, recurse, limit);
  }
  function getElementsByTagType(type, nodes, recurse = true, limit = Infinity) {
    return filter(Checks["tag_type"](type), nodes, recurse, limit);
  }

  // ../node_modules/.pnpm/domutils@3.2.2/node_modules/domutils/lib/esm/helpers.js
  function removeSubsets(nodes) {
    let idx = nodes.length;
    while (--idx >= 0) {
      const node = nodes[idx];
      if (idx > 0 && nodes.lastIndexOf(node, idx - 1) >= 0) {
        nodes.splice(idx, 1);
        continue;
      }
      for (let ancestor = node.parent; ancestor; ancestor = ancestor.parent) {
        if (nodes.includes(ancestor)) {
          nodes.splice(idx, 1);
          break;
        }
      }
    }
    return nodes;
  }
  var DocumentPosition;
  (function(DocumentPosition2) {
    DocumentPosition2[DocumentPosition2["DISCONNECTED"] = 1] = "DISCONNECTED";
    DocumentPosition2[DocumentPosition2["PRECEDING"] = 2] = "PRECEDING";
    DocumentPosition2[DocumentPosition2["FOLLOWING"] = 4] = "FOLLOWING";
    DocumentPosition2[DocumentPosition2["CONTAINS"] = 8] = "CONTAINS";
    DocumentPosition2[DocumentPosition2["CONTAINED_BY"] = 16] = "CONTAINED_BY";
  })(DocumentPosition || (DocumentPosition = {}));
  function compareDocumentPosition(nodeA, nodeB) {
    const aParents = [];
    const bParents = [];
    if (nodeA === nodeB) {
      return 0;
    }
    let current = hasChildren(nodeA) ? nodeA : nodeA.parent;
    while (current) {
      aParents.unshift(current);
      current = current.parent;
    }
    current = hasChildren(nodeB) ? nodeB : nodeB.parent;
    while (current) {
      bParents.unshift(current);
      current = current.parent;
    }
    const maxIdx = Math.min(aParents.length, bParents.length);
    let idx = 0;
    while (idx < maxIdx && aParents[idx] === bParents[idx]) {
      idx++;
    }
    if (idx === 0) {
      return DocumentPosition.DISCONNECTED;
    }
    const sharedParent = aParents[idx - 1];
    const siblings = sharedParent.children;
    const aSibling = aParents[idx];
    const bSibling = bParents[idx];
    if (siblings.indexOf(aSibling) > siblings.indexOf(bSibling)) {
      if (sharedParent === nodeB) {
        return DocumentPosition.FOLLOWING | DocumentPosition.CONTAINED_BY;
      }
      return DocumentPosition.FOLLOWING;
    }
    if (sharedParent === nodeA) {
      return DocumentPosition.PRECEDING | DocumentPosition.CONTAINS;
    }
    return DocumentPosition.PRECEDING;
  }
  function uniqueSort(nodes) {
    nodes = nodes.filter((node, i, arr) => !arr.includes(node, i + 1));
    nodes.sort((a, b) => {
      const relative = compareDocumentPosition(a, b);
      if (relative & DocumentPosition.PRECEDING) {
        return -1;
      } else if (relative & DocumentPosition.FOLLOWING) {
        return 1;
      }
      return 0;
    });
    return nodes;
  }

  // ../node_modules/.pnpm/domutils@3.2.2/node_modules/domutils/lib/esm/feeds.js
  function getFeed(doc) {
    const feedRoot = getOneElement(isValidFeed, doc);
    return !feedRoot ? null : feedRoot.name === "feed" ? getAtomFeed(feedRoot) : getRssFeed(feedRoot);
  }
  function getAtomFeed(feedRoot) {
    var _a3;
    const childs = feedRoot.children;
    const feed = {
      type: "atom",
      items: getElementsByTagName("entry", childs).map((item) => {
        var _a4;
        const { children } = item;
        const entry = { media: getMediaElements(children) };
        addConditionally(entry, "id", "id", children);
        addConditionally(entry, "title", "title", children);
        const href2 = (_a4 = getOneElement("link", children)) === null || _a4 === void 0 ? void 0 : _a4.attribs["href"];
        if (href2) {
          entry.link = href2;
        }
        const description = fetch("summary", children) || fetch("content", children);
        if (description) {
          entry.description = description;
        }
        const pubDate = fetch("updated", children);
        if (pubDate) {
          entry.pubDate = new Date(pubDate);
        }
        return entry;
      })
    };
    addConditionally(feed, "id", "id", childs);
    addConditionally(feed, "title", "title", childs);
    const href = (_a3 = getOneElement("link", childs)) === null || _a3 === void 0 ? void 0 : _a3.attribs["href"];
    if (href) {
      feed.link = href;
    }
    addConditionally(feed, "description", "subtitle", childs);
    const updated = fetch("updated", childs);
    if (updated) {
      feed.updated = new Date(updated);
    }
    addConditionally(feed, "author", "email", childs, true);
    return feed;
  }
  function getRssFeed(feedRoot) {
    var _a3, _b;
    const childs = (_b = (_a3 = getOneElement("channel", feedRoot.children)) === null || _a3 === void 0 ? void 0 : _a3.children) !== null && _b !== void 0 ? _b : [];
    const feed = {
      type: feedRoot.name.substr(0, 3),
      id: "",
      items: getElementsByTagName("item", feedRoot.children).map((item) => {
        const { children } = item;
        const entry = { media: getMediaElements(children) };
        addConditionally(entry, "id", "guid", children);
        addConditionally(entry, "title", "title", children);
        addConditionally(entry, "link", "link", children);
        addConditionally(entry, "description", "description", children);
        const pubDate = fetch("pubDate", children) || fetch("dc:date", children);
        if (pubDate)
          entry.pubDate = new Date(pubDate);
        return entry;
      })
    };
    addConditionally(feed, "title", "title", childs);
    addConditionally(feed, "link", "link", childs);
    addConditionally(feed, "description", "description", childs);
    const updated = fetch("lastBuildDate", childs);
    if (updated) {
      feed.updated = new Date(updated);
    }
    addConditionally(feed, "author", "managingEditor", childs, true);
    return feed;
  }
  var MEDIA_KEYS_STRING = ["url", "type", "lang"];
  var MEDIA_KEYS_INT = [
    "fileSize",
    "bitrate",
    "framerate",
    "samplingrate",
    "channels",
    "duration",
    "height",
    "width"
  ];
  function getMediaElements(where) {
    return getElementsByTagName("media:content", where).map((elem) => {
      const { attribs } = elem;
      const media = {
        medium: attribs["medium"],
        isDefault: !!attribs["isDefault"]
      };
      for (const attrib of MEDIA_KEYS_STRING) {
        if (attribs[attrib]) {
          media[attrib] = attribs[attrib];
        }
      }
      for (const attrib of MEDIA_KEYS_INT) {
        if (attribs[attrib]) {
          media[attrib] = parseInt(attribs[attrib], 10);
        }
      }
      if (attribs["expression"]) {
        media.expression = attribs["expression"];
      }
      return media;
    });
  }
  function getOneElement(tagName19, node) {
    return getElementsByTagName(tagName19, node, true, 1)[0];
  }
  function fetch(tagName19, where, recurse = false) {
    return textContent(getElementsByTagName(tagName19, where, recurse, 1)).trim();
  }
  function addConditionally(obj, prop2, tagName19, where, recurse = false) {
    const val = fetch(tagName19, where, recurse);
    if (val)
      obj[prop2] = val;
  }
  function isValidFeed(value) {
    return value === "rss" || value === "feed" || value === "rdf:RDF";
  }

  // ../node_modules/.pnpm/htmlparser2@10.1.0/node_modules/htmlparser2/dist/esm/index.js
  function parseDocument(data, options) {
    const handler4 = new DomHandler(void 0, options);
    new Parser(handler4, options).end(data);
    return handler4.root;
  }
  function parseDOM(data, options) {
    return parseDocument(data, options).children;
  }
  function createDocumentStream(callback, options, elementCallback) {
    const handler4 = new DomHandler((error) => callback(error, handler4.root), options, elementCallback);
    return new Parser(handler4, options);
  }
  function createDomStream(callback, options, elementCallback) {
    const handler4 = new DomHandler(callback, options, elementCallback);
    return new Parser(handler4, options);
  }
  var parseFeedDefaultOptions = { xmlMode: true };
  function parseFeed(feed, options = parseFeedDefaultOptions) {
    return getFeed(parseDOM(feed, options));
  }

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/shared/constants.js
  var NODE_END = -1;
  var ELEMENT_NODE = 1;
  var ATTRIBUTE_NODE = 2;
  var TEXT_NODE = 3;
  var CDATA_SECTION_NODE = 4;
  var COMMENT_NODE = 8;
  var DOCUMENT_NODE = 9;
  var DOCUMENT_TYPE_NODE = 10;
  var DOCUMENT_FRAGMENT_NODE = 11;
  var BLOCK_ELEMENTS = /* @__PURE__ */ new Set(["ARTICLE", "ASIDE", "BLOCKQUOTE", "BODY", "BR", "BUTTON", "CANVAS", "CAPTION", "COL", "COLGROUP", "DD", "DIV", "DL", "DT", "EMBED", "FIELDSET", "FIGCAPTION", "FIGURE", "FOOTER", "FORM", "H1", "H2", "H3", "H4", "H5", "H6", "LI", "UL", "OL", "P"]);
  var SHOW_ALL = -1;
  var SHOW_ELEMENT = 1;
  var SHOW_TEXT = 4;
  var SHOW_CDATA_SECTION = 8;
  var SHOW_COMMENT = 128;
  var DOCUMENT_POSITION_DISCONNECTED = 1;
  var DOCUMENT_POSITION_PRECEDING = 2;
  var DOCUMENT_POSITION_FOLLOWING = 4;
  var DOCUMENT_POSITION_CONTAINS = 8;
  var DOCUMENT_POSITION_CONTAINED_BY = 16;
  var DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC = 32;
  var SVG_NAMESPACE = "http://www.w3.org/2000/svg";

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/shared/object.js
  var {
    assign,
    create,
    defineProperties,
    entries,
    getOwnPropertyDescriptors,
    keys,
    setPrototypeOf
  } = Object;

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/shared/utils.js
  var $String = String;
  var getEnd = (node) => node.nodeType === ELEMENT_NODE ? node[END] : node;
  var ignoreCase = ({ ownerDocument }) => ownerDocument[MIME].ignoreCase;
  var knownAdjacent = (prev, next) => {
    prev[NEXT] = next;
    next[PREV] = prev;
  };
  var knownBoundaries = (prev, current, next) => {
    knownAdjacent(prev, current);
    knownAdjacent(getEnd(current), next);
  };
  var knownSegment = (prev, start, end, next) => {
    knownAdjacent(prev, start);
    knownAdjacent(getEnd(end), next);
  };
  var knownSiblings = (prev, current, next) => {
    knownAdjacent(prev, current);
    knownAdjacent(current, next);
  };
  var localCase = ({ localName, ownerDocument }) => {
    return ownerDocument[MIME].ignoreCase ? localName.toUpperCase() : localName;
  };
  var setAdjacent = (prev, next) => {
    if (prev)
      prev[NEXT] = next;
    if (next)
      next[PREV] = prev;
  };
  var htmlToFragment = (ownerDocument, html) => {
    const fragment = ownerDocument.createDocumentFragment();
    const elem = ownerDocument.createElement("");
    elem.innerHTML = html;
    const { firstChild, lastChild } = elem;
    if (firstChild) {
      knownSegment(fragment, firstChild, lastChild, fragment[END]);
      let child = firstChild;
      do {
        child.parentNode = fragment;
      } while (child !== lastChild && (child = getEnd(child)[NEXT]));
    }
    return fragment;
  };

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/shared/shadow-roots.js
  var shadowRoots = /* @__PURE__ */ new WeakMap();

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/interface/custom-element-registry.js
  var reactive = false;
  var Classes = /* @__PURE__ */ new WeakMap();
  var customElements = /* @__PURE__ */ new WeakMap();
  var attributeChangedCallback = (element, attributeName, oldValue, newValue) => {
    if (reactive && customElements.has(element) && element.attributeChangedCallback && element.constructor.observedAttributes.includes(attributeName)) {
      element.attributeChangedCallback(attributeName, oldValue, newValue);
    }
  };
  var createTrigger = (method, isConnected2) => (element) => {
    if (customElements.has(element)) {
      const info = customElements.get(element);
      if (info.connected !== isConnected2 && element.isConnected === isConnected2) {
        info.connected = isConnected2;
        if (method in element)
          element[method]();
      }
    }
  };
  var triggerConnected = createTrigger("connectedCallback", true);
  var connectedCallback = (element) => {
    if (reactive) {
      triggerConnected(element);
      if (shadowRoots.has(element))
        element = shadowRoots.get(element).shadowRoot;
      let { [NEXT]: next, [END]: end } = element;
      while (next !== end) {
        if (next.nodeType === ELEMENT_NODE)
          triggerConnected(next);
        next = next[NEXT];
      }
    }
  };
  var triggerDisconnected = createTrigger("disconnectedCallback", false);
  var disconnectedCallback = (element) => {
    if (reactive) {
      triggerDisconnected(element);
      if (shadowRoots.has(element))
        element = shadowRoots.get(element).shadowRoot;
      let { [NEXT]: next, [END]: end } = element;
      while (next !== end) {
        if (next.nodeType === ELEMENT_NODE)
          triggerDisconnected(next);
        next = next[NEXT];
      }
    }
  };
  var CustomElementRegistry = class {
    /**
     * @param {Document} ownerDocument
     */
    constructor(ownerDocument) {
      this.ownerDocument = ownerDocument;
      this.registry = /* @__PURE__ */ new Map();
      this.waiting = /* @__PURE__ */ new Map();
      this.active = false;
    }
    /**
     * @param {string} localName the custom element definition name
     * @param {Function} Class the custom element **Class** definition
     * @param {object?} options the optional object with an `extends` property
     */
    define(localName, Class, options = {}) {
      const { ownerDocument, registry, waiting } = this;
      if (registry.has(localName))
        throw new Error("unable to redefine " + localName);
      if (Classes.has(Class))
        throw new Error("unable to redefine the same class: " + Class);
      this.active = reactive = true;
      const { extends: extend } = options;
      Classes.set(Class, {
        ownerDocument,
        options: { is: extend ? localName : "" },
        localName: extend || localName
      });
      const check = extend ? (element) => {
        return element.localName === extend && element.getAttribute("is") === localName;
      } : (element) => element.localName === localName;
      registry.set(localName, { Class, check });
      if (waiting.has(localName)) {
        for (const resolve of waiting.get(localName))
          resolve(Class);
        waiting.delete(localName);
      }
      ownerDocument.querySelectorAll(
        extend ? `${extend}[is="${localName}"]` : localName
      ).forEach(this.upgrade, this);
    }
    /**
     * @param {Element} element
     */
    upgrade(element) {
      if (customElements.has(element))
        return;
      const { ownerDocument, registry } = this;
      const ce = element.getAttribute("is") || element.localName;
      if (registry.has(ce)) {
        const { Class, check } = registry.get(ce);
        if (check(element)) {
          const { attributes: attributes2, isConnected: isConnected2 } = element;
          for (const attr of attributes2)
            element.removeAttributeNode(attr);
          const values = entries(element);
          for (const [key2] of values)
            delete element[key2];
          setPrototypeOf(element, Class.prototype);
          ownerDocument[UPGRADE] = { element, values };
          new Class(ownerDocument, ce);
          customElements.set(element, { connected: isConnected2 });
          for (const attr of attributes2)
            element.setAttributeNode(attr);
          if (isConnected2 && element.connectedCallback)
            element.connectedCallback();
        }
      }
    }
    /**
     * @param {string} localName the custom element definition name
     */
    whenDefined(localName) {
      const { registry, waiting } = this;
      return new Promise((resolve) => {
        if (registry.has(localName))
          resolve(registry.get(localName).Class);
        else {
          if (!waiting.has(localName))
            waiting.set(localName, []);
          waiting.get(localName).push(resolve);
        }
      });
    }
    /**
     * @param {string} localName the custom element definition name
     * @returns {Function?} the custom element **Class**, if any
     */
    get(localName) {
      const info = this.registry.get(localName);
      return info && info.Class;
    }
    /**
     * @param {Function} Class **Class** of custom element
     * @returns {string?} found tag name or null
     */
    getName(Class) {
      if (Classes.has(Class)) {
        const { localName } = Classes.get(Class);
        return localName;
      }
      return null;
    }
  };

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/shared/parse-from-string.js
  var { Parser: Parser2 } = esm_exports3;
  var notParsing = true;
  var append2 = (self, node, active) => {
    const end = self[END];
    node.parentNode = self;
    knownBoundaries(end[PREV], node, end);
    if (active && node.nodeType === ELEMENT_NODE)
      connectedCallback(node);
    return node;
  };
  var attribute = (element, end, attribute2, value, active) => {
    attribute2[VALUE] = value;
    attribute2.ownerElement = element;
    knownSiblings(end[PREV], attribute2, end);
    if (attribute2.name === "class")
      element.className = value;
    if (active)
      attributeChangedCallback(element, attribute2.name, null, value);
  };
  var parseFromString = (document2, isHTML, markupLanguage) => {
    const { active, registry } = document2[CUSTOM_ELEMENTS];
    let node = document2;
    let ownerSVGElement = null;
    let parsingCData = false;
    notParsing = false;
    const content = new Parser2({
      // <!DOCTYPE ...>
      onprocessinginstruction(name, data) {
        if (name.toLowerCase() === "!doctype")
          document2.doctype = data.slice(name.length).trim();
      },
      // <tagName>
      onopentag(name, attributes2) {
        let create3 = true;
        if (isHTML) {
          if (ownerSVGElement) {
            node = append2(node, document2.createElementNS(SVG_NAMESPACE, name), active);
            node.ownerSVGElement = ownerSVGElement;
            create3 = false;
          } else if (name === "svg" || name === "SVG") {
            ownerSVGElement = document2.createElementNS(SVG_NAMESPACE, name);
            node = append2(node, ownerSVGElement, active);
            create3 = false;
          } else if (active) {
            const ce = name.includes("-") ? name : attributes2.is || "";
            if (ce && registry.has(ce)) {
              const { Class } = registry.get(ce);
              node = append2(node, new Class(), active);
              delete attributes2.is;
              create3 = false;
            }
          }
        }
        if (create3)
          node = append2(node, document2.createElement(name), false);
        let end = node[END];
        for (const name2 of keys(attributes2))
          attribute(node, end, document2.createAttribute(name2), attributes2[name2], active);
      },
      // #text, #comment
      oncomment(data) {
        append2(node, document2.createComment(data), active);
      },
      ontext(text) {
        if (parsingCData) {
          append2(node, document2.createCDATASection(text), active);
        } else {
          append2(node, document2.createTextNode(text), active);
        }
      },
      // #cdata
      oncdatastart() {
        parsingCData = true;
      },
      oncdataend() {
        parsingCData = false;
      },
      // </tagName>
      onclosetag() {
        if (isHTML && node === ownerSVGElement)
          ownerSVGElement = null;
        node = node.parentNode;
      }
    }, {
      lowerCaseAttributeNames: false,
      decodeEntities: true,
      xmlMode: !isHTML
    });
    content.write(markupLanguage);
    content.end();
    notParsing = true;
    return document2;
  };

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/shared/register-html-class.js
  var htmlClasses = /* @__PURE__ */ new Map();
  var registerHTMLClass = (names, Class) => {
    for (const name of [].concat(names)) {
      htmlClasses.set(name, Class);
      htmlClasses.set(name.toUpperCase(), Class);
    }
  };

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/shared/jsdon.js
  var loopSegment = ({ [NEXT]: next, [END]: end }, json) => {
    while (next !== end) {
      switch (next.nodeType) {
        case ATTRIBUTE_NODE:
          attrAsJSON(next, json);
          break;
        case TEXT_NODE:
        case COMMENT_NODE:
        case CDATA_SECTION_NODE:
          characterDataAsJSON(next, json);
          break;
        case ELEMENT_NODE:
          elementAsJSON(next, json);
          next = getEnd(next);
          break;
        case DOCUMENT_TYPE_NODE:
          documentTypeAsJSON(next, json);
          break;
      }
      next = next[NEXT];
    }
    const last = json.length - 1;
    const value = json[last];
    if (typeof value === "number" && value < 0)
      json[last] += NODE_END;
    else
      json.push(NODE_END);
  };
  var attrAsJSON = (attr, json) => {
    json.push(ATTRIBUTE_NODE, attr.name);
    const value = attr[VALUE].trim();
    if (value)
      json.push(value);
  };
  var characterDataAsJSON = (node, json) => {
    const value = node[VALUE];
    if (value.trim())
      json.push(node.nodeType, value);
  };
  var nonElementAsJSON = (node, json) => {
    json.push(node.nodeType);
    loopSegment(node, json);
  };
  var documentTypeAsJSON = ({ name, publicId, systemId }, json) => {
    json.push(DOCUMENT_TYPE_NODE, name);
    if (publicId)
      json.push(publicId);
    if (systemId)
      json.push(systemId);
  };
  var elementAsJSON = (element, json) => {
    json.push(ELEMENT_NODE, element.localName);
    loopSegment(element, json);
  };

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/interface/mutation-observer.js
  var createRecord = (type, target, element, addedNodes, removedNodes, attributeName, oldValue) => ({
    type,
    target,
    addedNodes,
    removedNodes,
    attributeName,
    oldValue,
    previousSibling: element?.previousSibling || null,
    nextSibling: element?.nextSibling || null
  });
  var queueAttribute = (observer, target, attributeName, attributeFilter, attributeOldValue, oldValue) => {
    if (!attributeFilter || attributeFilter.includes(attributeName)) {
      const { callback, records, scheduled } = observer;
      records.push(createRecord(
        "attributes",
        target,
        null,
        [],
        [],
        attributeName,
        attributeOldValue ? oldValue : void 0
      ));
      if (!scheduled) {
        observer.scheduled = true;
        Promise.resolve().then(() => {
          observer.scheduled = false;
          callback(records.splice(0), observer);
        });
      }
    }
  };
  var attributeChangedCallback2 = (element, attributeName, oldValue) => {
    const { ownerDocument } = element;
    const { active, observers } = ownerDocument[MUTATION_OBSERVER];
    if (active) {
      for (const observer of observers) {
        for (const [
          target,
          {
            childList,
            subtree,
            attributes: attributes2,
            attributeFilter,
            attributeOldValue
          }
        ] of observer.nodes) {
          if (childList) {
            if (subtree && (target === ownerDocument || target.contains(element)) || !subtree && target.children.includes(element)) {
              queueAttribute(
                observer,
                element,
                attributeName,
                attributeFilter,
                attributeOldValue,
                oldValue
              );
              break;
            }
          } else if (attributes2 && target === element) {
            queueAttribute(
              observer,
              element,
              attributeName,
              attributeFilter,
              attributeOldValue,
              oldValue
            );
            break;
          }
        }
      }
    }
  };
  var moCallback = (element, parentNode) => {
    const { ownerDocument } = element;
    const { active, observers } = ownerDocument[MUTATION_OBSERVER];
    if (active) {
      for (const observer of observers) {
        for (const [target, { subtree, childList, characterData }] of observer.nodes) {
          if (childList) {
            if (parentNode && (target === parentNode || /* c8 ignore next */
            subtree && target.contains(parentNode)) || !parentNode && (subtree && (target === ownerDocument || /* c8 ignore next */
            target.contains(element)) || !subtree && target[characterData ? "childNodes" : "children"].includes(element))) {
              const { callback, records, scheduled } = observer;
              records.push(createRecord(
                "childList",
                target,
                element,
                parentNode ? [] : [element],
                parentNode ? [element] : []
              ));
              if (!scheduled) {
                observer.scheduled = true;
                Promise.resolve().then(() => {
                  observer.scheduled = false;
                  callback(records.splice(0), observer);
                });
              }
              break;
            }
          }
        }
      }
    }
  };
  var MutationObserverClass = class {
    constructor(ownerDocument) {
      const observers = /* @__PURE__ */ new Set();
      this.observers = observers;
      this.active = false;
      this.class = class MutationObserver {
        constructor(callback) {
          this.callback = callback;
          this.nodes = /* @__PURE__ */ new Map();
          this.records = [];
          this.scheduled = false;
        }
        disconnect() {
          this.records.splice(0);
          this.nodes.clear();
          observers.delete(this);
          ownerDocument[MUTATION_OBSERVER].active = !!observers.size;
        }
        /**
         * @param {Element} target
         * @param {MutationObserverInit} options
         */
        observe(target, options = {
          subtree: false,
          childList: false,
          attributes: false,
          attributeFilter: null,
          attributeOldValue: false,
          characterData: false
          // TODO: not implemented yet
          // characterDataOldValue: false
        }) {
          if ("attributeOldValue" in options || "attributeFilter" in options)
            options.attributes = true;
          options.childList = !!options.childList;
          options.subtree = !!options.subtree;
          this.nodes.set(target, options);
          observers.add(this);
          ownerDocument[MUTATION_OBSERVER].active = true;
        }
        /**
         * @returns {MutationRecord[]}
         */
        takeRecords() {
          return this.records.splice(0);
        }
      };
    }
  };

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/shared/attributes.js
  var emptyAttributes = /* @__PURE__ */ new Set([
    "allowfullscreen",
    "allowpaymentrequest",
    "async",
    "autofocus",
    "autoplay",
    "checked",
    "class",
    "contenteditable",
    "controls",
    "default",
    "defer",
    "disabled",
    "draggable",
    "formnovalidate",
    "hidden",
    "id",
    "ismap",
    "itemscope",
    "loop",
    "multiple",
    "muted",
    "nomodule",
    "novalidate",
    "open",
    "playsinline",
    "readonly",
    "required",
    "reversed",
    "selected",
    "style",
    "truespeed"
  ]);
  var setAttribute = (element, attribute2) => {
    const { [VALUE]: value, name } = attribute2;
    attribute2.ownerElement = element;
    knownSiblings(element, attribute2, element[NEXT]);
    if (name === "class")
      element.className = value;
    attributeChangedCallback2(element, name, null);
    attributeChangedCallback(element, name, null, value);
  };
  var removeAttribute = (element, attribute2) => {
    const { [VALUE]: value, name } = attribute2;
    knownAdjacent(attribute2[PREV], attribute2[NEXT]);
    attribute2.ownerElement = attribute2[PREV] = attribute2[NEXT] = null;
    if (name === "class")
      element[CLASS_LIST] = null;
    attributeChangedCallback2(element, name, value);
    attributeChangedCallback(element, name, value, null);
  };
  var booleanAttribute = {
    get(element, name) {
      return element.hasAttribute(name);
    },
    set(element, name, value) {
      if (value)
        element.setAttribute(name, "");
      else
        element.removeAttribute(name);
    }
  };
  var numericAttribute = {
    get(element, name) {
      return parseFloat(element.getAttribute(name) || 0);
    },
    set(element, name, value) {
      element.setAttribute(name, value);
    }
  };
  var stringAttribute = {
    get(element, name) {
      return element.getAttribute(name) || "";
    },
    set(element, name, value) {
      element.setAttribute(name, value);
    }
  };

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/interface/event-target.js
  var wm = /* @__PURE__ */ new WeakMap();
  function dispatch(event, listener) {
    if (typeof listener === "function")
      listener.call(event.target, event);
    else
      listener.handleEvent(event);
    return event._stopImmediatePropagationFlag;
  }
  function invokeListeners({ currentTarget, target }) {
    const map = wm.get(currentTarget);
    if (map && map.has(this.type)) {
      const listeners = map.get(this.type);
      if (currentTarget === target) {
        this.eventPhase = this.AT_TARGET;
      } else {
        this.eventPhase = this.BUBBLING_PHASE;
      }
      this.currentTarget = currentTarget;
      this.target = target;
      for (const [listener, options] of listeners) {
        if (options && options.once)
          listeners.delete(listener);
        if (dispatch(this, listener))
          break;
      }
      delete this.currentTarget;
      delete this.target;
      return this.cancelBubble;
    }
  }
  var DOMEventTarget = class {
    constructor() {
      wm.set(this, /* @__PURE__ */ new Map());
    }
    /**
     * @protected
     */
    _getParent() {
      return null;
    }
    addEventListener(type, listener, options) {
      const map = wm.get(this);
      if (!map.has(type))
        map.set(type, /* @__PURE__ */ new Map());
      map.get(type).set(listener, options);
    }
    removeEventListener(type, listener) {
      const map = wm.get(this);
      if (map.has(type)) {
        const listeners = map.get(type);
        if (listeners.delete(listener) && !listeners.size)
          map.delete(type);
      }
    }
    dispatchEvent(event) {
      let node = this;
      event.eventPhase = event.CAPTURING_PHASE;
      while (node) {
        if (node.dispatchEvent)
          event._path.push({ currentTarget: node, target: this });
        node = event.bubbles && node._getParent && node._getParent();
      }
      event._path.some(invokeListeners, event);
      event._path = [];
      event.eventPhase = event.NONE;
      return !event.defaultPrevented;
    }
  };

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/interface/node-list.js
  var NodeList = class extends Array {
    item(i) {
      return i < this.length ? this[i] : null;
    }
  };

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/interface/node.js
  var getParentNodeCount = ({ parentNode }) => {
    let count = 0;
    while (parentNode) {
      count++;
      parentNode = parentNode.parentNode;
    }
    return count;
  };
  var Node2 = class extends DOMEventTarget {
    static get ELEMENT_NODE() {
      return ELEMENT_NODE;
    }
    static get ATTRIBUTE_NODE() {
      return ATTRIBUTE_NODE;
    }
    static get TEXT_NODE() {
      return TEXT_NODE;
    }
    static get CDATA_SECTION_NODE() {
      return CDATA_SECTION_NODE;
    }
    static get COMMENT_NODE() {
      return COMMENT_NODE;
    }
    static get DOCUMENT_NODE() {
      return DOCUMENT_NODE;
    }
    static get DOCUMENT_FRAGMENT_NODE() {
      return DOCUMENT_FRAGMENT_NODE;
    }
    static get DOCUMENT_TYPE_NODE() {
      return DOCUMENT_TYPE_NODE;
    }
    constructor(ownerDocument, localName, nodeType) {
      super();
      this.ownerDocument = ownerDocument;
      this.localName = localName;
      this.nodeType = nodeType;
      this.parentNode = null;
      this[NEXT] = null;
      this[PREV] = null;
    }
    get ELEMENT_NODE() {
      return ELEMENT_NODE;
    }
    get ATTRIBUTE_NODE() {
      return ATTRIBUTE_NODE;
    }
    get TEXT_NODE() {
      return TEXT_NODE;
    }
    get CDATA_SECTION_NODE() {
      return CDATA_SECTION_NODE;
    }
    get COMMENT_NODE() {
      return COMMENT_NODE;
    }
    get DOCUMENT_NODE() {
      return DOCUMENT_NODE;
    }
    get DOCUMENT_FRAGMENT_NODE() {
      return DOCUMENT_FRAGMENT_NODE;
    }
    get DOCUMENT_TYPE_NODE() {
      return DOCUMENT_TYPE_NODE;
    }
    get baseURI() {
      const ownerDocument = this.nodeType === DOCUMENT_NODE ? this : this.ownerDocument;
      if (ownerDocument) {
        const base = ownerDocument.querySelector("base");
        if (base)
          return base.getAttribute("href");
        const { location } = ownerDocument.defaultView;
        if (location)
          return location.href;
      }
      return null;
    }
    /* c8 ignore start */
    // mixin: node
    get isConnected() {
      return false;
    }
    get nodeName() {
      return this.localName;
    }
    get parentElement() {
      return null;
    }
    get previousSibling() {
      return null;
    }
    get previousElementSibling() {
      return null;
    }
    get nextSibling() {
      return null;
    }
    get nextElementSibling() {
      return null;
    }
    get childNodes() {
      return new NodeList();
    }
    get firstChild() {
      return null;
    }
    get lastChild() {
      return null;
    }
    // default values
    get nodeValue() {
      return null;
    }
    set nodeValue(value) {
    }
    get textContent() {
      return null;
    }
    set textContent(value) {
    }
    normalize() {
    }
    cloneNode() {
      return null;
    }
    contains() {
      return false;
    }
    /**
     * Inserts a node before a reference node as a child of this parent node.
     * @param {Node} newNode The node to be inserted.
     * @param {Node} referenceNode The node before which newNode is inserted. If this is null, then newNode is inserted at the end of node's child nodes.
     * @returns The added child
     */
    // eslint-disable-next-line no-unused-vars
    insertBefore(newNode, referenceNode) {
      return newNode;
    }
    /**
     * Adds a node to the end of the list of children of this node.
     * @param {Node} child The node to append to the given parent node.
     * @returns The appended child.
     */
    appendChild(child) {
      return child;
    }
    /**
     * Replaces a child node within this node
     * @param {Node} newChild The new node to replace oldChild.
     * @param {Node} oldChild The child to be replaced.
     * @returns The replaced Node. This is the same node as oldChild.
     */
    replaceChild(newChild, oldChild) {
      return oldChild;
    }
    /**
     * Removes a child node from the DOM.
     * @param {Node} child A Node that is the child node to be removed from the DOM.
     * @returns The removed node.
     */
    removeChild(child) {
      return child;
    }
    toString() {
      return "";
    }
    /* c8 ignore stop */
    hasChildNodes() {
      return !!this.lastChild;
    }
    isSameNode(node) {
      return this === node;
    }
    // TODO: attributes?
    compareDocumentPosition(target) {
      let result = 0;
      if (this !== target) {
        let self = getParentNodeCount(this);
        let other = getParentNodeCount(target);
        if (self < other) {
          result += DOCUMENT_POSITION_FOLLOWING;
          if (this.contains(target))
            result += DOCUMENT_POSITION_CONTAINED_BY;
        } else if (other < self) {
          result += DOCUMENT_POSITION_PRECEDING;
          if (target.contains(this))
            result += DOCUMENT_POSITION_CONTAINS;
        } else if (self && other) {
          const { childNodes } = this.parentNode;
          if (childNodes.indexOf(this) < childNodes.indexOf(target))
            result += DOCUMENT_POSITION_FOLLOWING;
          else
            result += DOCUMENT_POSITION_PRECEDING;
        }
        if (!self || !other) {
          result += DOCUMENT_POSITION_IMPLEMENTATION_SPECIFIC;
          result += DOCUMENT_POSITION_DISCONNECTED;
        }
      }
      return result;
    }
    isEqualNode(node) {
      if (this === node)
        return true;
      if (this.nodeType === node.nodeType) {
        switch (this.nodeType) {
          case DOCUMENT_NODE:
          case DOCUMENT_FRAGMENT_NODE: {
            const aNodes = this.childNodes;
            const bNodes = node.childNodes;
            return aNodes.length === bNodes.length && aNodes.every((node2, i) => node2.isEqualNode(bNodes[i]));
          }
        }
        return this.toString() === node.toString();
      }
      return false;
    }
    /**
     * @protected
     */
    _getParent() {
      return this.parentNode;
    }
    /**
     * Calling it on an element inside a standard web page will return an HTMLDocument object representing the entire page (or <iframe>).
     * Calling it on an element inside a shadow DOM will return the associated ShadowRoot.
     * @return {ShadowRoot | HTMLDocument}
     */
    getRootNode() {
      let root2 = this;
      while (root2.parentNode)
        root2 = root2.parentNode;
      return root2;
    }
  };

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/shared/text-escaper.js
  var { replace } = "";
  var ca = /[<>&\xA0]/g;
  var esca = {
    "\xA0": "&#160;",
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;"
  };
  var pe = (m) => esca[m];
  var escape2 = (es) => replace.call(es, ca, pe);

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/interface/attr.js
  var QUOTE = /"/g;
  var Attr = class _Attr extends Node2 {
    constructor(ownerDocument, name, value = "") {
      super(ownerDocument, name, ATTRIBUTE_NODE);
      this.ownerElement = null;
      this.name = $String(name);
      this[VALUE] = $String(value);
      this[CHANGED] = false;
    }
    get value() {
      return this[VALUE];
    }
    set value(newValue) {
      const { [VALUE]: oldValue, name, ownerElement } = this;
      this[VALUE] = $String(newValue);
      this[CHANGED] = true;
      if (ownerElement) {
        attributeChangedCallback2(ownerElement, name, oldValue);
        attributeChangedCallback(ownerElement, name, oldValue, this[VALUE]);
      }
    }
    cloneNode() {
      const { ownerDocument, name, [VALUE]: value } = this;
      return new _Attr(ownerDocument, name, value);
    }
    toString() {
      const { name, [VALUE]: value } = this;
      if (emptyAttributes.has(name) && !value) {
        return ignoreCase(this) ? name : `${name}=""`;
      }
      const escapedValue = (ignoreCase(this) ? value : escape2(value)).replace(QUOTE, "&quot;");
      return `${name}="${escapedValue}"`;
    }
    toJSON() {
      const json = [];
      attrAsJSON(this, json);
      return json;
    }
  };

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/shared/node.js
  var isConnected = ({ ownerDocument, parentNode }) => {
    while (parentNode) {
      if (parentNode === ownerDocument)
        return true;
      parentNode = parentNode.parentNode || parentNode.host;
    }
    return false;
  };
  var parentElement = ({ parentNode }) => {
    if (parentNode) {
      switch (parentNode.nodeType) {
        case DOCUMENT_NODE:
        case DOCUMENT_FRAGMENT_NODE:
          return null;
      }
    }
    return parentNode;
  };
  var previousSibling = ({ [PREV]: prev }) => {
    switch (prev ? prev.nodeType : 0) {
      case NODE_END:
        return prev[START];
      case TEXT_NODE:
      case COMMENT_NODE:
      case CDATA_SECTION_NODE:
        return prev;
    }
    return null;
  };
  var nextSibling = (node) => {
    const next = getEnd(node)[NEXT];
    return next && (next.nodeType === NODE_END ? null : next);
  };

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/mixin/non-document-type-child-node.js
  var nextElementSibling2 = (node) => {
    let next = nextSibling(node);
    while (next && next.nodeType !== ELEMENT_NODE)
      next = nextSibling(next);
    return next;
  };
  var previousElementSibling = (node) => {
    let prev = previousSibling(node);
    while (prev && prev.nodeType !== ELEMENT_NODE)
      prev = previousSibling(prev);
    return prev;
  };

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/mixin/child-node.js
  var asFragment = (ownerDocument, nodes) => {
    const fragment = ownerDocument.createDocumentFragment();
    fragment.append(...nodes);
    return fragment;
  };
  var before = (node, nodes) => {
    const { ownerDocument, parentNode } = node;
    if (parentNode)
      parentNode.insertBefore(
        asFragment(ownerDocument, nodes),
        node
      );
  };
  var after = (node, nodes) => {
    const { ownerDocument, parentNode } = node;
    if (parentNode)
      parentNode.insertBefore(
        asFragment(ownerDocument, nodes),
        getEnd(node)[NEXT]
      );
  };
  var replaceWith = (node, nodes) => {
    const { ownerDocument, parentNode } = node;
    if (parentNode) {
      if (nodes.includes(node))
        replaceWith(node, [node = node.cloneNode()]);
      parentNode.insertBefore(
        asFragment(ownerDocument, nodes),
        node
      );
      node.remove();
    }
  };
  var remove = (prev, current, next) => {
    const { parentNode, nodeType } = current;
    if (prev || next) {
      setAdjacent(prev, next);
      current[PREV] = null;
      getEnd(current)[NEXT] = null;
    }
    if (parentNode) {
      current.parentNode = null;
      moCallback(current, parentNode);
      if (nodeType === ELEMENT_NODE)
        disconnectedCallback(current);
    }
  };

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/interface/character-data.js
  var CharacterData = class extends Node2 {
    constructor(ownerDocument, localName, nodeType, data) {
      super(ownerDocument, localName, nodeType);
      this[VALUE] = $String(data);
    }
    // <Mixins>
    get isConnected() {
      return isConnected(this);
    }
    get parentElement() {
      return parentElement(this);
    }
    get previousSibling() {
      return previousSibling(this);
    }
    get nextSibling() {
      return nextSibling(this);
    }
    get previousElementSibling() {
      return previousElementSibling(this);
    }
    get nextElementSibling() {
      return nextElementSibling2(this);
    }
    before(...nodes) {
      before(this, nodes);
    }
    after(...nodes) {
      after(this, nodes);
    }
    replaceWith(...nodes) {
      replaceWith(this, nodes);
    }
    remove() {
      remove(this[PREV], this, this[NEXT]);
    }
    // </Mixins>
    // CharacterData only
    /* c8 ignore start */
    get data() {
      return this[VALUE];
    }
    set data(value) {
      this[VALUE] = $String(value);
      moCallback(this, this.parentNode);
    }
    get nodeValue() {
      return this.data;
    }
    set nodeValue(value) {
      this.data = value;
    }
    get textContent() {
      return this.data;
    }
    set textContent(value) {
      this.data = value;
    }
    get length() {
      return this.data.length;
    }
    substringData(offset, count) {
      return this.data.substr(offset, count);
    }
    appendData(data) {
      this.data += data;
    }
    insertData(offset, data) {
      const { data: t } = this;
      this.data = t.slice(0, offset) + data + t.slice(offset);
    }
    deleteData(offset, count) {
      const { data: t } = this;
      this.data = t.slice(0, offset) + t.slice(offset + count);
    }
    replaceData(offset, count, data) {
      const { data: t } = this;
      this.data = t.slice(0, offset) + data + t.slice(offset + count);
    }
    /* c8 ignore stop */
    toJSON() {
      const json = [];
      characterDataAsJSON(this, json);
      return json;
    }
  };

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/interface/cdata-section.js
  var CDATASection = class _CDATASection extends CharacterData {
    constructor(ownerDocument, data = "") {
      super(ownerDocument, "#cdatasection", CDATA_SECTION_NODE, data);
    }
    cloneNode() {
      const { ownerDocument, [VALUE]: data } = this;
      return new _CDATASection(ownerDocument, data);
    }
    toString() {
      return `<![CDATA[${this[VALUE]}]]>`;
    }
  };

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/interface/comment.js
  var Comment3 = class _Comment extends CharacterData {
    constructor(ownerDocument, data = "") {
      super(ownerDocument, "#comment", COMMENT_NODE, data);
    }
    cloneNode() {
      const { ownerDocument, [VALUE]: data } = this;
      return new _Comment(ownerDocument, data);
    }
    toString() {
      return `<!--${this[VALUE]}-->`;
    }
  };

  // ../node_modules/.pnpm/css-select@5.2.2/node_modules/css-select/lib/esm/index.js
  var import_boolbase6 = __toESM(require_boolbase(), 1);

  // ../node_modules/.pnpm/css-what@6.2.2/node_modules/css-what/lib/es/types.js
  var SelectorType;
  (function(SelectorType2) {
    SelectorType2["Attribute"] = "attribute";
    SelectorType2["Pseudo"] = "pseudo";
    SelectorType2["PseudoElement"] = "pseudo-element";
    SelectorType2["Tag"] = "tag";
    SelectorType2["Universal"] = "universal";
    SelectorType2["Adjacent"] = "adjacent";
    SelectorType2["Child"] = "child";
    SelectorType2["Descendant"] = "descendant";
    SelectorType2["Parent"] = "parent";
    SelectorType2["Sibling"] = "sibling";
    SelectorType2["ColumnCombinator"] = "column-combinator";
  })(SelectorType || (SelectorType = {}));
  var AttributeAction;
  (function(AttributeAction2) {
    AttributeAction2["Any"] = "any";
    AttributeAction2["Element"] = "element";
    AttributeAction2["End"] = "end";
    AttributeAction2["Equals"] = "equals";
    AttributeAction2["Exists"] = "exists";
    AttributeAction2["Hyphen"] = "hyphen";
    AttributeAction2["Not"] = "not";
    AttributeAction2["Start"] = "start";
  })(AttributeAction || (AttributeAction = {}));

  // ../node_modules/.pnpm/css-what@6.2.2/node_modules/css-what/lib/es/parse.js
  var reName = /^[^\\#]?(?:\\(?:[\da-f]{1,6}\s?|.)|[\w\-\u00b0-\uFFFF])+/;
  var reEscape = /\\([\da-f]{1,6}\s?|(\s)|.)/gi;
  var actionTypes = /* @__PURE__ */ new Map([
    [126, AttributeAction.Element],
    [94, AttributeAction.Start],
    [36, AttributeAction.End],
    [42, AttributeAction.Any],
    [33, AttributeAction.Not],
    [124, AttributeAction.Hyphen]
  ]);
  var unpackPseudos = /* @__PURE__ */ new Set([
    "has",
    "not",
    "matches",
    "is",
    "where",
    "host",
    "host-context"
  ]);
  function isTraversal(selector) {
    switch (selector.type) {
      case SelectorType.Adjacent:
      case SelectorType.Child:
      case SelectorType.Descendant:
      case SelectorType.Parent:
      case SelectorType.Sibling:
      case SelectorType.ColumnCombinator:
        return true;
      default:
        return false;
    }
  }
  var stripQuotesFromPseudos = /* @__PURE__ */ new Set(["contains", "icontains"]);
  function funescape(_, escaped, escapedWhitespace) {
    const high = parseInt(escaped, 16) - 65536;
    return high !== high || escapedWhitespace ? escaped : high < 0 ? (
      // BMP codepoint
      String.fromCharCode(high + 65536)
    ) : (
      // Supplemental Plane codepoint (surrogate pair)
      String.fromCharCode(high >> 10 | 55296, high & 1023 | 56320)
    );
  }
  function unescapeCSS(str) {
    return str.replace(reEscape, funescape);
  }
  function isQuote(c) {
    return c === 39 || c === 34;
  }
  function isWhitespace2(c) {
    return c === 32 || c === 9 || c === 10 || c === 12 || c === 13;
  }
  function parse(selector) {
    const subselects2 = [];
    const endIndex = parseSelector(subselects2, `${selector}`, 0);
    if (endIndex < selector.length) {
      throw new Error(`Unmatched selector: ${selector.slice(endIndex)}`);
    }
    return subselects2;
  }
  function parseSelector(subselects2, selector, selectorIndex) {
    let tokens = [];
    function getName3(offset) {
      const match = selector.slice(selectorIndex + offset).match(reName);
      if (!match) {
        throw new Error(`Expected name, found ${selector.slice(selectorIndex)}`);
      }
      const [name] = match;
      selectorIndex += offset + name.length;
      return unescapeCSS(name);
    }
    function stripWhitespace(offset) {
      selectorIndex += offset;
      while (selectorIndex < selector.length && isWhitespace2(selector.charCodeAt(selectorIndex))) {
        selectorIndex++;
      }
    }
    function readValueWithParenthesis() {
      selectorIndex += 1;
      const start = selectorIndex;
      let counter = 1;
      for (; counter > 0 && selectorIndex < selector.length; selectorIndex++) {
        if (selector.charCodeAt(selectorIndex) === 40 && !isEscaped(selectorIndex)) {
          counter++;
        } else if (selector.charCodeAt(selectorIndex) === 41 && !isEscaped(selectorIndex)) {
          counter--;
        }
      }
      if (counter) {
        throw new Error("Parenthesis not matched");
      }
      return unescapeCSS(selector.slice(start, selectorIndex - 1));
    }
    function isEscaped(pos) {
      let slashCount = 0;
      while (selector.charCodeAt(--pos) === 92)
        slashCount++;
      return (slashCount & 1) === 1;
    }
    function ensureNotTraversal() {
      if (tokens.length > 0 && isTraversal(tokens[tokens.length - 1])) {
        throw new Error("Did not expect successive traversals.");
      }
    }
    function addTraversal(type) {
      if (tokens.length > 0 && tokens[tokens.length - 1].type === SelectorType.Descendant) {
        tokens[tokens.length - 1].type = type;
        return;
      }
      ensureNotTraversal();
      tokens.push({ type });
    }
    function addSpecialAttribute(name, action) {
      tokens.push({
        type: SelectorType.Attribute,
        name,
        action,
        value: getName3(1),
        namespace: null,
        ignoreCase: "quirks"
      });
    }
    function finalizeSubselector() {
      if (tokens.length && tokens[tokens.length - 1].type === SelectorType.Descendant) {
        tokens.pop();
      }
      if (tokens.length === 0) {
        throw new Error("Empty sub-selector");
      }
      subselects2.push(tokens);
    }
    stripWhitespace(0);
    if (selector.length === selectorIndex) {
      return selectorIndex;
    }
    loop: while (selectorIndex < selector.length) {
      const firstChar = selector.charCodeAt(selectorIndex);
      switch (firstChar) {
        // Whitespace
        case 32:
        case 9:
        case 10:
        case 12:
        case 13: {
          if (tokens.length === 0 || tokens[0].type !== SelectorType.Descendant) {
            ensureNotTraversal();
            tokens.push({ type: SelectorType.Descendant });
          }
          stripWhitespace(1);
          break;
        }
        // Traversals
        case 62: {
          addTraversal(SelectorType.Child);
          stripWhitespace(1);
          break;
        }
        case 60: {
          addTraversal(SelectorType.Parent);
          stripWhitespace(1);
          break;
        }
        case 126: {
          addTraversal(SelectorType.Sibling);
          stripWhitespace(1);
          break;
        }
        case 43: {
          addTraversal(SelectorType.Adjacent);
          stripWhitespace(1);
          break;
        }
        // Special attribute selectors: .class, #id
        case 46: {
          addSpecialAttribute("class", AttributeAction.Element);
          break;
        }
        case 35: {
          addSpecialAttribute("id", AttributeAction.Equals);
          break;
        }
        case 91: {
          stripWhitespace(1);
          let name;
          let namespace = null;
          if (selector.charCodeAt(selectorIndex) === 124) {
            name = getName3(1);
          } else if (selector.startsWith("*|", selectorIndex)) {
            namespace = "*";
            name = getName3(2);
          } else {
            name = getName3(0);
            if (selector.charCodeAt(selectorIndex) === 124 && selector.charCodeAt(selectorIndex + 1) !== 61) {
              namespace = name;
              name = getName3(1);
            }
          }
          stripWhitespace(0);
          let action = AttributeAction.Exists;
          const possibleAction = actionTypes.get(selector.charCodeAt(selectorIndex));
          if (possibleAction) {
            action = possibleAction;
            if (selector.charCodeAt(selectorIndex + 1) !== 61) {
              throw new Error("Expected `=`");
            }
            stripWhitespace(2);
          } else if (selector.charCodeAt(selectorIndex) === 61) {
            action = AttributeAction.Equals;
            stripWhitespace(1);
          }
          let value = "";
          let ignoreCase2 = null;
          if (action !== "exists") {
            if (isQuote(selector.charCodeAt(selectorIndex))) {
              const quote = selector.charCodeAt(selectorIndex);
              let sectionEnd = selectorIndex + 1;
              while (sectionEnd < selector.length && (selector.charCodeAt(sectionEnd) !== quote || isEscaped(sectionEnd))) {
                sectionEnd += 1;
              }
              if (selector.charCodeAt(sectionEnd) !== quote) {
                throw new Error("Attribute value didn't end");
              }
              value = unescapeCSS(selector.slice(selectorIndex + 1, sectionEnd));
              selectorIndex = sectionEnd + 1;
            } else {
              const valueStart = selectorIndex;
              while (selectorIndex < selector.length && (!isWhitespace2(selector.charCodeAt(selectorIndex)) && selector.charCodeAt(selectorIndex) !== 93 || isEscaped(selectorIndex))) {
                selectorIndex += 1;
              }
              value = unescapeCSS(selector.slice(valueStart, selectorIndex));
            }
            stripWhitespace(0);
            const forceIgnore = selector.charCodeAt(selectorIndex) | 32;
            if (forceIgnore === 115) {
              ignoreCase2 = false;
              stripWhitespace(1);
            } else if (forceIgnore === 105) {
              ignoreCase2 = true;
              stripWhitespace(1);
            }
          }
          if (selector.charCodeAt(selectorIndex) !== 93) {
            throw new Error("Attribute selector didn't terminate");
          }
          selectorIndex += 1;
          const attributeSelector = {
            type: SelectorType.Attribute,
            name,
            action,
            value,
            namespace,
            ignoreCase: ignoreCase2
          };
          tokens.push(attributeSelector);
          break;
        }
        case 58: {
          if (selector.charCodeAt(selectorIndex + 1) === 58) {
            tokens.push({
              type: SelectorType.PseudoElement,
              name: getName3(2).toLowerCase(),
              data: selector.charCodeAt(selectorIndex) === 40 ? readValueWithParenthesis() : null
            });
            continue;
          }
          const name = getName3(1).toLowerCase();
          let data = null;
          if (selector.charCodeAt(selectorIndex) === 40) {
            if (unpackPseudos.has(name)) {
              if (isQuote(selector.charCodeAt(selectorIndex + 1))) {
                throw new Error(`Pseudo-selector ${name} cannot be quoted`);
              }
              data = [];
              selectorIndex = parseSelector(data, selector, selectorIndex + 1);
              if (selector.charCodeAt(selectorIndex) !== 41) {
                throw new Error(`Missing closing parenthesis in :${name} (${selector})`);
              }
              selectorIndex += 1;
            } else {
              data = readValueWithParenthesis();
              if (stripQuotesFromPseudos.has(name)) {
                const quot = data.charCodeAt(0);
                if (quot === data.charCodeAt(data.length - 1) && isQuote(quot)) {
                  data = data.slice(1, -1);
                }
              }
              data = unescapeCSS(data);
            }
          }
          tokens.push({ type: SelectorType.Pseudo, name, data });
          break;
        }
        case 44: {
          finalizeSubselector();
          tokens = [];
          stripWhitespace(1);
          break;
        }
        default: {
          if (selector.startsWith("/*", selectorIndex)) {
            const endIndex = selector.indexOf("*/", selectorIndex + 2);
            if (endIndex < 0) {
              throw new Error("Comment was not terminated");
            }
            selectorIndex = endIndex + 2;
            if (tokens.length === 0) {
              stripWhitespace(0);
            }
            break;
          }
          let namespace = null;
          let name;
          if (firstChar === 42) {
            selectorIndex += 1;
            name = "*";
          } else if (firstChar === 124) {
            name = "";
            if (selector.charCodeAt(selectorIndex + 1) === 124) {
              addTraversal(SelectorType.ColumnCombinator);
              stripWhitespace(2);
              break;
            }
          } else if (reName.test(selector.slice(selectorIndex))) {
            name = getName3(0);
          } else {
            break loop;
          }
          if (selector.charCodeAt(selectorIndex) === 124 && selector.charCodeAt(selectorIndex + 1) !== 124) {
            namespace = name;
            if (selector.charCodeAt(selectorIndex + 1) === 42) {
              name = "*";
              selectorIndex += 2;
            } else {
              name = getName3(1);
            }
          }
          tokens.push(name === "*" ? { type: SelectorType.Universal, namespace } : { type: SelectorType.Tag, name, namespace });
        }
      }
    }
    finalizeSubselector();
    return selectorIndex;
  }

  // ../node_modules/.pnpm/css-select@5.2.2/node_modules/css-select/lib/esm/compile.js
  var import_boolbase5 = __toESM(require_boolbase(), 1);

  // ../node_modules/.pnpm/css-select@5.2.2/node_modules/css-select/lib/esm/sort.js
  var procedure = /* @__PURE__ */ new Map([
    [SelectorType.Universal, 50],
    [SelectorType.Tag, 30],
    [SelectorType.Attribute, 1],
    [SelectorType.Pseudo, 0]
  ]);
  function isTraversal2(token) {
    return !procedure.has(token.type);
  }
  var attributes = /* @__PURE__ */ new Map([
    [AttributeAction.Exists, 10],
    [AttributeAction.Equals, 8],
    [AttributeAction.Not, 7],
    [AttributeAction.Start, 6],
    [AttributeAction.End, 6],
    [AttributeAction.Any, 5]
  ]);
  function sortByProcedure(arr) {
    const procs = arr.map(getProcedure);
    for (let i = 1; i < arr.length; i++) {
      const procNew = procs[i];
      if (procNew < 0)
        continue;
      for (let j = i - 1; j >= 0 && procNew < procs[j]; j--) {
        const token = arr[j + 1];
        arr[j + 1] = arr[j];
        arr[j] = token;
        procs[j + 1] = procs[j];
        procs[j] = procNew;
      }
    }
  }
  function getProcedure(token) {
    var _a3, _b;
    let proc = (_a3 = procedure.get(token.type)) !== null && _a3 !== void 0 ? _a3 : -1;
    if (token.type === SelectorType.Attribute) {
      proc = (_b = attributes.get(token.action)) !== null && _b !== void 0 ? _b : 4;
      if (token.action === AttributeAction.Equals && token.name === "id") {
        proc = 9;
      }
      if (token.ignoreCase) {
        proc >>= 1;
      }
    } else if (token.type === SelectorType.Pseudo) {
      if (!token.data) {
        proc = 3;
      } else if (token.name === "has" || token.name === "contains") {
        proc = 0;
      } else if (Array.isArray(token.data)) {
        proc = Math.min(...token.data.map((d) => Math.min(...d.map(getProcedure))));
        if (proc < 0) {
          proc = 0;
        }
      } else {
        proc = 2;
      }
    }
    return proc;
  }

  // ../node_modules/.pnpm/css-select@5.2.2/node_modules/css-select/lib/esm/attributes.js
  var import_boolbase = __toESM(require_boolbase(), 1);
  var reChars = /[-[\]{}()*+?.,\\^$|#\s]/g;
  function escapeRegex(value) {
    return value.replace(reChars, "\\$&");
  }
  var caseInsensitiveAttributes = /* @__PURE__ */ new Set([
    "accept",
    "accept-charset",
    "align",
    "alink",
    "axis",
    "bgcolor",
    "charset",
    "checked",
    "clear",
    "codetype",
    "color",
    "compact",
    "declare",
    "defer",
    "dir",
    "direction",
    "disabled",
    "enctype",
    "face",
    "frame",
    "hreflang",
    "http-equiv",
    "lang",
    "language",
    "link",
    "media",
    "method",
    "multiple",
    "nohref",
    "noresize",
    "noshade",
    "nowrap",
    "readonly",
    "rel",
    "rev",
    "rules",
    "scope",
    "scrolling",
    "selected",
    "shape",
    "target",
    "text",
    "type",
    "valign",
    "valuetype",
    "vlink"
  ]);
  function shouldIgnoreCase(selector, options) {
    return typeof selector.ignoreCase === "boolean" ? selector.ignoreCase : selector.ignoreCase === "quirks" ? !!options.quirksMode : !options.xmlMode && caseInsensitiveAttributes.has(selector.name);
  }
  var attributeRules = {
    equals(next, data, options) {
      const { adapter: adapter2 } = options;
      const { name } = data;
      let { value } = data;
      if (shouldIgnoreCase(data, options)) {
        value = value.toLowerCase();
        return (elem) => {
          const attr = adapter2.getAttributeValue(elem, name);
          return attr != null && attr.length === value.length && attr.toLowerCase() === value && next(elem);
        };
      }
      return (elem) => adapter2.getAttributeValue(elem, name) === value && next(elem);
    },
    hyphen(next, data, options) {
      const { adapter: adapter2 } = options;
      const { name } = data;
      let { value } = data;
      const len = value.length;
      if (shouldIgnoreCase(data, options)) {
        value = value.toLowerCase();
        return function hyphenIC(elem) {
          const attr = adapter2.getAttributeValue(elem, name);
          return attr != null && (attr.length === len || attr.charAt(len) === "-") && attr.substr(0, len).toLowerCase() === value && next(elem);
        };
      }
      return function hyphen(elem) {
        const attr = adapter2.getAttributeValue(elem, name);
        return attr != null && (attr.length === len || attr.charAt(len) === "-") && attr.substr(0, len) === value && next(elem);
      };
    },
    element(next, data, options) {
      const { adapter: adapter2 } = options;
      const { name, value } = data;
      if (/\s/.test(value)) {
        return import_boolbase.default.falseFunc;
      }
      const regex = new RegExp(`(?:^|\\s)${escapeRegex(value)}(?:$|\\s)`, shouldIgnoreCase(data, options) ? "i" : "");
      return function element(elem) {
        const attr = adapter2.getAttributeValue(elem, name);
        return attr != null && attr.length >= value.length && regex.test(attr) && next(elem);
      };
    },
    exists(next, { name }, { adapter: adapter2 }) {
      return (elem) => adapter2.hasAttrib(elem, name) && next(elem);
    },
    start(next, data, options) {
      const { adapter: adapter2 } = options;
      const { name } = data;
      let { value } = data;
      const len = value.length;
      if (len === 0) {
        return import_boolbase.default.falseFunc;
      }
      if (shouldIgnoreCase(data, options)) {
        value = value.toLowerCase();
        return (elem) => {
          const attr = adapter2.getAttributeValue(elem, name);
          return attr != null && attr.length >= len && attr.substr(0, len).toLowerCase() === value && next(elem);
        };
      }
      return (elem) => {
        var _a3;
        return !!((_a3 = adapter2.getAttributeValue(elem, name)) === null || _a3 === void 0 ? void 0 : _a3.startsWith(value)) && next(elem);
      };
    },
    end(next, data, options) {
      const { adapter: adapter2 } = options;
      const { name } = data;
      let { value } = data;
      const len = -value.length;
      if (len === 0) {
        return import_boolbase.default.falseFunc;
      }
      if (shouldIgnoreCase(data, options)) {
        value = value.toLowerCase();
        return (elem) => {
          var _a3;
          return ((_a3 = adapter2.getAttributeValue(elem, name)) === null || _a3 === void 0 ? void 0 : _a3.substr(len).toLowerCase()) === value && next(elem);
        };
      }
      return (elem) => {
        var _a3;
        return !!((_a3 = adapter2.getAttributeValue(elem, name)) === null || _a3 === void 0 ? void 0 : _a3.endsWith(value)) && next(elem);
      };
    },
    any(next, data, options) {
      const { adapter: adapter2 } = options;
      const { name, value } = data;
      if (value === "") {
        return import_boolbase.default.falseFunc;
      }
      if (shouldIgnoreCase(data, options)) {
        const regex = new RegExp(escapeRegex(value), "i");
        return function anyIC(elem) {
          const attr = adapter2.getAttributeValue(elem, name);
          return attr != null && attr.length >= value.length && regex.test(attr) && next(elem);
        };
      }
      return (elem) => {
        var _a3;
        return !!((_a3 = adapter2.getAttributeValue(elem, name)) === null || _a3 === void 0 ? void 0 : _a3.includes(value)) && next(elem);
      };
    },
    not(next, data, options) {
      const { adapter: adapter2 } = options;
      const { name } = data;
      let { value } = data;
      if (value === "") {
        return (elem) => !!adapter2.getAttributeValue(elem, name) && next(elem);
      } else if (shouldIgnoreCase(data, options)) {
        value = value.toLowerCase();
        return (elem) => {
          const attr = adapter2.getAttributeValue(elem, name);
          return (attr == null || attr.length !== value.length || attr.toLowerCase() !== value) && next(elem);
        };
      }
      return (elem) => adapter2.getAttributeValue(elem, name) !== value && next(elem);
    }
  };

  // ../node_modules/.pnpm/nth-check@2.1.1/node_modules/nth-check/lib/esm/parse.js
  var whitespace = /* @__PURE__ */ new Set([9, 10, 12, 13, 32]);
  var ZERO = "0".charCodeAt(0);
  var NINE = "9".charCodeAt(0);
  function parse2(formula) {
    formula = formula.trim().toLowerCase();
    if (formula === "even") {
      return [2, 0];
    } else if (formula === "odd") {
      return [2, 1];
    }
    let idx = 0;
    let a = 0;
    let sign = readSign();
    let number = readNumber();
    if (idx < formula.length && formula.charAt(idx) === "n") {
      idx++;
      a = sign * (number !== null && number !== void 0 ? number : 1);
      skipWhitespace();
      if (idx < formula.length) {
        sign = readSign();
        skipWhitespace();
        number = readNumber();
      } else {
        sign = number = 0;
      }
    }
    if (number === null || idx < formula.length) {
      throw new Error(`n-th rule couldn't be parsed ('${formula}')`);
    }
    return [a, sign * number];
    function readSign() {
      if (formula.charAt(idx) === "-") {
        idx++;
        return -1;
      }
      if (formula.charAt(idx) === "+") {
        idx++;
      }
      return 1;
    }
    function readNumber() {
      const start = idx;
      let value = 0;
      while (idx < formula.length && formula.charCodeAt(idx) >= ZERO && formula.charCodeAt(idx) <= NINE) {
        value = value * 10 + (formula.charCodeAt(idx) - ZERO);
        idx++;
      }
      return idx === start ? null : value;
    }
    function skipWhitespace() {
      while (idx < formula.length && whitespace.has(formula.charCodeAt(idx))) {
        idx++;
      }
    }
  }

  // ../node_modules/.pnpm/nth-check@2.1.1/node_modules/nth-check/lib/esm/compile.js
  var import_boolbase2 = __toESM(require_boolbase(), 1);
  function compile(parsed) {
    const a = parsed[0];
    const b = parsed[1] - 1;
    if (b < 0 && a <= 0)
      return import_boolbase2.default.falseFunc;
    if (a === -1)
      return (index) => index <= b;
    if (a === 0)
      return (index) => index === b;
    if (a === 1)
      return b < 0 ? import_boolbase2.default.trueFunc : (index) => index >= b;
    const absA = Math.abs(a);
    const bMod = (b % absA + absA) % absA;
    return a > 1 ? (index) => index >= b && index % absA === bMod : (index) => index <= b && index % absA === bMod;
  }

  // ../node_modules/.pnpm/nth-check@2.1.1/node_modules/nth-check/lib/esm/index.js
  function nthCheck(formula) {
    return compile(parse2(formula));
  }

  // ../node_modules/.pnpm/css-select@5.2.2/node_modules/css-select/lib/esm/pseudo-selectors/filters.js
  var import_boolbase3 = __toESM(require_boolbase(), 1);
  function getChildFunc(next, adapter2) {
    return (elem) => {
      const parent = adapter2.getParent(elem);
      return parent != null && adapter2.isTag(parent) && next(elem);
    };
  }
  var filters = {
    contains(next, text, { adapter: adapter2 }) {
      return function contains(elem) {
        return next(elem) && adapter2.getText(elem).includes(text);
      };
    },
    icontains(next, text, { adapter: adapter2 }) {
      const itext = text.toLowerCase();
      return function icontains(elem) {
        return next(elem) && adapter2.getText(elem).toLowerCase().includes(itext);
      };
    },
    // Location specific methods
    "nth-child"(next, rule2, { adapter: adapter2, equals }) {
      const func = nthCheck(rule2);
      if (func === import_boolbase3.default.falseFunc)
        return import_boolbase3.default.falseFunc;
      if (func === import_boolbase3.default.trueFunc)
        return getChildFunc(next, adapter2);
      return function nthChild(elem) {
        const siblings = adapter2.getSiblings(elem);
        let pos = 0;
        for (let i = 0; i < siblings.length; i++) {
          if (equals(elem, siblings[i]))
            break;
          if (adapter2.isTag(siblings[i])) {
            pos++;
          }
        }
        return func(pos) && next(elem);
      };
    },
    "nth-last-child"(next, rule2, { adapter: adapter2, equals }) {
      const func = nthCheck(rule2);
      if (func === import_boolbase3.default.falseFunc)
        return import_boolbase3.default.falseFunc;
      if (func === import_boolbase3.default.trueFunc)
        return getChildFunc(next, adapter2);
      return function nthLastChild(elem) {
        const siblings = adapter2.getSiblings(elem);
        let pos = 0;
        for (let i = siblings.length - 1; i >= 0; i--) {
          if (equals(elem, siblings[i]))
            break;
          if (adapter2.isTag(siblings[i])) {
            pos++;
          }
        }
        return func(pos) && next(elem);
      };
    },
    "nth-of-type"(next, rule2, { adapter: adapter2, equals }) {
      const func = nthCheck(rule2);
      if (func === import_boolbase3.default.falseFunc)
        return import_boolbase3.default.falseFunc;
      if (func === import_boolbase3.default.trueFunc)
        return getChildFunc(next, adapter2);
      return function nthOfType(elem) {
        const siblings = adapter2.getSiblings(elem);
        let pos = 0;
        for (let i = 0; i < siblings.length; i++) {
          const currentSibling = siblings[i];
          if (equals(elem, currentSibling))
            break;
          if (adapter2.isTag(currentSibling) && adapter2.getName(currentSibling) === adapter2.getName(elem)) {
            pos++;
          }
        }
        return func(pos) && next(elem);
      };
    },
    "nth-last-of-type"(next, rule2, { adapter: adapter2, equals }) {
      const func = nthCheck(rule2);
      if (func === import_boolbase3.default.falseFunc)
        return import_boolbase3.default.falseFunc;
      if (func === import_boolbase3.default.trueFunc)
        return getChildFunc(next, adapter2);
      return function nthLastOfType(elem) {
        const siblings = adapter2.getSiblings(elem);
        let pos = 0;
        for (let i = siblings.length - 1; i >= 0; i--) {
          const currentSibling = siblings[i];
          if (equals(elem, currentSibling))
            break;
          if (adapter2.isTag(currentSibling) && adapter2.getName(currentSibling) === adapter2.getName(elem)) {
            pos++;
          }
        }
        return func(pos) && next(elem);
      };
    },
    // TODO determine the actual root element
    root(next, _rule, { adapter: adapter2 }) {
      return (elem) => {
        const parent = adapter2.getParent(elem);
        return (parent == null || !adapter2.isTag(parent)) && next(elem);
      };
    },
    scope(next, rule2, options, context) {
      const { equals } = options;
      if (!context || context.length === 0) {
        return filters["root"](next, rule2, options);
      }
      if (context.length === 1) {
        return (elem) => equals(context[0], elem) && next(elem);
      }
      return (elem) => context.includes(elem) && next(elem);
    },
    hover: dynamicStatePseudo("isHovered"),
    visited: dynamicStatePseudo("isVisited"),
    active: dynamicStatePseudo("isActive")
  };
  function dynamicStatePseudo(name) {
    return function dynamicPseudo(next, _rule, { adapter: adapter2 }) {
      const func = adapter2[name];
      if (typeof func !== "function") {
        return import_boolbase3.default.falseFunc;
      }
      return function active(elem) {
        return func(elem) && next(elem);
      };
    };
  }

  // ../node_modules/.pnpm/css-select@5.2.2/node_modules/css-select/lib/esm/pseudo-selectors/pseudos.js
  var pseudos = {
    empty(elem, { adapter: adapter2 }) {
      return !adapter2.getChildren(elem).some((elem2) => (
        // FIXME: `getText` call is potentially expensive.
        adapter2.isTag(elem2) || adapter2.getText(elem2) !== ""
      ));
    },
    "first-child"(elem, { adapter: adapter2, equals }) {
      if (adapter2.prevElementSibling) {
        return adapter2.prevElementSibling(elem) == null;
      }
      const firstChild = adapter2.getSiblings(elem).find((elem2) => adapter2.isTag(elem2));
      return firstChild != null && equals(elem, firstChild);
    },
    "last-child"(elem, { adapter: adapter2, equals }) {
      const siblings = adapter2.getSiblings(elem);
      for (let i = siblings.length - 1; i >= 0; i--) {
        if (equals(elem, siblings[i]))
          return true;
        if (adapter2.isTag(siblings[i]))
          break;
      }
      return false;
    },
    "first-of-type"(elem, { adapter: adapter2, equals }) {
      const siblings = adapter2.getSiblings(elem);
      const elemName = adapter2.getName(elem);
      for (let i = 0; i < siblings.length; i++) {
        const currentSibling = siblings[i];
        if (equals(elem, currentSibling))
          return true;
        if (adapter2.isTag(currentSibling) && adapter2.getName(currentSibling) === elemName) {
          break;
        }
      }
      return false;
    },
    "last-of-type"(elem, { adapter: adapter2, equals }) {
      const siblings = adapter2.getSiblings(elem);
      const elemName = adapter2.getName(elem);
      for (let i = siblings.length - 1; i >= 0; i--) {
        const currentSibling = siblings[i];
        if (equals(elem, currentSibling))
          return true;
        if (adapter2.isTag(currentSibling) && adapter2.getName(currentSibling) === elemName) {
          break;
        }
      }
      return false;
    },
    "only-of-type"(elem, { adapter: adapter2, equals }) {
      const elemName = adapter2.getName(elem);
      return adapter2.getSiblings(elem).every((sibling) => equals(elem, sibling) || !adapter2.isTag(sibling) || adapter2.getName(sibling) !== elemName);
    },
    "only-child"(elem, { adapter: adapter2, equals }) {
      return adapter2.getSiblings(elem).every((sibling) => equals(elem, sibling) || !adapter2.isTag(sibling));
    }
  };
  function verifyPseudoArgs(func, name, subselect, argIndex) {
    if (subselect === null) {
      if (func.length > argIndex) {
        throw new Error(`Pseudo-class :${name} requires an argument`);
      }
    } else if (func.length === argIndex) {
      throw new Error(`Pseudo-class :${name} doesn't have any arguments`);
    }
  }

  // ../node_modules/.pnpm/css-select@5.2.2/node_modules/css-select/lib/esm/pseudo-selectors/aliases.js
  var aliases = {
    // Links
    "any-link": ":is(a, area, link)[href]",
    link: ":any-link:not(:visited)",
    // Forms
    // https://html.spec.whatwg.org/multipage/scripting.html#disabled-elements
    disabled: `:is(
        :is(button, input, select, textarea, optgroup, option)[disabled],
        optgroup[disabled] > option,
        fieldset[disabled]:not(fieldset[disabled] legend:first-of-type *)
    )`,
    enabled: ":not(:disabled)",
    checked: ":is(:is(input[type=radio], input[type=checkbox])[checked], option:selected)",
    required: ":is(input, select, textarea)[required]",
    optional: ":is(input, select, textarea):not([required])",
    // JQuery extensions
    // https://html.spec.whatwg.org/multipage/form-elements.html#concept-option-selectedness
    selected: "option:is([selected], select:not([multiple]):not(:has(> option[selected])) > :first-of-type)",
    checkbox: "[type=checkbox]",
    file: "[type=file]",
    password: "[type=password]",
    radio: "[type=radio]",
    reset: "[type=reset]",
    image: "[type=image]",
    submit: "[type=submit]",
    parent: ":not(:empty)",
    header: ":is(h1, h2, h3, h4, h5, h6)",
    button: ":is(button, input[type=button])",
    input: ":is(input, textarea, select, button)",
    text: "input:is(:not([type!='']), [type=text])"
  };

  // ../node_modules/.pnpm/css-select@5.2.2/node_modules/css-select/lib/esm/pseudo-selectors/subselects.js
  var import_boolbase4 = __toESM(require_boolbase(), 1);
  var PLACEHOLDER_ELEMENT = {};
  function ensureIsTag(next, adapter2) {
    if (next === import_boolbase4.default.falseFunc)
      return import_boolbase4.default.falseFunc;
    return (elem) => adapter2.isTag(elem) && next(elem);
  }
  function getNextSiblings(elem, adapter2) {
    const siblings = adapter2.getSiblings(elem);
    if (siblings.length <= 1)
      return [];
    const elemIndex = siblings.indexOf(elem);
    if (elemIndex < 0 || elemIndex === siblings.length - 1)
      return [];
    return siblings.slice(elemIndex + 1).filter(adapter2.isTag);
  }
  function copyOptions(options) {
    return {
      xmlMode: !!options.xmlMode,
      lowerCaseAttributeNames: !!options.lowerCaseAttributeNames,
      lowerCaseTags: !!options.lowerCaseTags,
      quirksMode: !!options.quirksMode,
      cacheResults: !!options.cacheResults,
      pseudos: options.pseudos,
      adapter: options.adapter,
      equals: options.equals
    };
  }
  var is = (next, token, options, context, compileToken2) => {
    const func = compileToken2(token, copyOptions(options), context);
    return func === import_boolbase4.default.trueFunc ? next : func === import_boolbase4.default.falseFunc ? import_boolbase4.default.falseFunc : (elem) => func(elem) && next(elem);
  };
  var subselects = {
    is,
    /**
     * `:matches` and `:where` are aliases for `:is`.
     */
    matches: is,
    where: is,
    not(next, token, options, context, compileToken2) {
      const func = compileToken2(token, copyOptions(options), context);
      return func === import_boolbase4.default.falseFunc ? next : func === import_boolbase4.default.trueFunc ? import_boolbase4.default.falseFunc : (elem) => !func(elem) && next(elem);
    },
    has(next, subselect, options, _context, compileToken2) {
      const { adapter: adapter2 } = options;
      const opts = copyOptions(options);
      opts.relativeSelector = true;
      const context = subselect.some((s) => s.some(isTraversal2)) ? (
        // Used as a placeholder. Will be replaced with the actual element.
        [PLACEHOLDER_ELEMENT]
      ) : void 0;
      const compiled = compileToken2(subselect, opts, context);
      if (compiled === import_boolbase4.default.falseFunc)
        return import_boolbase4.default.falseFunc;
      const hasElement = ensureIsTag(compiled, adapter2);
      if (context && compiled !== import_boolbase4.default.trueFunc) {
        const { shouldTestNextSiblings = false } = compiled;
        return (elem) => {
          if (!next(elem))
            return false;
          context[0] = elem;
          const childs = adapter2.getChildren(elem);
          const nextElements = shouldTestNextSiblings ? [...childs, ...getNextSiblings(elem, adapter2)] : childs;
          return adapter2.existsOne(hasElement, nextElements);
        };
      }
      return (elem) => next(elem) && adapter2.existsOne(hasElement, adapter2.getChildren(elem));
    }
  };

  // ../node_modules/.pnpm/css-select@5.2.2/node_modules/css-select/lib/esm/pseudo-selectors/index.js
  function compilePseudoSelector(next, selector, options, context, compileToken2) {
    var _a3;
    const { name, data } = selector;
    if (Array.isArray(data)) {
      if (!(name in subselects)) {
        throw new Error(`Unknown pseudo-class :${name}(${data})`);
      }
      return subselects[name](next, data, options, context, compileToken2);
    }
    const userPseudo = (_a3 = options.pseudos) === null || _a3 === void 0 ? void 0 : _a3[name];
    const stringPseudo = typeof userPseudo === "string" ? userPseudo : aliases[name];
    if (typeof stringPseudo === "string") {
      if (data != null) {
        throw new Error(`Pseudo ${name} doesn't have any arguments`);
      }
      const alias = parse(stringPseudo);
      return subselects["is"](next, alias, options, context, compileToken2);
    }
    if (typeof userPseudo === "function") {
      verifyPseudoArgs(userPseudo, name, data, 1);
      return (elem) => userPseudo(elem, data) && next(elem);
    }
    if (name in filters) {
      return filters[name](next, data, options, context);
    }
    if (name in pseudos) {
      const pseudo = pseudos[name];
      verifyPseudoArgs(pseudo, name, data, 2);
      return (elem) => pseudo(elem, options, data) && next(elem);
    }
    throw new Error(`Unknown pseudo-class :${name}`);
  }

  // ../node_modules/.pnpm/css-select@5.2.2/node_modules/css-select/lib/esm/general.js
  function getElementParent(node, adapter2) {
    const parent = adapter2.getParent(node);
    if (parent && adapter2.isTag(parent)) {
      return parent;
    }
    return null;
  }
  function compileGeneralSelector(next, selector, options, context, compileToken2) {
    const { adapter: adapter2, equals } = options;
    switch (selector.type) {
      case SelectorType.PseudoElement: {
        throw new Error("Pseudo-elements are not supported by css-select");
      }
      case SelectorType.ColumnCombinator: {
        throw new Error("Column combinators are not yet supported by css-select");
      }
      case SelectorType.Attribute: {
        if (selector.namespace != null) {
          throw new Error("Namespaced attributes are not yet supported by css-select");
        }
        if (!options.xmlMode || options.lowerCaseAttributeNames) {
          selector.name = selector.name.toLowerCase();
        }
        return attributeRules[selector.action](next, selector, options);
      }
      case SelectorType.Pseudo: {
        return compilePseudoSelector(next, selector, options, context, compileToken2);
      }
      // Tags
      case SelectorType.Tag: {
        if (selector.namespace != null) {
          throw new Error("Namespaced tag names are not yet supported by css-select");
        }
        let { name } = selector;
        if (!options.xmlMode || options.lowerCaseTags) {
          name = name.toLowerCase();
        }
        return function tag(elem) {
          return adapter2.getName(elem) === name && next(elem);
        };
      }
      // Traversal
      case SelectorType.Descendant: {
        if (options.cacheResults === false || typeof WeakSet === "undefined") {
          return function descendant(elem) {
            let current = elem;
            while (current = getElementParent(current, adapter2)) {
              if (next(current)) {
                return true;
              }
            }
            return false;
          };
        }
        const isFalseCache = /* @__PURE__ */ new WeakSet();
        return function cachedDescendant(elem) {
          let current = elem;
          while (current = getElementParent(current, adapter2)) {
            if (!isFalseCache.has(current)) {
              if (adapter2.isTag(current) && next(current)) {
                return true;
              }
              isFalseCache.add(current);
            }
          }
          return false;
        };
      }
      case "_flexibleDescendant": {
        return function flexibleDescendant(elem) {
          let current = elem;
          do {
            if (next(current))
              return true;
          } while (current = getElementParent(current, adapter2));
          return false;
        };
      }
      case SelectorType.Parent: {
        return function parent(elem) {
          return adapter2.getChildren(elem).some((elem2) => adapter2.isTag(elem2) && next(elem2));
        };
      }
      case SelectorType.Child: {
        return function child(elem) {
          const parent = adapter2.getParent(elem);
          return parent != null && adapter2.isTag(parent) && next(parent);
        };
      }
      case SelectorType.Sibling: {
        return function sibling(elem) {
          const siblings = adapter2.getSiblings(elem);
          for (let i = 0; i < siblings.length; i++) {
            const currentSibling = siblings[i];
            if (equals(elem, currentSibling))
              break;
            if (adapter2.isTag(currentSibling) && next(currentSibling)) {
              return true;
            }
          }
          return false;
        };
      }
      case SelectorType.Adjacent: {
        if (adapter2.prevElementSibling) {
          return function adjacent(elem) {
            const previous = adapter2.prevElementSibling(elem);
            return previous != null && next(previous);
          };
        }
        return function adjacent(elem) {
          const siblings = adapter2.getSiblings(elem);
          let lastElement;
          for (let i = 0; i < siblings.length; i++) {
            const currentSibling = siblings[i];
            if (equals(elem, currentSibling))
              break;
            if (adapter2.isTag(currentSibling)) {
              lastElement = currentSibling;
            }
          }
          return !!lastElement && next(lastElement);
        };
      }
      case SelectorType.Universal: {
        if (selector.namespace != null && selector.namespace !== "*") {
          throw new Error("Namespaced universal selectors are not yet supported by css-select");
        }
        return next;
      }
    }
  }

  // ../node_modules/.pnpm/css-select@5.2.2/node_modules/css-select/lib/esm/compile.js
  function compile2(selector, options, context) {
    const next = compileUnsafe(selector, options, context);
    return ensureIsTag(next, options.adapter);
  }
  function compileUnsafe(selector, options, context) {
    const token = typeof selector === "string" ? parse(selector) : selector;
    return compileToken(token, options, context);
  }
  function includesScopePseudo(t) {
    return t.type === SelectorType.Pseudo && (t.name === "scope" || Array.isArray(t.data) && t.data.some((data) => data.some(includesScopePseudo)));
  }
  var DESCENDANT_TOKEN = { type: SelectorType.Descendant };
  var FLEXIBLE_DESCENDANT_TOKEN = {
    type: "_flexibleDescendant"
  };
  var SCOPE_TOKEN = {
    type: SelectorType.Pseudo,
    name: "scope",
    data: null
  };
  function absolutize(token, { adapter: adapter2 }, context) {
    const hasContext = !!(context === null || context === void 0 ? void 0 : context.every((e) => {
      const parent = adapter2.isTag(e) && adapter2.getParent(e);
      return e === PLACEHOLDER_ELEMENT || parent && adapter2.isTag(parent);
    }));
    for (const t of token) {
      if (t.length > 0 && isTraversal2(t[0]) && t[0].type !== SelectorType.Descendant) {
      } else if (hasContext && !t.some(includesScopePseudo)) {
        t.unshift(DESCENDANT_TOKEN);
      } else {
        continue;
      }
      t.unshift(SCOPE_TOKEN);
    }
  }
  function compileToken(token, options, context) {
    var _a3;
    token.forEach(sortByProcedure);
    context = (_a3 = options.context) !== null && _a3 !== void 0 ? _a3 : context;
    const isArrayContext = Array.isArray(context);
    const finalContext = context && (Array.isArray(context) ? context : [context]);
    if (options.relativeSelector !== false) {
      absolutize(token, options, finalContext);
    } else if (token.some((t) => t.length > 0 && isTraversal2(t[0]))) {
      throw new Error("Relative selectors are not allowed when the `relativeSelector` option is disabled");
    }
    let shouldTestNextSiblings = false;
    const query2 = token.map((rules) => {
      if (rules.length >= 2) {
        const [first, second] = rules;
        if (first.type !== SelectorType.Pseudo || first.name !== "scope") {
        } else if (isArrayContext && second.type === SelectorType.Descendant) {
          rules[1] = FLEXIBLE_DESCENDANT_TOKEN;
        } else if (second.type === SelectorType.Adjacent || second.type === SelectorType.Sibling) {
          shouldTestNextSiblings = true;
        }
      }
      return compileRules(rules, options, finalContext);
    }).reduce(reduceRules, import_boolbase5.default.falseFunc);
    query2.shouldTestNextSiblings = shouldTestNextSiblings;
    return query2;
  }
  function compileRules(rules, options, context) {
    var _a3;
    return rules.reduce((previous, rule2) => previous === import_boolbase5.default.falseFunc ? import_boolbase5.default.falseFunc : compileGeneralSelector(previous, rule2, options, context, compileToken), (_a3 = options.rootFunc) !== null && _a3 !== void 0 ? _a3 : import_boolbase5.default.trueFunc);
  }
  function reduceRules(a, b) {
    if (b === import_boolbase5.default.falseFunc || a === import_boolbase5.default.trueFunc) {
      return a;
    }
    if (a === import_boolbase5.default.falseFunc || b === import_boolbase5.default.trueFunc) {
      return b;
    }
    return function combine(elem) {
      return a(elem) || b(elem);
    };
  }

  // ../node_modules/.pnpm/css-select@5.2.2/node_modules/css-select/lib/esm/index.js
  var defaultEquals = (a, b) => a === b;
  var defaultOptions = {
    adapter: esm_exports2,
    equals: defaultEquals
  };
  function convertOptionFormats(options) {
    var _a3, _b, _c, _d;
    const opts = options !== null && options !== void 0 ? options : defaultOptions;
    (_a3 = opts.adapter) !== null && _a3 !== void 0 ? _a3 : opts.adapter = esm_exports2;
    (_b = opts.equals) !== null && _b !== void 0 ? _b : opts.equals = (_d = (_c = opts.adapter) === null || _c === void 0 ? void 0 : _c.equals) !== null && _d !== void 0 ? _d : defaultEquals;
    return opts;
  }
  function wrapCompile(func) {
    return function addAdapter(selector, options, context) {
      const opts = convertOptionFormats(options);
      return func(selector, opts, context);
    };
  }
  var compile3 = wrapCompile(compile2);
  var _compileUnsafe = wrapCompile(compileUnsafe);
  var _compileToken = wrapCompile(compileToken);
  function getSelectorFunc(searchFunc) {
    return function select(query2, elements, options) {
      const opts = convertOptionFormats(options);
      if (typeof query2 !== "function") {
        query2 = compileUnsafe(query2, opts, elements);
      }
      const filteredElements = prepareContext(elements, opts.adapter, query2.shouldTestNextSiblings);
      return searchFunc(query2, filteredElements, opts);
    };
  }
  function prepareContext(elems, adapter2, shouldTestNextSiblings = false) {
    if (shouldTestNextSiblings) {
      elems = appendNextSiblings(elems, adapter2);
    }
    return Array.isArray(elems) ? adapter2.removeSubsets(elems) : adapter2.getChildren(elems);
  }
  function appendNextSiblings(elem, adapter2) {
    const elems = Array.isArray(elem) ? elem.slice(0) : [elem];
    const elemsLength = elems.length;
    for (let i = 0; i < elemsLength; i++) {
      const nextSiblings = getNextSiblings(elems[i], adapter2);
      elems.push(...nextSiblings);
    }
    return elems;
  }
  var selectAll = getSelectorFunc((query2, elems, options) => query2 === import_boolbase6.default.falseFunc || !elems || elems.length === 0 ? [] : options.adapter.findAll(query2, elems));
  var selectOne = getSelectorFunc((query2, elems, options) => query2 === import_boolbase6.default.falseFunc || !elems || elems.length === 0 ? null : options.adapter.findOne(query2, elems));
  function is2(elem, query2, options) {
    const opts = convertOptionFormats(options);
    return (typeof query2 === "function" ? query2 : compile2(query2, opts))(elem);
  }

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/shared/matches.js
  var { isArray } = Array;
  var isTag3 = ({ nodeType }) => nodeType === ELEMENT_NODE;
  var existsOne2 = (test, elements) => elements.some(
    (element) => isTag3(element) && (test(element) || existsOne2(test, getChildren2(element)))
  );
  var getAttributeValue2 = (element, name) => name === "class" ? element.classList.value : element.getAttribute(name);
  var getChildren2 = ({ childNodes }) => childNodes;
  var getName2 = (element) => {
    const { localName } = element;
    return ignoreCase(element) ? localName.toLowerCase() : localName;
  };
  var getParent2 = ({ parentNode }) => parentNode;
  var getSiblings2 = (element) => {
    const { parentNode } = element;
    return parentNode ? getChildren2(parentNode) : element;
  };
  var getText2 = (node) => {
    if (isArray(node))
      return node.map(getText2).join("");
    if (isTag3(node))
      return getText2(getChildren2(node));
    if (node.nodeType === TEXT_NODE)
      return node.data;
    return "";
  };
  var hasAttrib2 = (element, name) => element.hasAttribute(name);
  var removeSubsets2 = (nodes) => {
    let { length } = nodes;
    while (length--) {
      const node = nodes[length];
      if (length && -1 < nodes.lastIndexOf(node, length - 1)) {
        nodes.splice(length, 1);
        continue;
      }
      for (let { parentNode } = node; parentNode; parentNode = parentNode.parentNode) {
        if (nodes.includes(parentNode)) {
          nodes.splice(length, 1);
          break;
        }
      }
    }
    return nodes;
  };
  var findAll2 = (test, nodes) => {
    const matches2 = [];
    for (const node of nodes) {
      if (isTag3(node)) {
        if (test(node))
          matches2.push(node);
        matches2.push(...findAll2(test, getChildren2(node)));
      }
    }
    return matches2;
  };
  var findOne2 = (test, nodes) => {
    for (let node of nodes)
      if (test(node) || (node = findOne2(test, getChildren2(node))))
        return node;
    return null;
  };
  var adapter = {
    isTag: isTag3,
    existsOne: existsOne2,
    getAttributeValue: getAttributeValue2,
    getChildren: getChildren2,
    getName: getName2,
    getParent: getParent2,
    getSiblings: getSiblings2,
    getText: getText2,
    hasAttrib: hasAttrib2,
    removeSubsets: removeSubsets2,
    findAll: findAll2,
    findOne: findOne2
  };
  var prepareMatch = (element, selectors) => compile3(
    selectors,
    {
      context: selectors.includes(":scope") ? element : void 0,
      xmlMode: !ignoreCase(element),
      adapter
    }
  );
  var matches = (element, selectors) => is2(
    element,
    selectors,
    {
      strict: true,
      context: selectors.includes(":scope") ? element : void 0,
      xmlMode: !ignoreCase(element),
      adapter
    }
  );

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/interface/text.js
  var Text3 = class _Text extends CharacterData {
    constructor(ownerDocument, data = "") {
      super(ownerDocument, "#text", TEXT_NODE, data);
    }
    get wholeText() {
      const text = [];
      let { previousSibling: previousSibling2, nextSibling: nextSibling2 } = this;
      while (previousSibling2) {
        if (previousSibling2.nodeType === TEXT_NODE)
          text.unshift(previousSibling2[VALUE]);
        else
          break;
        previousSibling2 = previousSibling2.previousSibling;
      }
      text.push(this[VALUE]);
      while (nextSibling2) {
        if (nextSibling2.nodeType === TEXT_NODE)
          text.push(nextSibling2[VALUE]);
        else
          break;
        nextSibling2 = nextSibling2.nextSibling;
      }
      return text.join("");
    }
    cloneNode() {
      const { ownerDocument, [VALUE]: data } = this;
      return new _Text(ownerDocument, data);
    }
    toString() {
      return escape2(this[VALUE]);
    }
  };

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/mixin/parent-node.js
  var isNode = (node) => node instanceof Node2;
  var insert = (parentNode, child, nodes) => {
    const { ownerDocument } = parentNode;
    for (const node of nodes)
      parentNode.insertBefore(
        isNode(node) ? node : new Text3(ownerDocument, node),
        child
      );
  };
  var ParentNode = class extends Node2 {
    constructor(ownerDocument, localName, nodeType) {
      super(ownerDocument, localName, nodeType);
      this[PRIVATE] = null;
      this[NEXT] = this[END] = {
        [NEXT]: null,
        [PREV]: this,
        [START]: this,
        nodeType: NODE_END,
        ownerDocument: this.ownerDocument,
        parentNode: null
      };
    }
    get childNodes() {
      const childNodes = new NodeList();
      let { firstChild } = this;
      while (firstChild) {
        childNodes.push(firstChild);
        firstChild = nextSibling(firstChild);
      }
      return childNodes;
    }
    get children() {
      const children = new NodeList();
      let { firstElementChild } = this;
      while (firstElementChild) {
        children.push(firstElementChild);
        firstElementChild = nextElementSibling2(firstElementChild);
      }
      return children;
    }
    /**
     * @returns {NodeStruct | null}
     */
    get firstChild() {
      let { [NEXT]: next, [END]: end } = this;
      while (next.nodeType === ATTRIBUTE_NODE)
        next = next[NEXT];
      return next === end ? null : next;
    }
    /**
     * @returns {NodeStruct | null}
     */
    get firstElementChild() {
      let { firstChild } = this;
      while (firstChild) {
        if (firstChild.nodeType === ELEMENT_NODE)
          return firstChild;
        firstChild = nextSibling(firstChild);
      }
      return null;
    }
    get lastChild() {
      const prev = this[END][PREV];
      switch (prev.nodeType) {
        case NODE_END:
          return prev[START];
        case ATTRIBUTE_NODE:
          return null;
      }
      return prev === this ? null : prev;
    }
    get lastElementChild() {
      let { lastChild } = this;
      while (lastChild) {
        if (lastChild.nodeType === ELEMENT_NODE)
          return lastChild;
        lastChild = previousSibling(lastChild);
      }
      return null;
    }
    get childElementCount() {
      return this.children.length;
    }
    prepend(...nodes) {
      insert(this, this.firstChild, nodes);
    }
    append(...nodes) {
      insert(this, this[END], nodes);
    }
    replaceChildren(...nodes) {
      let { [NEXT]: next, [END]: end } = this;
      while (next !== end && next.nodeType === ATTRIBUTE_NODE)
        next = next[NEXT];
      while (next !== end) {
        const after2 = getEnd(next)[NEXT];
        next.remove();
        next = after2;
      }
      if (nodes.length)
        insert(this, end, nodes);
    }
    getElementsByClassName(className) {
      const elements = new NodeList();
      let { [NEXT]: next, [END]: end } = this;
      while (next !== end) {
        if (next.nodeType === ELEMENT_NODE && next.hasAttribute("class") && next.classList.has(className))
          elements.push(next);
        next = next[NEXT];
      }
      return elements;
    }
    getElementsByTagName(tagName19) {
      const elements = new NodeList();
      let { [NEXT]: next, [END]: end } = this;
      while (next !== end) {
        if (next.nodeType === ELEMENT_NODE && (next.localName === tagName19 || localCase(next) === tagName19))
          elements.push(next);
        next = next[NEXT];
      }
      return elements;
    }
    querySelector(selectors) {
      const matches2 = prepareMatch(this, selectors);
      let { [NEXT]: next, [END]: end } = this;
      while (next !== end) {
        if (next.nodeType === ELEMENT_NODE && matches2(next))
          return next;
        next = next.nodeType === ELEMENT_NODE && next.localName === "template" ? next[END] : next[NEXT];
      }
      return null;
    }
    querySelectorAll(selectors) {
      const matches2 = prepareMatch(this, selectors);
      const elements = new NodeList();
      let { [NEXT]: next, [END]: end } = this;
      while (next !== end) {
        if (next.nodeType === ELEMENT_NODE && matches2(next))
          elements.push(next);
        next = next.nodeType === ELEMENT_NODE && next.localName === "template" ? next[END] : next[NEXT];
      }
      return elements;
    }
    appendChild(node) {
      return this.insertBefore(node, this[END]);
    }
    contains(node) {
      let parentNode = node;
      while (parentNode && parentNode !== this)
        parentNode = parentNode.parentNode;
      return parentNode === this;
    }
    insertBefore(node, before2 = null) {
      if (node === before2)
        return node;
      if (node === this)
        throw new Error("unable to append a node to itself");
      const next = before2 || this[END];
      switch (node.nodeType) {
        case ELEMENT_NODE:
          node.remove();
          node.parentNode = this;
          knownBoundaries(next[PREV], node, next);
          moCallback(node, null);
          connectedCallback(node);
          break;
        case DOCUMENT_FRAGMENT_NODE: {
          let { [PRIVATE]: parentNode, firstChild, lastChild } = node;
          if (firstChild) {
            knownSegment(next[PREV], firstChild, lastChild, next);
            knownAdjacent(node, node[END]);
            if (parentNode)
              parentNode.replaceChildren();
            do {
              firstChild.parentNode = this;
              moCallback(firstChild, null);
              if (firstChild.nodeType === ELEMENT_NODE)
                connectedCallback(firstChild);
            } while (firstChild !== lastChild && (firstChild = nextSibling(firstChild)));
          }
          break;
        }
        case TEXT_NODE:
        case COMMENT_NODE:
        case CDATA_SECTION_NODE:
          node.remove();
        /* eslint no-fallthrough:0 */
        // this covers DOCUMENT_TYPE_NODE too
        default:
          node.parentNode = this;
          knownSiblings(next[PREV], node, next);
          moCallback(node, null);
          break;
      }
      return node;
    }
    normalize() {
      let { [NEXT]: next, [END]: end } = this;
      while (next !== end) {
        const { [NEXT]: $next, [PREV]: $prev, nodeType } = next;
        if (nodeType === TEXT_NODE) {
          if (!next[VALUE])
            next.remove();
          else if ($prev && $prev.nodeType === TEXT_NODE) {
            $prev.textContent += next.textContent;
            next.remove();
          }
        }
        next = $next;
      }
    }
    removeChild(node) {
      if (node.parentNode !== this)
        throw new Error("node is not a child");
      node.remove();
      return node;
    }
    replaceChild(node, replaced) {
      const next = getEnd(replaced)[NEXT];
      replaced.remove();
      this.insertBefore(node, next);
      return replaced;
    }
  };

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/mixin/non-element-parent-node.js
  var NonElementParentNode = class extends ParentNode {
    getElementById(id) {
      let { [NEXT]: next, [END]: end } = this;
      while (next !== end) {
        if (next.nodeType === ELEMENT_NODE && next.id === id)
          return next;
        next = next[NEXT];
      }
      return null;
    }
    cloneNode(deep) {
      const { ownerDocument, constructor } = this;
      const nonEPN = new constructor(ownerDocument);
      if (deep) {
        const { [END]: end } = nonEPN;
        for (const node of this.childNodes)
          nonEPN.insertBefore(node.cloneNode(deep), end);
      }
      return nonEPN;
    }
    toString() {
      const { childNodes, localName } = this;
      return `<${localName}>${childNodes.join("")}</${localName}>`;
    }
    toJSON() {
      const json = [];
      nonElementAsJSON(this, json);
      return json;
    }
  };

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/interface/document-fragment.js
  var DocumentFragment = class extends NonElementParentNode {
    constructor(ownerDocument) {
      super(ownerDocument, "#document-fragment", DOCUMENT_FRAGMENT_NODE);
    }
  };

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/interface/document-type.js
  var DocumentType = class _DocumentType extends Node2 {
    constructor(ownerDocument, name, publicId = "", systemId = "") {
      super(ownerDocument, "#document-type", DOCUMENT_TYPE_NODE);
      this.name = name;
      this.publicId = publicId;
      this.systemId = systemId;
    }
    cloneNode() {
      const { ownerDocument, name, publicId, systemId } = this;
      return new _DocumentType(ownerDocument, name, publicId, systemId);
    }
    toString() {
      const { name, publicId, systemId } = this;
      const hasPublic = 0 < publicId.length;
      const str = [name];
      if (hasPublic)
        str.push("PUBLIC", `"${publicId}"`);
      if (systemId.length) {
        if (!hasPublic)
          str.push("SYSTEM");
        str.push(`"${systemId}"`);
      }
      return `<!DOCTYPE ${str.join(" ")}>`;
    }
    toJSON() {
      const json = [];
      documentTypeAsJSON(this, json);
      return json;
    }
  };

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/mixin/inner-html.js
  var getInnerHtml = (node) => node.childNodes.join("");
  var setInnerHtml = (node, html) => {
    const { ownerDocument } = node;
    const { constructor } = ownerDocument;
    const document2 = new constructor();
    document2[CUSTOM_ELEMENTS] = ownerDocument[CUSTOM_ELEMENTS];
    const { childNodes } = parseFromString(document2, ignoreCase(node), html);
    node.replaceChildren(...childNodes.map(setOwnerDocument, ownerDocument));
  };
  function setOwnerDocument(node) {
    node.ownerDocument = this;
    switch (node.nodeType) {
      case ELEMENT_NODE:
      case DOCUMENT_FRAGMENT_NODE:
        node.childNodes.forEach(setOwnerDocument, this);
        break;
    }
    return node;
  }

  // ../node_modules/.pnpm/uhyphen@0.2.0/node_modules/uhyphen/esm/index.js
  var esm_default2 = (camel) => camel.replace(/(([A-Z0-9])([A-Z0-9][a-z]))|(([a-z0-9]+)([A-Z]))/g, "$2$5-$3$6").toLowerCase();

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/dom/string-map.js
  var refs = /* @__PURE__ */ new WeakMap();
  var key = (name) => `data-${esm_default2(name)}`;
  var prop = (name) => name.slice(5).replace(/-([a-z])/g, (_, $1) => $1.toUpperCase());
  var handler = {
    get(dataset, name) {
      if (name in dataset)
        return refs.get(dataset).getAttribute(key(name));
    },
    set(dataset, name, value) {
      dataset[name] = value;
      refs.get(dataset).setAttribute(key(name), value);
      return true;
    },
    deleteProperty(dataset, name) {
      if (name in dataset)
        refs.get(dataset).removeAttribute(key(name));
      return delete dataset[name];
    }
  };
  var DOMStringMap = class {
    /**
     * @param {Element} ref
     */
    constructor(ref) {
      for (const { name, value } of ref.attributes) {
        if (/^data-/.test(name))
          this[prop(name)] = value;
      }
      refs.set(this, ref);
      return new Proxy(this, handler);
    }
  };
  setPrototypeOf(DOMStringMap.prototype, null);

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/dom/token-list.js
  var { add } = Set.prototype;
  var addTokens = (self, tokens) => {
    for (const token of tokens) {
      if (token)
        add.call(self, token);
    }
  };
  var update = ({ [OWNER_ELEMENT]: ownerElement, value }) => {
    const attribute2 = ownerElement.getAttributeNode("class");
    if (attribute2)
      attribute2.value = value;
    else
      setAttribute(
        ownerElement,
        new Attr(ownerElement.ownerDocument, "class", value)
      );
  };
  var DOMTokenList = class extends Set {
    constructor(ownerElement) {
      super();
      this[OWNER_ELEMENT] = ownerElement;
      const attribute2 = ownerElement.getAttributeNode("class");
      if (attribute2)
        addTokens(this, attribute2.value.split(/\s+/));
    }
    get length() {
      return this.size;
    }
    get value() {
      return [...this].join(" ");
    }
    /**
     * @param  {...string} tokens
     */
    add(...tokens) {
      addTokens(this, tokens);
      update(this);
    }
    /**
     * @param {string} token
     */
    contains(token) {
      return this.has(token);
    }
    /**
     * @param  {...string} tokens
     */
    remove(...tokens) {
      for (const token of tokens)
        this.delete(token);
      update(this);
    }
    /**
     * @param {string} token
     * @param {boolean?} force
     */
    toggle(token, force) {
      if (this.has(token)) {
        if (force)
          return true;
        this.delete(token);
        update(this);
      } else if (force || arguments.length === 1) {
        super.add(token);
        update(this);
        return true;
      }
      return false;
    }
    /**
     * @param {string} token
     * @param {string} newToken
     */
    replace(token, newToken) {
      if (this.has(token)) {
        this.delete(token);
        super.add(newToken);
        update(this);
        return true;
      }
      return false;
    }
    /**
     * @param {string} token
     */
    supports() {
      return true;
    }
  };

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/interface/css-style-declaration.js
  var refs2 = /* @__PURE__ */ new WeakMap();
  var getKeys = (style) => [...style.keys()].filter((key2) => key2 !== PRIVATE);
  var updateKeys = (style) => {
    const attr = refs2.get(style).getAttributeNode("style");
    if (!attr || attr[CHANGED] || style.get(PRIVATE) !== attr) {
      style.clear();
      if (attr) {
        style.set(PRIVATE, attr);
        for (const rule2 of attr[VALUE].split(/\s*;\s*/)) {
          let [key2, ...rest] = rule2.split(":");
          if (rest.length > 0) {
            key2 = key2.trim();
            const value = rest.join(":").trim();
            if (key2 && value)
              style.set(key2, value);
          }
        }
      }
    }
    return attr;
  };
  var handler2 = {
    get(style, name) {
      if (name in prototype)
        return style[name];
      updateKeys(style);
      if (name === "length")
        return getKeys(style).length;
      if (/^\d+$/.test(name))
        return getKeys(style)[name];
      return style.get(esm_default2(name));
    },
    set(style, name, value) {
      if (name === "cssText")
        style[name] = value;
      else {
        let attr = updateKeys(style);
        if (value == null)
          style.delete(esm_default2(name));
        else
          style.set(esm_default2(name), value);
        if (!attr) {
          const element = refs2.get(style);
          attr = element.ownerDocument.createAttribute("style");
          element.setAttributeNode(attr);
          style.set(PRIVATE, attr);
        }
        attr[CHANGED] = false;
        attr[VALUE] = style.toString();
      }
      return true;
    }
  };
  var CSSStyleDeclaration = class extends Map {
    constructor(element) {
      super();
      refs2.set(this, element);
      return new Proxy(this, handler2);
    }
    get cssText() {
      return this.toString();
    }
    set cssText(value) {
      refs2.get(this).setAttribute("style", value);
    }
    getPropertyValue(name) {
      const self = this[PRIVATE];
      return handler2.get(self, name);
    }
    setProperty(name, value) {
      const self = this[PRIVATE];
      handler2.set(self, name, value);
    }
    removeProperty(name) {
      const self = this[PRIVATE];
      handler2.set(self, name, null);
    }
    [Symbol.iterator]() {
      const self = this[PRIVATE];
      updateKeys(self);
      const keys2 = getKeys(self);
      const { length } = keys2;
      let i = 0;
      return {
        next() {
          const done = i === length;
          return { done, value: done ? null : keys2[i++] };
        }
      };
    }
    get [PRIVATE]() {
      return this;
    }
    toString() {
      const self = this[PRIVATE];
      updateKeys(self);
      const cssText = [];
      self.forEach(push, cssText);
      return cssText.join(";");
    }
  };
  var { prototype } = CSSStyleDeclaration;
  function push(value, key2) {
    if (key2 !== PRIVATE)
      this.push(`${key2}:${value}`);
  }

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/interface/event.js
  var BUBBLING_PHASE = 3;
  var AT_TARGET = 2;
  var CAPTURING_PHASE = 1;
  var NONE = 0;
  function getCurrentTarget(ev) {
    return ev.currentTarget;
  }
  var GlobalEvent = class {
    static get BUBBLING_PHASE() {
      return BUBBLING_PHASE;
    }
    static get AT_TARGET() {
      return AT_TARGET;
    }
    static get CAPTURING_PHASE() {
      return CAPTURING_PHASE;
    }
    static get NONE() {
      return NONE;
    }
    constructor(type, eventInitDict = {}) {
      this.type = type;
      this.bubbles = !!eventInitDict.bubbles;
      this.cancelBubble = false;
      this._stopImmediatePropagationFlag = false;
      this.cancelable = !!eventInitDict.cancelable;
      this.eventPhase = this.NONE;
      this.timeStamp = Date.now();
      this.defaultPrevented = false;
      this.originalTarget = null;
      this.returnValue = null;
      this.srcElement = null;
      this.target = null;
      this._path = [];
    }
    get BUBBLING_PHASE() {
      return BUBBLING_PHASE;
    }
    get AT_TARGET() {
      return AT_TARGET;
    }
    get CAPTURING_PHASE() {
      return CAPTURING_PHASE;
    }
    get NONE() {
      return NONE;
    }
    preventDefault() {
      this.defaultPrevented = true;
    }
    // simplified implementation, should be https://dom.spec.whatwg.org/#dom-event-composedpath
    composedPath() {
      return this._path.map(getCurrentTarget);
    }
    stopPropagation() {
      this.cancelBubble = true;
    }
    stopImmediatePropagation() {
      this.stopPropagation();
      this._stopImmediatePropagationFlag = true;
    }
  };

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/interface/named-node-map.js
  var NamedNodeMap = class extends Array {
    constructor(ownerElement) {
      super();
      this.ownerElement = ownerElement;
    }
    getNamedItem(name) {
      return this.ownerElement.getAttributeNode(name);
    }
    setNamedItem(attr) {
      this.ownerElement.setAttributeNode(attr);
      this.unshift(attr);
    }
    removeNamedItem(name) {
      const item = this.getNamedItem(name);
      this.ownerElement.removeAttribute(name);
      this.splice(this.indexOf(item), 1);
    }
    item(index) {
      return index < this.length ? this[index] : null;
    }
    /* c8 ignore start */
    getNamedItemNS(_, name) {
      return this.getNamedItem(name);
    }
    setNamedItemNS(_, attr) {
      return this.setNamedItem(attr);
    }
    removeNamedItemNS(_, name) {
      return this.removeNamedItem(name);
    }
    /* c8 ignore stop */
  };

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/interface/shadow-root.js
  var ShadowRoot = class extends NonElementParentNode {
    constructor(host) {
      super(host.ownerDocument, "#shadow-root", DOCUMENT_FRAGMENT_NODE);
      this.host = host;
    }
    get innerHTML() {
      return getInnerHtml(this);
    }
    set innerHTML(html) {
      setInnerHtml(this, html);
    }
  };

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/interface/element.js
  var attributesHandler = {
    get(target, key2) {
      return key2 in target ? target[key2] : target.find(({ name }) => name === key2);
    }
  };
  var create2 = (ownerDocument, element, localName) => {
    if ("ownerSVGElement" in element) {
      const svg = ownerDocument.createElementNS(SVG_NAMESPACE, localName);
      svg.ownerSVGElement = element.ownerSVGElement;
      return svg;
    }
    return ownerDocument.createElement(localName);
  };
  var isVoid = ({ localName, ownerDocument }) => {
    return ownerDocument[MIME].voidElements.test(localName);
  };
  var Element2 = class extends ParentNode {
    constructor(ownerDocument, localName) {
      super(ownerDocument, localName, ELEMENT_NODE);
      this[CLASS_LIST] = null;
      this[DATASET] = null;
      this[STYLE] = null;
    }
    // <Mixins>
    get isConnected() {
      return isConnected(this);
    }
    get parentElement() {
      return parentElement(this);
    }
    get previousSibling() {
      return previousSibling(this);
    }
    get nextSibling() {
      return nextSibling(this);
    }
    get namespaceURI() {
      return "http://www.w3.org/1999/xhtml";
    }
    get previousElementSibling() {
      return previousElementSibling(this);
    }
    get nextElementSibling() {
      return nextElementSibling2(this);
    }
    before(...nodes) {
      before(this, nodes);
    }
    after(...nodes) {
      after(this, nodes);
    }
    replaceWith(...nodes) {
      replaceWith(this, nodes);
    }
    remove() {
      remove(this[PREV], this, this[END][NEXT]);
    }
    // </Mixins>
    // <specialGetters>
    get id() {
      return stringAttribute.get(this, "id");
    }
    set id(value) {
      stringAttribute.set(this, "id", value);
    }
    get className() {
      return this.classList.value;
    }
    set className(value) {
      const { classList } = this;
      classList.clear();
      classList.add(...$String(value).split(/\s+/));
    }
    get nodeName() {
      return localCase(this);
    }
    get tagName() {
      return localCase(this);
    }
    get classList() {
      return this[CLASS_LIST] || (this[CLASS_LIST] = new DOMTokenList(this));
    }
    get dataset() {
      return this[DATASET] || (this[DATASET] = new DOMStringMap(this));
    }
    getBoundingClientRect() {
      return {
        x: 0,
        y: 0,
        bottom: 0,
        height: 0,
        left: 0,
        right: 0,
        top: 0,
        width: 0
      };
    }
    get nonce() {
      return stringAttribute.get(this, "nonce");
    }
    set nonce(value) {
      stringAttribute.set(this, "nonce", value);
    }
    get style() {
      return this[STYLE] || (this[STYLE] = new CSSStyleDeclaration(this));
    }
    get tabIndex() {
      return numericAttribute.get(this, "tabindex") || -1;
    }
    set tabIndex(value) {
      numericAttribute.set(this, "tabindex", value);
    }
    get slot() {
      return stringAttribute.get(this, "slot");
    }
    set slot(value) {
      stringAttribute.set(this, "slot", value);
    }
    // </specialGetters>
    // <contentRelated>
    get innerText() {
      const text = [];
      let { [NEXT]: next, [END]: end } = this;
      while (next !== end) {
        if (next.nodeType === TEXT_NODE) {
          text.push(next.textContent.replace(/\s+/g, " "));
        } else if (text.length && next[NEXT] != end && BLOCK_ELEMENTS.has(next.tagName)) {
          text.push("\n");
        }
        next = next[NEXT];
      }
      return text.join("");
    }
    /**
     * @returns {String}
     */
    get textContent() {
      const text = [];
      let { [NEXT]: next, [END]: end } = this;
      while (next !== end) {
        const nodeType = next.nodeType;
        if (nodeType === TEXT_NODE || nodeType === CDATA_SECTION_NODE)
          text.push(next.textContent);
        next = next[NEXT];
      }
      return text.join("");
    }
    set textContent(text) {
      this.replaceChildren();
      if (text != null && text !== "")
        this.appendChild(new Text3(this.ownerDocument, text));
    }
    get innerHTML() {
      return getInnerHtml(this);
    }
    set innerHTML(html) {
      setInnerHtml(this, html);
    }
    get outerHTML() {
      return this.toString();
    }
    set outerHTML(html) {
      const template = this.ownerDocument.createElement("");
      template.innerHTML = html;
      this.replaceWith(...template.childNodes);
    }
    // </contentRelated>
    // <attributes>
    get attributes() {
      const attributes2 = new NamedNodeMap(this);
      let next = this[NEXT];
      while (next.nodeType === ATTRIBUTE_NODE) {
        attributes2.push(next);
        next = next[NEXT];
      }
      return new Proxy(attributes2, attributesHandler);
    }
    focus() {
      this.dispatchEvent(new GlobalEvent("focus"));
    }
    getAttribute(name) {
      if (name === "class")
        return this.className;
      const attribute2 = this.getAttributeNode(name);
      return attribute2 && (ignoreCase(this) ? attribute2.value : escape2(attribute2.value));
    }
    getAttributeNode(name) {
      let next = this[NEXT];
      while (next.nodeType === ATTRIBUTE_NODE) {
        if (next.name === name)
          return next;
        next = next[NEXT];
      }
      return null;
    }
    getAttributeNames() {
      const attributes2 = new NodeList();
      let next = this[NEXT];
      while (next.nodeType === ATTRIBUTE_NODE) {
        attributes2.push(next.name);
        next = next[NEXT];
      }
      return attributes2;
    }
    hasAttribute(name) {
      return !!this.getAttributeNode(name);
    }
    hasAttributes() {
      return this[NEXT].nodeType === ATTRIBUTE_NODE;
    }
    removeAttribute(name) {
      if (name === "class" && this[CLASS_LIST])
        this[CLASS_LIST].clear();
      let next = this[NEXT];
      while (next.nodeType === ATTRIBUTE_NODE) {
        if (next.name === name) {
          removeAttribute(this, next);
          return;
        }
        next = next[NEXT];
      }
    }
    removeAttributeNode(attribute2) {
      let next = this[NEXT];
      while (next.nodeType === ATTRIBUTE_NODE) {
        if (next === attribute2) {
          removeAttribute(this, next);
          return;
        }
        next = next[NEXT];
      }
    }
    setAttribute(name, value) {
      if (name === "class")
        this.className = value;
      else {
        const attribute2 = this.getAttributeNode(name);
        if (attribute2)
          attribute2.value = value;
        else
          setAttribute(this, new Attr(this.ownerDocument, name, value));
      }
    }
    setAttributeNode(attribute2) {
      const { name } = attribute2;
      const previously = this.getAttributeNode(name);
      if (previously !== attribute2) {
        if (previously)
          this.removeAttributeNode(previously);
        const { ownerElement } = attribute2;
        if (ownerElement)
          ownerElement.removeAttributeNode(attribute2);
        setAttribute(this, attribute2);
      }
      return previously;
    }
    toggleAttribute(name, force) {
      if (this.hasAttribute(name)) {
        if (!force) {
          this.removeAttribute(name);
          return false;
        }
        return true;
      } else if (force || arguments.length === 1) {
        this.setAttribute(name, "");
        return true;
      }
      return false;
    }
    // </attributes>
    // <ShadowDOM>
    get shadowRoot() {
      if (shadowRoots.has(this)) {
        const { mode, shadowRoot } = shadowRoots.get(this);
        if (mode === "open")
          return shadowRoot;
      }
      return null;
    }
    attachShadow(init) {
      if (shadowRoots.has(this))
        throw new Error("operation not supported");
      const shadowRoot = new ShadowRoot(this);
      shadowRoots.set(this, {
        mode: init.mode,
        shadowRoot
      });
      return shadowRoot;
    }
    // </ShadowDOM>
    // <selectors>
    matches(selectors) {
      return matches(this, selectors);
    }
    closest(selectors) {
      let parentElement2 = this;
      const matches2 = prepareMatch(parentElement2, selectors);
      while (parentElement2 && !matches2(parentElement2))
        parentElement2 = parentElement2.parentElement;
      return parentElement2;
    }
    // </selectors>
    // <insertAdjacent>
    insertAdjacentElement(position, element) {
      const { parentElement: parentElement2 } = this;
      switch (position) {
        case "beforebegin":
          if (parentElement2) {
            parentElement2.insertBefore(element, this);
            break;
          }
          return null;
        case "afterbegin":
          this.insertBefore(element, this.firstChild);
          break;
        case "beforeend":
          this.insertBefore(element, null);
          break;
        case "afterend":
          if (parentElement2) {
            parentElement2.insertBefore(element, this.nextSibling);
            break;
          }
          return null;
      }
      return element;
    }
    insertAdjacentHTML(position, html) {
      this.insertAdjacentElement(position, htmlToFragment(this.ownerDocument, html));
    }
    insertAdjacentText(position, text) {
      const node = this.ownerDocument.createTextNode(text);
      this.insertAdjacentElement(position, node);
    }
    // </insertAdjacent>
    cloneNode(deep = false) {
      const { ownerDocument, localName } = this;
      const addNext = (next2) => {
        next2.parentNode = parentNode;
        knownAdjacent($next, next2);
        $next = next2;
      };
      const clone = create2(ownerDocument, this, localName);
      let parentNode = clone, $next = clone;
      let { [NEXT]: next, [END]: prev } = this;
      while (next !== prev && (deep || next.nodeType === ATTRIBUTE_NODE)) {
        switch (next.nodeType) {
          case NODE_END:
            knownAdjacent($next, parentNode[END]);
            $next = parentNode[END];
            parentNode = parentNode.parentNode;
            break;
          case ELEMENT_NODE: {
            const node = create2(ownerDocument, next, next.localName);
            addNext(node);
            parentNode = node;
            break;
          }
          case ATTRIBUTE_NODE: {
            const attr = next.cloneNode(deep);
            attr.ownerElement = parentNode;
            addNext(attr);
            break;
          }
          case TEXT_NODE:
          case COMMENT_NODE:
          case CDATA_SECTION_NODE:
            addNext(next.cloneNode(deep));
            break;
        }
        next = next[NEXT];
      }
      knownAdjacent($next, clone[END]);
      return clone;
    }
    // <custom>
    toString() {
      const out = [];
      const { [END]: end } = this;
      let next = { [NEXT]: this };
      let isOpened = false;
      do {
        next = next[NEXT];
        switch (next.nodeType) {
          case ATTRIBUTE_NODE: {
            const attr = " " + next;
            switch (attr) {
              case " id":
              case " class":
              case " style":
                break;
              default:
                out.push(attr);
            }
            break;
          }
          case NODE_END: {
            const start = next[START];
            if (isOpened) {
              if ("ownerSVGElement" in start)
                out.push(" />");
              else if (isVoid(start))
                out.push(ignoreCase(start) ? ">" : " />");
              else
                out.push(`></${start.localName}>`);
              isOpened = false;
            } else
              out.push(`</${start.localName}>`);
            break;
          }
          case ELEMENT_NODE:
            if (isOpened)
              out.push(">");
            if (next.toString !== this.toString) {
              out.push(next.toString());
              next = next[END];
              isOpened = false;
            } else {
              out.push(`<${next.localName}`);
              isOpened = true;
            }
            break;
          case TEXT_NODE:
          case COMMENT_NODE:
          case CDATA_SECTION_NODE:
            out.push((isOpened ? ">" : "") + next);
            isOpened = false;
            break;
        }
      } while (next !== end);
      return out.join("");
    }
    toJSON() {
      const json = [];
      elementAsJSON(this, json);
      return json;
    }
    // </custom>
    /* c8 ignore start */
    getAttributeNS(_, name) {
      return this.getAttribute(name);
    }
    getElementsByTagNameNS(_, name) {
      return this.getElementsByTagName(name);
    }
    hasAttributeNS(_, name) {
      return this.hasAttribute(name);
    }
    removeAttributeNS(_, name) {
      this.removeAttribute(name);
    }
    setAttributeNS(_, name, value) {
      this.setAttribute(name, value);
    }
    setAttributeNodeNS(attr) {
      return this.setAttributeNode(attr);
    }
    /* c8 ignore stop */
  };

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/svg/element.js
  var classNames = /* @__PURE__ */ new WeakMap();
  var handler3 = {
    get(target, name) {
      return target[name];
    },
    set(target, name, value) {
      target[name] = value;
      return true;
    }
  };
  var SVGElement = class extends Element2 {
    constructor(ownerDocument, localName, ownerSVGElement = null) {
      super(ownerDocument, localName);
      this.ownerSVGElement = ownerSVGElement;
    }
    get className() {
      if (!classNames.has(this))
        classNames.set(this, new Proxy({ baseVal: "", animVal: "" }, handler3));
      return classNames.get(this);
    }
    /* c8 ignore start */
    set className(value) {
      const { classList } = this;
      classList.clear();
      classList.add(...$String(value).split(/\s+/));
    }
    /* c8 ignore stop */
    get namespaceURI() {
      return "http://www.w3.org/2000/svg";
    }
    getAttribute(name) {
      return name === "class" ? [...this.classList].join(" ") : super.getAttribute(name);
    }
    setAttribute(name, value) {
      if (name === "class")
        this.className = value;
      else if (name === "style") {
        const { className } = this;
        className.baseVal = className.animVal = value;
      }
      super.setAttribute(name, value);
    }
  };

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/shared/facades.js
  var illegalConstructor = () => {
    throw new TypeError("Illegal constructor");
  };
  function Attr2() {
    illegalConstructor();
  }
  setPrototypeOf(Attr2, Attr);
  Attr2.prototype = Attr.prototype;
  function CDATASection2() {
    illegalConstructor();
  }
  setPrototypeOf(CDATASection2, CDATASection);
  CDATASection2.prototype = CDATASection.prototype;
  function CharacterData2() {
    illegalConstructor();
  }
  setPrototypeOf(CharacterData2, CharacterData);
  CharacterData2.prototype = CharacterData.prototype;
  function Comment4() {
    illegalConstructor();
  }
  setPrototypeOf(Comment4, Comment3);
  Comment4.prototype = Comment3.prototype;
  function DocumentFragment2() {
    illegalConstructor();
  }
  setPrototypeOf(DocumentFragment2, DocumentFragment);
  DocumentFragment2.prototype = DocumentFragment.prototype;
  function DocumentType2() {
    illegalConstructor();
  }
  setPrototypeOf(DocumentType2, DocumentType);
  DocumentType2.prototype = DocumentType.prototype;
  function Element3() {
    illegalConstructor();
  }
  setPrototypeOf(Element3, Element2);
  Element3.prototype = Element2.prototype;
  function Node3() {
    illegalConstructor();
  }
  setPrototypeOf(Node3, Node2);
  Node3.prototype = Node2.prototype;
  function ShadowRoot2() {
    illegalConstructor();
  }
  setPrototypeOf(ShadowRoot2, ShadowRoot);
  ShadowRoot2.prototype = ShadowRoot.prototype;
  function Text4() {
    illegalConstructor();
  }
  setPrototypeOf(Text4, Text3);
  Text4.prototype = Text3.prototype;
  function SVGElement2() {
    illegalConstructor();
  }
  setPrototypeOf(SVGElement2, SVGElement);
  SVGElement2.prototype = SVGElement.prototype;
  var Facades = {
    Attr: Attr2,
    CDATASection: CDATASection2,
    CharacterData: CharacterData2,
    Comment: Comment4,
    DocumentFragment: DocumentFragment2,
    DocumentType: DocumentType2,
    Element: Element3,
    Node: Node3,
    ShadowRoot: ShadowRoot2,
    Text: Text4,
    SVGElement: SVGElement2
  };

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/html/element.js
  var Level0 = /* @__PURE__ */ new WeakMap();
  var level0 = {
    get(element, name) {
      return Level0.has(element) && Level0.get(element)[name] || null;
    },
    set(element, name, value) {
      if (!Level0.has(element))
        Level0.set(element, {});
      const handlers = Level0.get(element);
      const type = name.slice(2);
      if (handlers[name])
        element.removeEventListener(type, handlers[name], false);
      if (handlers[name] = value)
        element.addEventListener(type, value, false);
    }
  };
  var HTMLElement = class extends Element2 {
    static get observedAttributes() {
      return [];
    }
    constructor(ownerDocument = null, localName = "") {
      super(ownerDocument, localName);
      const ownerLess = !ownerDocument;
      let options;
      if (ownerLess) {
        const { constructor: Class } = this;
        if (!Classes.has(Class))
          throw new Error("unable to initialize this Custom Element");
        ({ ownerDocument, localName, options } = Classes.get(Class));
      }
      if (ownerDocument[UPGRADE]) {
        const { element, values } = ownerDocument[UPGRADE];
        ownerDocument[UPGRADE] = null;
        for (const [key2, value] of values)
          element[key2] = value;
        return element;
      }
      if (ownerLess) {
        this.ownerDocument = this[END].ownerDocument = ownerDocument;
        this.localName = localName;
        customElements.set(this, { connected: false });
        if (options.is)
          this.setAttribute("is", options.is);
      }
    }
    /* c8 ignore start */
    /* TODO: what about these?
    offsetHeight
    offsetLeft
    offsetParent
    offsetTop
    offsetWidth
    */
    blur() {
      this.dispatchEvent(new GlobalEvent("blur"));
    }
    click() {
      const clickEvent = new GlobalEvent("click", { bubbles: true, cancelable: true });
      clickEvent.button = 0;
      this.dispatchEvent(clickEvent);
    }
    // Boolean getters
    get accessKeyLabel() {
      const { accessKey } = this;
      return accessKey && `Alt+Shift+${accessKey}`;
    }
    get isContentEditable() {
      return this.hasAttribute("contenteditable");
    }
    // Boolean Accessors
    get contentEditable() {
      return booleanAttribute.get(this, "contenteditable");
    }
    set contentEditable(value) {
      booleanAttribute.set(this, "contenteditable", value);
    }
    get draggable() {
      return booleanAttribute.get(this, "draggable");
    }
    set draggable(value) {
      booleanAttribute.set(this, "draggable", value);
    }
    get hidden() {
      return booleanAttribute.get(this, "hidden");
    }
    set hidden(value) {
      booleanAttribute.set(this, "hidden", value);
    }
    get spellcheck() {
      return booleanAttribute.get(this, "spellcheck");
    }
    set spellcheck(value) {
      booleanAttribute.set(this, "spellcheck", value);
    }
    // String Accessors
    get accessKey() {
      return stringAttribute.get(this, "accesskey");
    }
    set accessKey(value) {
      stringAttribute.set(this, "accesskey", value);
    }
    get dir() {
      return stringAttribute.get(this, "dir");
    }
    set dir(value) {
      stringAttribute.set(this, "dir", value);
    }
    get lang() {
      return stringAttribute.get(this, "lang");
    }
    set lang(value) {
      stringAttribute.set(this, "lang", value);
    }
    get title() {
      return stringAttribute.get(this, "title");
    }
    set title(value) {
      stringAttribute.set(this, "title", value);
    }
    // DOM Level 0
    get onabort() {
      return level0.get(this, "onabort");
    }
    set onabort(value) {
      level0.set(this, "onabort", value);
    }
    get onblur() {
      return level0.get(this, "onblur");
    }
    set onblur(value) {
      level0.set(this, "onblur", value);
    }
    get oncancel() {
      return level0.get(this, "oncancel");
    }
    set oncancel(value) {
      level0.set(this, "oncancel", value);
    }
    get oncanplay() {
      return level0.get(this, "oncanplay");
    }
    set oncanplay(value) {
      level0.set(this, "oncanplay", value);
    }
    get oncanplaythrough() {
      return level0.get(this, "oncanplaythrough");
    }
    set oncanplaythrough(value) {
      level0.set(this, "oncanplaythrough", value);
    }
    get onchange() {
      return level0.get(this, "onchange");
    }
    set onchange(value) {
      level0.set(this, "onchange", value);
    }
    get onclick() {
      return level0.get(this, "onclick");
    }
    set onclick(value) {
      level0.set(this, "onclick", value);
    }
    get onclose() {
      return level0.get(this, "onclose");
    }
    set onclose(value) {
      level0.set(this, "onclose", value);
    }
    get oncontextmenu() {
      return level0.get(this, "oncontextmenu");
    }
    set oncontextmenu(value) {
      level0.set(this, "oncontextmenu", value);
    }
    get oncuechange() {
      return level0.get(this, "oncuechange");
    }
    set oncuechange(value) {
      level0.set(this, "oncuechange", value);
    }
    get ondblclick() {
      return level0.get(this, "ondblclick");
    }
    set ondblclick(value) {
      level0.set(this, "ondblclick", value);
    }
    get ondrag() {
      return level0.get(this, "ondrag");
    }
    set ondrag(value) {
      level0.set(this, "ondrag", value);
    }
    get ondragend() {
      return level0.get(this, "ondragend");
    }
    set ondragend(value) {
      level0.set(this, "ondragend", value);
    }
    get ondragenter() {
      return level0.get(this, "ondragenter");
    }
    set ondragenter(value) {
      level0.set(this, "ondragenter", value);
    }
    get ondragleave() {
      return level0.get(this, "ondragleave");
    }
    set ondragleave(value) {
      level0.set(this, "ondragleave", value);
    }
    get ondragover() {
      return level0.get(this, "ondragover");
    }
    set ondragover(value) {
      level0.set(this, "ondragover", value);
    }
    get ondragstart() {
      return level0.get(this, "ondragstart");
    }
    set ondragstart(value) {
      level0.set(this, "ondragstart", value);
    }
    get ondrop() {
      return level0.get(this, "ondrop");
    }
    set ondrop(value) {
      level0.set(this, "ondrop", value);
    }
    get ondurationchange() {
      return level0.get(this, "ondurationchange");
    }
    set ondurationchange(value) {
      level0.set(this, "ondurationchange", value);
    }
    get onemptied() {
      return level0.get(this, "onemptied");
    }
    set onemptied(value) {
      level0.set(this, "onemptied", value);
    }
    get onended() {
      return level0.get(this, "onended");
    }
    set onended(value) {
      level0.set(this, "onended", value);
    }
    get onerror() {
      return level0.get(this, "onerror");
    }
    set onerror(value) {
      level0.set(this, "onerror", value);
    }
    get onfocus() {
      return level0.get(this, "onfocus");
    }
    set onfocus(value) {
      level0.set(this, "onfocus", value);
    }
    get oninput() {
      return level0.get(this, "oninput");
    }
    set oninput(value) {
      level0.set(this, "oninput", value);
    }
    get oninvalid() {
      return level0.get(this, "oninvalid");
    }
    set oninvalid(value) {
      level0.set(this, "oninvalid", value);
    }
    get onkeydown() {
      return level0.get(this, "onkeydown");
    }
    set onkeydown(value) {
      level0.set(this, "onkeydown", value);
    }
    get onkeypress() {
      return level0.get(this, "onkeypress");
    }
    set onkeypress(value) {
      level0.set(this, "onkeypress", value);
    }
    get onkeyup() {
      return level0.get(this, "onkeyup");
    }
    set onkeyup(value) {
      level0.set(this, "onkeyup", value);
    }
    get onload() {
      return level0.get(this, "onload");
    }
    set onload(value) {
      level0.set(this, "onload", value);
    }
    get onloadeddata() {
      return level0.get(this, "onloadeddata");
    }
    set onloadeddata(value) {
      level0.set(this, "onloadeddata", value);
    }
    get onloadedmetadata() {
      return level0.get(this, "onloadedmetadata");
    }
    set onloadedmetadata(value) {
      level0.set(this, "onloadedmetadata", value);
    }
    get onloadstart() {
      return level0.get(this, "onloadstart");
    }
    set onloadstart(value) {
      level0.set(this, "onloadstart", value);
    }
    get onmousedown() {
      return level0.get(this, "onmousedown");
    }
    set onmousedown(value) {
      level0.set(this, "onmousedown", value);
    }
    get onmouseenter() {
      return level0.get(this, "onmouseenter");
    }
    set onmouseenter(value) {
      level0.set(this, "onmouseenter", value);
    }
    get onmouseleave() {
      return level0.get(this, "onmouseleave");
    }
    set onmouseleave(value) {
      level0.set(this, "onmouseleave", value);
    }
    get onmousemove() {
      return level0.get(this, "onmousemove");
    }
    set onmousemove(value) {
      level0.set(this, "onmousemove", value);
    }
    get onmouseout() {
      return level0.get(this, "onmouseout");
    }
    set onmouseout(value) {
      level0.set(this, "onmouseout", value);
    }
    get onmouseover() {
      return level0.get(this, "onmouseover");
    }
    set onmouseover(value) {
      level0.set(this, "onmouseover", value);
    }
    get onmouseup() {
      return level0.get(this, "onmouseup");
    }
    set onmouseup(value) {
      level0.set(this, "onmouseup", value);
    }
    get onmousewheel() {
      return level0.get(this, "onmousewheel");
    }
    set onmousewheel(value) {
      level0.set(this, "onmousewheel", value);
    }
    get onpause() {
      return level0.get(this, "onpause");
    }
    set onpause(value) {
      level0.set(this, "onpause", value);
    }
    get onplay() {
      return level0.get(this, "onplay");
    }
    set onplay(value) {
      level0.set(this, "onplay", value);
    }
    get onplaying() {
      return level0.get(this, "onplaying");
    }
    set onplaying(value) {
      level0.set(this, "onplaying", value);
    }
    get onprogress() {
      return level0.get(this, "onprogress");
    }
    set onprogress(value) {
      level0.set(this, "onprogress", value);
    }
    get onratechange() {
      return level0.get(this, "onratechange");
    }
    set onratechange(value) {
      level0.set(this, "onratechange", value);
    }
    get onreset() {
      return level0.get(this, "onreset");
    }
    set onreset(value) {
      level0.set(this, "onreset", value);
    }
    get onresize() {
      return level0.get(this, "onresize");
    }
    set onresize(value) {
      level0.set(this, "onresize", value);
    }
    get onscroll() {
      return level0.get(this, "onscroll");
    }
    set onscroll(value) {
      level0.set(this, "onscroll", value);
    }
    get onseeked() {
      return level0.get(this, "onseeked");
    }
    set onseeked(value) {
      level0.set(this, "onseeked", value);
    }
    get onseeking() {
      return level0.get(this, "onseeking");
    }
    set onseeking(value) {
      level0.set(this, "onseeking", value);
    }
    get onselect() {
      return level0.get(this, "onselect");
    }
    set onselect(value) {
      level0.set(this, "onselect", value);
    }
    get onshow() {
      return level0.get(this, "onshow");
    }
    set onshow(value) {
      level0.set(this, "onshow", value);
    }
    get onstalled() {
      return level0.get(this, "onstalled");
    }
    set onstalled(value) {
      level0.set(this, "onstalled", value);
    }
    get onsubmit() {
      return level0.get(this, "onsubmit");
    }
    set onsubmit(value) {
      level0.set(this, "onsubmit", value);
    }
    get onsuspend() {
      return level0.get(this, "onsuspend");
    }
    set onsuspend(value) {
      level0.set(this, "onsuspend", value);
    }
    get ontimeupdate() {
      return level0.get(this, "ontimeupdate");
    }
    set ontimeupdate(value) {
      level0.set(this, "ontimeupdate", value);
    }
    get ontoggle() {
      return level0.get(this, "ontoggle");
    }
    set ontoggle(value) {
      level0.set(this, "ontoggle", value);
    }
    get onvolumechange() {
      return level0.get(this, "onvolumechange");
    }
    set onvolumechange(value) {
      level0.set(this, "onvolumechange", value);
    }
    get onwaiting() {
      return level0.get(this, "onwaiting");
    }
    set onwaiting(value) {
      level0.set(this, "onwaiting", value);
    }
    get onauxclick() {
      return level0.get(this, "onauxclick");
    }
    set onauxclick(value) {
      level0.set(this, "onauxclick", value);
    }
    get ongotpointercapture() {
      return level0.get(this, "ongotpointercapture");
    }
    set ongotpointercapture(value) {
      level0.set(this, "ongotpointercapture", value);
    }
    get onlostpointercapture() {
      return level0.get(this, "onlostpointercapture");
    }
    set onlostpointercapture(value) {
      level0.set(this, "onlostpointercapture", value);
    }
    get onpointercancel() {
      return level0.get(this, "onpointercancel");
    }
    set onpointercancel(value) {
      level0.set(this, "onpointercancel", value);
    }
    get onpointerdown() {
      return level0.get(this, "onpointerdown");
    }
    set onpointerdown(value) {
      level0.set(this, "onpointerdown", value);
    }
    get onpointerenter() {
      return level0.get(this, "onpointerenter");
    }
    set onpointerenter(value) {
      level0.set(this, "onpointerenter", value);
    }
    get onpointerleave() {
      return level0.get(this, "onpointerleave");
    }
    set onpointerleave(value) {
      level0.set(this, "onpointerleave", value);
    }
    get onpointermove() {
      return level0.get(this, "onpointermove");
    }
    set onpointermove(value) {
      level0.set(this, "onpointermove", value);
    }
    get onpointerout() {
      return level0.get(this, "onpointerout");
    }
    set onpointerout(value) {
      level0.set(this, "onpointerout", value);
    }
    get onpointerover() {
      return level0.get(this, "onpointerover");
    }
    set onpointerover(value) {
      level0.set(this, "onpointerover", value);
    }
    get onpointerup() {
      return level0.get(this, "onpointerup");
    }
    set onpointerup(value) {
      level0.set(this, "onpointerup", value);
    }
    /* c8 ignore stop */
  };

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/html/template-element.js
  var tagName = "template";
  var HTMLTemplateElement = class extends HTMLElement {
    constructor(ownerDocument) {
      super(ownerDocument, tagName);
      const content = this.ownerDocument.createDocumentFragment();
      (this[CONTENT] = content)[PRIVATE] = this;
    }
    get content() {
      if (this.hasChildNodes() && !this[CONTENT].hasChildNodes()) {
        for (const node of this.childNodes)
          this[CONTENT].appendChild(node.cloneNode(true));
      }
      return this[CONTENT];
    }
  };
  registerHTMLClass(tagName, HTMLTemplateElement);

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/html/html-element.js
  var HTMLHtmlElement = class extends HTMLElement {
    constructor(ownerDocument, localName = "html") {
      super(ownerDocument, localName);
    }
  };

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/html/text-element.js
  var { toString } = HTMLElement.prototype;
  var TextElement = class extends HTMLElement {
    get innerHTML() {
      return this.textContent;
    }
    set innerHTML(html) {
      this.textContent = html;
    }
    toString() {
      const outerHTML = toString.call(this.cloneNode());
      return outerHTML.replace("><", () => `>${this.textContent}<`);
    }
  };

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/html/script-element.js
  var tagName2 = "script";
  var HTMLScriptElement = class extends TextElement {
    constructor(ownerDocument, localName = tagName2) {
      super(ownerDocument, localName);
    }
    get type() {
      return stringAttribute.get(this, "type");
    }
    set type(value) {
      stringAttribute.set(this, "type", value);
    }
    get src() {
      return stringAttribute.get(this, "src");
    }
    set src(value) {
      stringAttribute.set(this, "src", value);
    }
    get defer() {
      return booleanAttribute.get(this, "defer");
    }
    set defer(value) {
      booleanAttribute.set(this, "defer", value);
    }
    get crossOrigin() {
      return stringAttribute.get(this, "crossorigin");
    }
    set crossOrigin(value) {
      stringAttribute.set(this, "crossorigin", value);
    }
    get nomodule() {
      return booleanAttribute.get(this, "nomodule");
    }
    set nomodule(value) {
      booleanAttribute.set(this, "nomodule", value);
    }
    get referrerPolicy() {
      return stringAttribute.get(this, "referrerpolicy");
    }
    set referrerPolicy(value) {
      stringAttribute.set(this, "referrerpolicy", value);
    }
    get nonce() {
      return stringAttribute.get(this, "nonce");
    }
    set nonce(value) {
      stringAttribute.set(this, "nonce", value);
    }
    get async() {
      return booleanAttribute.get(this, "async");
    }
    set async(value) {
      booleanAttribute.set(this, "async", value);
    }
    get text() {
      return this.textContent;
    }
    set text(content) {
      this.textContent = content;
    }
  };
  registerHTMLClass(tagName2, HTMLScriptElement);

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/html/frame-element.js
  var HTMLFrameElement = class extends HTMLElement {
    constructor(ownerDocument, localName = "frame") {
      super(ownerDocument, localName);
    }
  };

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/html/i-frame-element.js
  var tagName3 = "iframe";
  var HTMLIFrameElement = class extends HTMLElement {
    constructor(ownerDocument, localName = tagName3) {
      super(ownerDocument, localName);
    }
    /* c8 ignore start */
    get src() {
      return stringAttribute.get(this, "src");
    }
    set src(value) {
      stringAttribute.set(this, "src", value);
    }
    get srcdoc() {
      return stringAttribute.get(this, "srcdoc");
    }
    set srcdoc(value) {
      stringAttribute.set(this, "srcdoc", value);
    }
    get name() {
      return stringAttribute.get(this, "name");
    }
    set name(value) {
      stringAttribute.set(this, "name", value);
    }
    get allow() {
      return stringAttribute.get(this, "allow");
    }
    set allow(value) {
      stringAttribute.set(this, "allow", value);
    }
    get allowFullscreen() {
      return booleanAttribute.get(this, "allowfullscreen");
    }
    set allowFullscreen(value) {
      booleanAttribute.set(this, "allowfullscreen", value);
    }
    get referrerPolicy() {
      return stringAttribute.get(this, "referrerpolicy");
    }
    set referrerPolicy(value) {
      stringAttribute.set(this, "referrerpolicy", value);
    }
    get loading() {
      return stringAttribute.get(this, "loading");
    }
    set loading(value) {
      stringAttribute.set(this, "loading", value);
    }
    /* c8 ignore stop */
  };
  registerHTMLClass(tagName3, HTMLIFrameElement);

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/html/object-element.js
  var HTMLObjectElement = class extends HTMLElement {
    constructor(ownerDocument, localName = "object") {
      super(ownerDocument, localName);
    }
  };

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/html/head-element.js
  var HTMLHeadElement = class extends HTMLElement {
    constructor(ownerDocument, localName = "head") {
      super(ownerDocument, localName);
    }
  };

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/html/body-element.js
  var HTMLBodyElement = class extends HTMLElement {
    constructor(ownerDocument, localName = "body") {
      super(ownerDocument, localName);
    }
  };

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/html/style-element.js
  var import_cssom = __toESM(require_lib(), 1);
  var tagName4 = "style";
  var HTMLStyleElement = class extends TextElement {
    constructor(ownerDocument, localName = tagName4) {
      super(ownerDocument, localName);
      this[SHEET] = null;
    }
    get sheet() {
      const sheet = this[SHEET];
      if (sheet !== null) {
        return sheet;
      }
      return this[SHEET] = (0, import_cssom.parse)(this.textContent);
    }
    get innerHTML() {
      return super.innerHTML || "";
    }
    set innerHTML(value) {
      super.textContent = value;
      this[SHEET] = null;
    }
    get innerText() {
      return super.innerText || "";
    }
    set innerText(value) {
      super.textContent = value;
      this[SHEET] = null;
    }
    get textContent() {
      return super.textContent || "";
    }
    set textContent(value) {
      super.textContent = value;
      this[SHEET] = null;
    }
  };
  registerHTMLClass(tagName4, HTMLStyleElement);

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/html/time-element.js
  var HTMLTimeElement = class extends HTMLElement {
    constructor(ownerDocument, localName = "time") {
      super(ownerDocument, localName);
    }
    /**
     * @type {string}
     */
    get dateTime() {
      return stringAttribute.get(this, "datetime");
    }
    set dateTime(value) {
      stringAttribute.set(this, "datetime", value);
    }
  };
  registerHTMLClass("time", HTMLTimeElement);

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/html/field-set-element.js
  var HTMLFieldSetElement = class extends HTMLElement {
    constructor(ownerDocument, localName = "fieldset") {
      super(ownerDocument, localName);
    }
  };

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/html/embed-element.js
  var HTMLEmbedElement = class extends HTMLElement {
    constructor(ownerDocument, localName = "embed") {
      super(ownerDocument, localName);
    }
  };

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/html/hr-element.js
  var HTMLHRElement = class extends HTMLElement {
    constructor(ownerDocument, localName = "hr") {
      super(ownerDocument, localName);
    }
  };

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/html/progress-element.js
  var HTMLProgressElement = class extends HTMLElement {
    constructor(ownerDocument, localName = "progress") {
      super(ownerDocument, localName);
    }
  };

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/html/paragraph-element.js
  var HTMLParagraphElement = class extends HTMLElement {
    constructor(ownerDocument, localName = "p") {
      super(ownerDocument, localName);
    }
  };

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/html/table-element.js
  var HTMLTableElement = class extends HTMLElement {
    constructor(ownerDocument, localName = "table") {
      super(ownerDocument, localName);
    }
  };

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/html/frame-set-element.js
  var HTMLFrameSetElement = class extends HTMLElement {
    constructor(ownerDocument, localName = "frameset") {
      super(ownerDocument, localName);
    }
  };

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/html/li-element.js
  var HTMLLIElement = class extends HTMLElement {
    constructor(ownerDocument, localName = "li") {
      super(ownerDocument, localName);
    }
  };

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/html/base-element.js
  var HTMLBaseElement = class extends HTMLElement {
    constructor(ownerDocument, localName = "base") {
      super(ownerDocument, localName);
    }
  };

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/html/data-list-element.js
  var HTMLDataListElement = class extends HTMLElement {
    constructor(ownerDocument, localName = "datalist") {
      super(ownerDocument, localName);
    }
  };

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/html/input-element.js
  var tagName5 = "input";
  var HTMLInputElement = class extends HTMLElement {
    constructor(ownerDocument, localName = tagName5) {
      super(ownerDocument, localName);
    }
    /* c8 ignore start */
    get autofocus() {
      return booleanAttribute.get(this, "autofocus") || -1;
    }
    set autofocus(value) {
      booleanAttribute.set(this, "autofocus", value);
    }
    get disabled() {
      return booleanAttribute.get(this, "disabled");
    }
    set disabled(value) {
      booleanAttribute.set(this, "disabled", value);
    }
    get name() {
      return this.getAttribute("name");
    }
    set name(value) {
      this.setAttribute("name", value);
    }
    get placeholder() {
      return this.getAttribute("placeholder");
    }
    set placeholder(value) {
      this.setAttribute("placeholder", value);
    }
    get type() {
      return this.getAttribute("type");
    }
    set type(value) {
      this.setAttribute("type", value);
    }
    get value() {
      return stringAttribute.get(this, "value");
    }
    set value(value) {
      stringAttribute.set(this, "value", value);
    }
    /* c8 ignore stop */
  };
  registerHTMLClass(tagName5, HTMLInputElement);

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/html/param-element.js
  var HTMLParamElement = class extends HTMLElement {
    constructor(ownerDocument, localName = "param") {
      super(ownerDocument, localName);
    }
  };

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/html/media-element.js
  var HTMLMediaElement = class extends HTMLElement {
    constructor(ownerDocument, localName = "media") {
      super(ownerDocument, localName);
    }
  };

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/html/audio-element.js
  var HTMLAudioElement = class extends HTMLElement {
    constructor(ownerDocument, localName = "audio") {
      super(ownerDocument, localName);
    }
  };

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/html/heading-element.js
  var tagName6 = "h1";
  var HTMLHeadingElement = class extends HTMLElement {
    constructor(ownerDocument, localName = tagName6) {
      super(ownerDocument, localName);
    }
  };
  registerHTMLClass([tagName6, "h2", "h3", "h4", "h5", "h6"], HTMLHeadingElement);

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/html/directory-element.js
  var HTMLDirectoryElement = class extends HTMLElement {
    constructor(ownerDocument, localName = "dir") {
      super(ownerDocument, localName);
    }
  };

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/html/quote-element.js
  var HTMLQuoteElement = class extends HTMLElement {
    constructor(ownerDocument, localName = "quote") {
      super(ownerDocument, localName);
    }
  };

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/html/canvas-element.js
  var import_canvas = __toESM(require_canvas(), 1);
  var { createCanvas } = import_canvas.default;
  var tagName7 = "canvas";
  var HTMLCanvasElement = class extends HTMLElement {
    constructor(ownerDocument, localName = tagName7) {
      super(ownerDocument, localName);
      this[IMAGE] = createCanvas(300, 150);
    }
    get width() {
      return this[IMAGE].width;
    }
    set width(value) {
      numericAttribute.set(this, "width", value);
      this[IMAGE].width = value;
    }
    get height() {
      return this[IMAGE].height;
    }
    set height(value) {
      numericAttribute.set(this, "height", value);
      this[IMAGE].height = value;
    }
    getContext(type) {
      return this[IMAGE].getContext(type);
    }
    toDataURL(...args) {
      return this[IMAGE].toDataURL(...args);
    }
  };
  registerHTMLClass(tagName7, HTMLCanvasElement);

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/html/legend-element.js
  var HTMLLegendElement = class extends HTMLElement {
    constructor(ownerDocument, localName = "legend") {
      super(ownerDocument, localName);
    }
  };

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/html/option-element.js
  var tagName8 = "option";
  var HTMLOptionElement = class extends HTMLElement {
    constructor(ownerDocument, localName = tagName8) {
      super(ownerDocument, localName);
    }
    /* c8 ignore start */
    get value() {
      return stringAttribute.get(this, "value");
    }
    set value(value) {
      stringAttribute.set(this, "value", value);
    }
    /* c8 ignore stop */
    get selected() {
      return booleanAttribute.get(this, "selected");
    }
    set selected(value) {
      const option = this.parentElement?.querySelector("option[selected]");
      if (option && option !== this)
        option.selected = false;
      booleanAttribute.set(this, "selected", value);
    }
  };
  registerHTMLClass(tagName8, HTMLOptionElement);

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/html/span-element.js
  var HTMLSpanElement = class extends HTMLElement {
    constructor(ownerDocument, localName = "span") {
      super(ownerDocument, localName);
    }
  };

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/html/meter-element.js
  var HTMLMeterElement = class extends HTMLElement {
    constructor(ownerDocument, localName = "meter") {
      super(ownerDocument, localName);
    }
  };

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/html/video-element.js
  var HTMLVideoElement = class extends HTMLElement {
    constructor(ownerDocument, localName = "video") {
      super(ownerDocument, localName);
    }
  };

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/html/table-cell-element.js
  var HTMLTableCellElement = class extends HTMLElement {
    constructor(ownerDocument, localName = "td") {
      super(ownerDocument, localName);
    }
  };

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/html/title-element.js
  var tagName9 = "title";
  var HTMLTitleElement = class extends TextElement {
    constructor(ownerDocument, localName = tagName9) {
      super(ownerDocument, localName);
    }
  };
  registerHTMLClass(tagName9, HTMLTitleElement);

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/html/output-element.js
  var HTMLOutputElement = class extends HTMLElement {
    constructor(ownerDocument, localName = "output") {
      super(ownerDocument, localName);
    }
  };

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/html/table-row-element.js
  var HTMLTableRowElement = class extends HTMLElement {
    constructor(ownerDocument, localName = "tr") {
      super(ownerDocument, localName);
    }
  };

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/html/data-element.js
  var HTMLDataElement = class extends HTMLElement {
    constructor(ownerDocument, localName = "data") {
      super(ownerDocument, localName);
    }
  };

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/html/menu-element.js
  var HTMLMenuElement = class extends HTMLElement {
    constructor(ownerDocument, localName = "menu") {
      super(ownerDocument, localName);
    }
  };

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/html/select-element.js
  var tagName10 = "select";
  var HTMLSelectElement = class extends HTMLElement {
    constructor(ownerDocument, localName = tagName10) {
      super(ownerDocument, localName);
    }
    get options() {
      let children = new NodeList();
      let { firstElementChild } = this;
      while (firstElementChild) {
        if (firstElementChild.tagName === "OPTGROUP")
          children.push(...firstElementChild.children);
        else
          children.push(firstElementChild);
        firstElementChild = firstElementChild.nextElementSibling;
      }
      return children;
    }
    /* c8 ignore start */
    get disabled() {
      return booleanAttribute.get(this, "disabled");
    }
    set disabled(value) {
      booleanAttribute.set(this, "disabled", value);
    }
    get name() {
      return this.getAttribute("name");
    }
    set name(value) {
      this.setAttribute("name", value);
    }
    /* c8 ignore stop */
    get value() {
      return this.querySelector("option[selected]")?.value;
    }
  };
  registerHTMLClass(tagName10, HTMLSelectElement);

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/html/br-element.js
  var HTMLBRElement = class extends HTMLElement {
    constructor(ownerDocument, localName = "br") {
      super(ownerDocument, localName);
    }
  };

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/html/button-element.js
  var tagName11 = "button";
  var HTMLButtonElement = class extends HTMLElement {
    constructor(ownerDocument, localName = tagName11) {
      super(ownerDocument, localName);
    }
    /* c8 ignore start */
    get disabled() {
      return booleanAttribute.get(this, "disabled");
    }
    set disabled(value) {
      booleanAttribute.set(this, "disabled", value);
    }
    get name() {
      return this.getAttribute("name");
    }
    set name(value) {
      this.setAttribute("name", value);
    }
    get type() {
      return this.getAttribute("type");
    }
    set type(value) {
      this.setAttribute("type", value);
    }
    /* c8 ignore stop */
  };
  registerHTMLClass(tagName11, HTMLButtonElement);

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/html/map-element.js
  var HTMLMapElement = class extends HTMLElement {
    constructor(ownerDocument, localName = "map") {
      super(ownerDocument, localName);
    }
  };

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/html/opt-group-element.js
  var HTMLOptGroupElement = class extends HTMLElement {
    constructor(ownerDocument, localName = "optgroup") {
      super(ownerDocument, localName);
    }
  };

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/html/d-list-element.js
  var HTMLDListElement = class extends HTMLElement {
    constructor(ownerDocument, localName = "dl") {
      super(ownerDocument, localName);
    }
  };

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/html/text-area-element.js
  var tagName12 = "textarea";
  var HTMLTextAreaElement = class extends TextElement {
    constructor(ownerDocument, localName = tagName12) {
      super(ownerDocument, localName);
    }
    /* c8 ignore start */
    get disabled() {
      return booleanAttribute.get(this, "disabled");
    }
    set disabled(value) {
      booleanAttribute.set(this, "disabled", value);
    }
    get name() {
      return this.getAttribute("name");
    }
    set name(value) {
      this.setAttribute("name", value);
    }
    get placeholder() {
      return this.getAttribute("placeholder");
    }
    set placeholder(value) {
      this.setAttribute("placeholder", value);
    }
    get type() {
      return this.getAttribute("type");
    }
    set type(value) {
      this.setAttribute("type", value);
    }
    get value() {
      return this.textContent;
    }
    set value(content) {
      this.textContent = content;
    }
    /* c8 ignore stop */
  };
  registerHTMLClass(tagName12, HTMLTextAreaElement);

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/html/font-element.js
  var HTMLFontElement = class extends HTMLElement {
    constructor(ownerDocument, localName = "font") {
      super(ownerDocument, localName);
    }
  };

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/html/div-element.js
  var HTMLDivElement = class extends HTMLElement {
    constructor(ownerDocument, localName = "div") {
      super(ownerDocument, localName);
    }
  };

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/html/link-element.js
  var tagName13 = "link";
  var HTMLLinkElement = class extends HTMLElement {
    constructor(ownerDocument, localName = tagName13) {
      super(ownerDocument, localName);
    }
    /* c8 ignore start */
    // copy paste from img.src, already covered
    get disabled() {
      return booleanAttribute.get(this, "disabled");
    }
    set disabled(value) {
      booleanAttribute.set(this, "disabled", value);
    }
    get href() {
      return stringAttribute.get(this, "href").trim();
    }
    set href(value) {
      stringAttribute.set(this, "href", value);
    }
    get hreflang() {
      return stringAttribute.get(this, "hreflang");
    }
    set hreflang(value) {
      stringAttribute.set(this, "hreflang", value);
    }
    get media() {
      return stringAttribute.get(this, "media");
    }
    set media(value) {
      stringAttribute.set(this, "media", value);
    }
    get rel() {
      return stringAttribute.get(this, "rel");
    }
    set rel(value) {
      stringAttribute.set(this, "rel", value);
    }
    get type() {
      return stringAttribute.get(this, "type");
    }
    set type(value) {
      stringAttribute.set(this, "type", value);
    }
    /* c8 ignore stop */
  };
  registerHTMLClass(tagName13, HTMLLinkElement);

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/html/slot-element.js
  var tagName14 = "slot";
  var HTMLSlotElement = class extends HTMLElement {
    constructor(ownerDocument, localName = tagName14) {
      super(ownerDocument, localName);
    }
    /* c8 ignore start */
    get name() {
      return this.getAttribute("name");
    }
    set name(value) {
      this.setAttribute("name", value);
    }
    assign() {
    }
    assignedNodes(options) {
      const isNamedSlot = !!this.name;
      const hostChildNodes = this.getRootNode().host?.childNodes ?? [];
      let slottables;
      if (isNamedSlot) {
        slottables = [...hostChildNodes].filter((node) => node.slot === this.name);
      } else {
        slottables = [...hostChildNodes].filter((node) => !node.slot);
      }
      if (options?.flatten) {
        const result = [];
        for (let slottable of slottables) {
          if (slottable.localName === "slot") {
            result.push(...slottable.assignedNodes({ flatten: true }));
          } else {
            result.push(slottable);
          }
        }
        slottables = result;
      }
      return slottables.length ? slottables : [...this.childNodes];
    }
    assignedElements(options) {
      const slottables = this.assignedNodes(options).filter((n) => n.nodeType === 1);
      return slottables.length ? slottables : [...this.children];
    }
    /* c8 ignore stop */
  };
  registerHTMLClass(tagName14, HTMLSlotElement);

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/html/form-element.js
  var HTMLFormElement = class extends HTMLElement {
    constructor(ownerDocument, localName = "form") {
      super(ownerDocument, localName);
    }
  };

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/html/image-element.js
  var tagName15 = "img";
  var HTMLImageElement = class extends HTMLElement {
    constructor(ownerDocument, localName = tagName15) {
      super(ownerDocument, localName);
    }
    /* c8 ignore start */
    get alt() {
      return stringAttribute.get(this, "alt");
    }
    set alt(value) {
      stringAttribute.set(this, "alt", value);
    }
    get sizes() {
      return stringAttribute.get(this, "sizes");
    }
    set sizes(value) {
      stringAttribute.set(this, "sizes", value);
    }
    get src() {
      return stringAttribute.get(this, "src");
    }
    set src(value) {
      stringAttribute.set(this, "src", value);
    }
    get srcset() {
      return stringAttribute.get(this, "srcset");
    }
    set srcset(value) {
      stringAttribute.set(this, "srcset", value);
    }
    get title() {
      return stringAttribute.get(this, "title");
    }
    set title(value) {
      stringAttribute.set(this, "title", value);
    }
    get width() {
      return numericAttribute.get(this, "width");
    }
    set width(value) {
      numericAttribute.set(this, "width", value);
    }
    get height() {
      return numericAttribute.get(this, "height");
    }
    set height(value) {
      numericAttribute.set(this, "height", value);
    }
    /* c8 ignore stop */
  };
  registerHTMLClass(tagName15, HTMLImageElement);

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/html/pre-element.js
  var HTMLPreElement = class extends HTMLElement {
    constructor(ownerDocument, localName = "pre") {
      super(ownerDocument, localName);
    }
  };

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/html/u-list-element.js
  var HTMLUListElement = class extends HTMLElement {
    constructor(ownerDocument, localName = "ul") {
      super(ownerDocument, localName);
    }
  };

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/html/meta-element.js
  var tagName16 = "meta";
  var HTMLMetaElement = class extends HTMLElement {
    constructor(ownerDocument, localName = tagName16) {
      super(ownerDocument, localName);
    }
    /* c8 ignore start */
    get name() {
      return stringAttribute.get(this, "name");
    }
    set name(value) {
      stringAttribute.set(this, "name", value);
    }
    get httpEquiv() {
      return stringAttribute.get(this, "http-equiv");
    }
    set httpEquiv(value) {
      stringAttribute.set(this, "http-equiv", value);
    }
    get content() {
      return stringAttribute.get(this, "content");
    }
    set content(value) {
      stringAttribute.set(this, "content", value);
    }
    get charset() {
      return stringAttribute.get(this, "charset");
    }
    set charset(value) {
      stringAttribute.set(this, "charset", value);
    }
    get media() {
      return stringAttribute.get(this, "media");
    }
    set media(value) {
      stringAttribute.set(this, "media", value);
    }
    /* c8 ignore stop */
  };
  registerHTMLClass(tagName16, HTMLMetaElement);

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/html/picture-element.js
  var HTMLPictureElement = class extends HTMLElement {
    constructor(ownerDocument, localName = "picture") {
      super(ownerDocument, localName);
    }
  };

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/html/area-element.js
  var HTMLAreaElement = class extends HTMLElement {
    constructor(ownerDocument, localName = "area") {
      super(ownerDocument, localName);
    }
  };

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/html/o-list-element.js
  var HTMLOListElement = class extends HTMLElement {
    constructor(ownerDocument, localName = "ol") {
      super(ownerDocument, localName);
    }
  };

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/html/table-caption-element.js
  var HTMLTableCaptionElement = class extends HTMLElement {
    constructor(ownerDocument, localName = "caption") {
      super(ownerDocument, localName);
    }
  };

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/html/anchor-element.js
  var tagName17 = "a";
  var HTMLAnchorElement = class extends HTMLElement {
    constructor(ownerDocument, localName = tagName17) {
      super(ownerDocument, localName);
    }
    /* c8 ignore start */
    // copy paste from img.src, already covered
    get href() {
      return encodeURI(decodeURI(stringAttribute.get(this, "href"))).trim();
    }
    set href(value) {
      stringAttribute.set(this, "href", decodeURI(value));
    }
    get download() {
      return encodeURI(decodeURI(stringAttribute.get(this, "download")));
    }
    set download(value) {
      stringAttribute.set(this, "download", decodeURI(value));
    }
    get target() {
      return stringAttribute.get(this, "target");
    }
    set target(value) {
      stringAttribute.set(this, "target", value);
    }
    get type() {
      return stringAttribute.get(this, "type");
    }
    set type(value) {
      stringAttribute.set(this, "type", value);
    }
    get rel() {
      return stringAttribute.get(this, "rel");
    }
    set rel(value) {
      stringAttribute.set(this, "rel", value);
    }
    /* c8 ignore stop */
  };
  registerHTMLClass(tagName17, HTMLAnchorElement);

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/html/label-element.js
  var HTMLLabelElement = class extends HTMLElement {
    constructor(ownerDocument, localName = "label") {
      super(ownerDocument, localName);
    }
  };

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/html/unknown-element.js
  var HTMLUnknownElement = class extends HTMLElement {
    constructor(ownerDocument, localName = "unknown") {
      super(ownerDocument, localName);
    }
  };

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/html/mod-element.js
  var HTMLModElement = class extends HTMLElement {
    constructor(ownerDocument, localName = "mod") {
      super(ownerDocument, localName);
    }
  };

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/html/details-element.js
  var HTMLDetailsElement = class extends HTMLElement {
    constructor(ownerDocument, localName = "details") {
      super(ownerDocument, localName);
    }
  };

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/html/source-element.js
  var tagName18 = "source";
  var HTMLSourceElement = class extends HTMLElement {
    constructor(ownerDocument, localName = tagName18) {
      super(ownerDocument, localName);
    }
    /* c8 ignore start */
    get src() {
      return stringAttribute.get(this, "src");
    }
    set src(value) {
      stringAttribute.set(this, "src", value);
    }
    get srcset() {
      return stringAttribute.get(this, "srcset");
    }
    set srcset(value) {
      stringAttribute.set(this, "srcset", value);
    }
    get sizes() {
      return stringAttribute.get(this, "sizes");
    }
    set sizes(value) {
      stringAttribute.set(this, "sizes", value);
    }
    get type() {
      return stringAttribute.get(this, "type");
    }
    set type(value) {
      stringAttribute.set(this, "type", value);
    }
    /* c8 ignore stop */
  };
  registerHTMLClass(tagName18, HTMLSourceElement);

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/html/track-element.js
  var HTMLTrackElement = class extends HTMLElement {
    constructor(ownerDocument, localName = "track") {
      super(ownerDocument, localName);
    }
  };

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/html/marquee-element.js
  var HTMLMarqueeElement = class extends HTMLElement {
    constructor(ownerDocument, localName = "marquee") {
      super(ownerDocument, localName);
    }
  };

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/shared/html-classes.js
  var HTMLClasses = {
    HTMLElement,
    HTMLTemplateElement,
    HTMLHtmlElement,
    HTMLScriptElement,
    HTMLFrameElement,
    HTMLIFrameElement,
    HTMLObjectElement,
    HTMLHeadElement,
    HTMLBodyElement,
    HTMLStyleElement,
    HTMLTimeElement,
    HTMLFieldSetElement,
    HTMLEmbedElement,
    HTMLHRElement,
    HTMLProgressElement,
    HTMLParagraphElement,
    HTMLTableElement,
    HTMLFrameSetElement,
    HTMLLIElement,
    HTMLBaseElement,
    HTMLDataListElement,
    HTMLInputElement,
    HTMLParamElement,
    HTMLMediaElement,
    HTMLAudioElement,
    HTMLHeadingElement,
    HTMLDirectoryElement,
    HTMLQuoteElement,
    HTMLCanvasElement,
    HTMLLegendElement,
    HTMLOptionElement,
    HTMLSpanElement,
    HTMLMeterElement,
    HTMLVideoElement,
    HTMLTableCellElement,
    HTMLTitleElement,
    HTMLOutputElement,
    HTMLTableRowElement,
    HTMLDataElement,
    HTMLMenuElement,
    HTMLSelectElement,
    HTMLBRElement,
    HTMLButtonElement,
    HTMLMapElement,
    HTMLOptGroupElement,
    HTMLDListElement,
    HTMLTextAreaElement,
    HTMLFontElement,
    HTMLDivElement,
    HTMLLinkElement,
    HTMLSlotElement,
    HTMLFormElement,
    HTMLImageElement,
    HTMLPreElement,
    HTMLUListElement,
    HTMLMetaElement,
    HTMLPictureElement,
    HTMLAreaElement,
    HTMLOListElement,
    HTMLTableCaptionElement,
    HTMLAnchorElement,
    HTMLLabelElement,
    HTMLUnknownElement,
    HTMLModElement,
    HTMLDetailsElement,
    HTMLSourceElement,
    HTMLTrackElement,
    HTMLMarqueeElement
  };

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/shared/mime.js
  var voidElements2 = { test: () => true };
  var Mime = {
    "text/html": {
      docType: "<!DOCTYPE html>",
      ignoreCase: true,
      voidElements: /^(?:area|base|br|col|embed|hr|img|input|keygen|link|menuitem|meta|param|source|track|wbr)$/i
    },
    "image/svg+xml": {
      docType: '<?xml version="1.0" encoding="utf-8"?>',
      ignoreCase: false,
      voidElements: voidElements2
    },
    "text/xml": {
      docType: '<?xml version="1.0" encoding="utf-8"?>',
      ignoreCase: false,
      voidElements: voidElements2
    },
    "application/xml": {
      docType: '<?xml version="1.0" encoding="utf-8"?>',
      ignoreCase: false,
      voidElements: voidElements2
    },
    "application/xhtml+xml": {
      docType: '<?xml version="1.0" encoding="utf-8"?>',
      ignoreCase: false,
      voidElements: voidElements2
    }
  };

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/interface/custom-event.js
  var CustomEvent = class extends GlobalEvent {
    constructor(type, eventInitDict = {}) {
      super(type, eventInitDict);
      this.detail = eventInitDict.detail;
    }
  };

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/interface/input-event.js
  var InputEvent = class extends GlobalEvent {
    constructor(type, inputEventInit = {}) {
      super(type, inputEventInit);
      this.inputType = inputEventInit.inputType;
      this.data = inputEventInit.data;
      this.dataTransfer = inputEventInit.dataTransfer;
      this.isComposing = inputEventInit.isComposing || false;
      this.ranges = inputEventInit.ranges;
    }
  };

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/interface/image.js
  var ImageClass = (ownerDocument) => (
    /**
     * @implements globalThis.Image
     */
    class Image extends HTMLImageElement {
      constructor(width, height) {
        super(ownerDocument);
        switch (arguments.length) {
          case 1:
            this.height = width;
            this.width = width;
            break;
          case 2:
            this.height = height;
            this.width = width;
            break;
        }
      }
    }
  );

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/interface/range.js
  var deleteContents = ({ [START]: start, [END]: end }, fragment = null) => {
    setAdjacent(start[PREV], end[NEXT]);
    do {
      const after2 = getEnd(start);
      const next = after2 === end ? after2 : after2[NEXT];
      if (fragment)
        fragment.insertBefore(start, fragment[END]);
      else
        start.remove();
      start = next;
    } while (start !== end);
  };
  var Range = class _Range {
    constructor() {
      this[START] = null;
      this[END] = null;
      this.commonAncestorContainer = null;
    }
    /* TODO: this is more complicated than it looks
      setStart(node, offset) {
        this[START] = node.childNodes[offset];
      }
    
      setEnd(node, offset) {
        this[END] = getEnd(node.childNodes[offset]);
      }
      //*/
    insertNode(newNode) {
      this[END].parentNode.insertBefore(newNode, this[START]);
    }
    selectNode(node) {
      this[START] = node;
      this[END] = getEnd(node);
    }
    // TODO: SVG elements should then create contextual fragments
    //       that return SVG nodes
    selectNodeContents(node) {
      this.selectNode(node);
      this.commonAncestorContainer = node;
    }
    surroundContents(parentNode) {
      parentNode.replaceChildren(this.extractContents());
    }
    setStartBefore(node) {
      this[START] = node;
    }
    setStartAfter(node) {
      this[START] = node.nextSibling;
    }
    setEndBefore(node) {
      this[END] = getEnd(node.previousSibling);
    }
    setEndAfter(node) {
      this[END] = getEnd(node);
    }
    cloneContents() {
      let { [START]: start, [END]: end } = this;
      const fragment = start.ownerDocument.createDocumentFragment();
      while (start !== end) {
        fragment.insertBefore(start.cloneNode(true), fragment[END]);
        start = getEnd(start);
        if (start !== end)
          start = start[NEXT];
      }
      return fragment;
    }
    deleteContents() {
      deleteContents(this);
    }
    extractContents() {
      const fragment = this[START].ownerDocument.createDocumentFragment();
      deleteContents(this, fragment);
      return fragment;
    }
    createContextualFragment(html) {
      const { commonAncestorContainer: doc } = this;
      const isSVG = "ownerSVGElement" in doc;
      const document2 = isSVG ? doc.ownerDocument : doc;
      let content = htmlToFragment(document2, html);
      if (isSVG) {
        const childNodes = [...content.childNodes];
        content = document2.createDocumentFragment();
        Object.setPrototypeOf(content, SVGElement.prototype);
        content.ownerSVGElement = document2;
        for (const child of childNodes) {
          Object.setPrototypeOf(child, SVGElement.prototype);
          child.ownerSVGElement = document2;
          content.appendChild(child);
        }
      } else
        this.selectNode(content);
      return content;
    }
    cloneRange() {
      const range = new _Range();
      range[START] = this[START];
      range[END] = this[END];
      return range;
    }
  };

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/interface/tree-walker.js
  var isOK = ({ nodeType }, mask) => {
    switch (nodeType) {
      case ELEMENT_NODE:
        return mask & SHOW_ELEMENT;
      case TEXT_NODE:
        return mask & SHOW_TEXT;
      case COMMENT_NODE:
        return mask & SHOW_COMMENT;
      case CDATA_SECTION_NODE:
        return mask & SHOW_CDATA_SECTION;
    }
    return 0;
  };
  var TreeWalker = class {
    constructor(root2, whatToShow = SHOW_ALL) {
      this.root = root2;
      this.currentNode = root2;
      this.whatToShow = whatToShow;
      let { [NEXT]: next, [END]: end } = root2;
      if (root2.nodeType === DOCUMENT_NODE) {
        const { documentElement } = root2;
        next = documentElement;
        end = documentElement[END];
      }
      const nodes = [];
      while (next && next !== end) {
        if (isOK(next, whatToShow))
          nodes.push(next);
        next = next[NEXT];
      }
      this[PRIVATE] = { i: 0, nodes };
    }
    nextNode() {
      const $ = this[PRIVATE];
      this.currentNode = $.i < $.nodes.length ? $.nodes[$.i++] : null;
      return this.currentNode;
    }
  };

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/interface/document.js
  var query = (method, ownerDocument, selectors) => {
    let { [NEXT]: next, [END]: end } = ownerDocument;
    return method.call({ ownerDocument, [NEXT]: next, [END]: end }, selectors);
  };
  var globalExports = assign(
    {},
    Facades,
    HTMLClasses,
    {
      CustomEvent,
      Event: GlobalEvent,
      EventTarget: DOMEventTarget,
      InputEvent,
      NamedNodeMap,
      NodeList
    }
  );
  var window2 = /* @__PURE__ */ new WeakMap();
  var Document2 = class extends NonElementParentNode {
    constructor(type) {
      super(null, "#document", DOCUMENT_NODE);
      this[CUSTOM_ELEMENTS] = { active: false, registry: null };
      this[MUTATION_OBSERVER] = { active: false, class: null };
      this[MIME] = Mime[type];
      this[DOCTYPE] = null;
      this[DOM_PARSER] = null;
      this[GLOBALS] = null;
      this[IMAGE] = null;
      this[UPGRADE] = null;
    }
    /**
     * @type {globalThis.Document['defaultView']}
     */
    get defaultView() {
      if (!window2.has(this))
        window2.set(this, new Proxy(globalThis, {
          set: (target, name, value) => {
            switch (name) {
              case "addEventListener":
              case "removeEventListener":
              case "dispatchEvent":
                this[EVENT_TARGET][name] = value;
                break;
              default:
                target[name] = value;
                break;
            }
            return true;
          },
          get: (globalThis2, name) => {
            switch (name) {
              case "addEventListener":
              case "removeEventListener":
              case "dispatchEvent":
                if (!this[EVENT_TARGET]) {
                  const et = this[EVENT_TARGET] = new DOMEventTarget();
                  et.dispatchEvent = et.dispatchEvent.bind(et);
                  et.addEventListener = et.addEventListener.bind(et);
                  et.removeEventListener = et.removeEventListener.bind(et);
                }
                return this[EVENT_TARGET][name];
              case "document":
                return this;
              /* c8 ignore start */
              case "navigator":
                return {
                  userAgent: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.150 Safari/537.36"
                };
              /* c8 ignore stop */
              case "window":
                return window2.get(this);
              case "customElements":
                if (!this[CUSTOM_ELEMENTS].registry)
                  this[CUSTOM_ELEMENTS] = new CustomElementRegistry(this);
                return this[CUSTOM_ELEMENTS];
              case "performance":
                return globalThis2.performance;
              case "DOMParser":
                return this[DOM_PARSER];
              case "Image":
                if (!this[IMAGE])
                  this[IMAGE] = ImageClass(this);
                return this[IMAGE];
              case "MutationObserver":
                if (!this[MUTATION_OBSERVER].class)
                  this[MUTATION_OBSERVER] = new MutationObserverClass(this);
                return this[MUTATION_OBSERVER].class;
            }
            return this[GLOBALS] && this[GLOBALS][name] || globalExports[name] || globalThis2[name];
          }
        }));
      return window2.get(this);
    }
    get doctype() {
      const docType = this[DOCTYPE];
      if (docType)
        return docType;
      const { firstChild } = this;
      if (firstChild && firstChild.nodeType === DOCUMENT_TYPE_NODE)
        return this[DOCTYPE] = firstChild;
      return null;
    }
    set doctype(value) {
      if (/^([a-z:]+)(\s+system|\s+public(\s+"([^"]+)")?)?(\s+"([^"]+)")?/i.test(value)) {
        const { $1: name, $4: publicId, $6: systemId } = RegExp;
        this[DOCTYPE] = new DocumentType(this, name, publicId, systemId);
        knownSiblings(this, this[DOCTYPE], this[NEXT]);
      }
    }
    get documentElement() {
      return this.firstElementChild;
    }
    get isConnected() {
      return true;
    }
    /**
     * @protected
     */
    _getParent() {
      return this[EVENT_TARGET];
    }
    createAttribute(name) {
      return new Attr(this, name);
    }
    createCDATASection(data) {
      return new CDATASection(this, data);
    }
    createComment(textContent2) {
      return new Comment3(this, textContent2);
    }
    createDocumentFragment() {
      return new DocumentFragment(this);
    }
    createDocumentType(name, publicId, systemId) {
      return new DocumentType(this, name, publicId, systemId);
    }
    createElement(localName) {
      return new Element2(this, localName);
    }
    createRange() {
      const range = new Range();
      range.commonAncestorContainer = this;
      return range;
    }
    createTextNode(textContent2) {
      return new Text3(this, textContent2);
    }
    createTreeWalker(root2, whatToShow = -1) {
      return new TreeWalker(root2, whatToShow);
    }
    createNodeIterator(root2, whatToShow = -1) {
      return this.createTreeWalker(root2, whatToShow);
    }
    createEvent(name) {
      const event = create(name === "Event" ? new GlobalEvent("") : new CustomEvent(""));
      event.initEvent = event.initCustomEvent = (type, canBubble = false, cancelable = false, detail) => {
        event.bubbles = !!canBubble;
        defineProperties(event, {
          type: { value: type },
          canBubble: { value: canBubble },
          cancelable: { value: cancelable },
          detail: { value: detail }
        });
      };
      return event;
    }
    cloneNode(deep = false) {
      const {
        constructor,
        [CUSTOM_ELEMENTS]: customElements2,
        [DOCTYPE]: doctype
      } = this;
      const document2 = new constructor();
      document2[CUSTOM_ELEMENTS] = customElements2;
      if (deep) {
        const end = document2[END];
        const { childNodes } = this;
        for (let { length } = childNodes, i = 0; i < length; i++)
          document2.insertBefore(childNodes[i].cloneNode(true), end);
        if (doctype)
          document2[DOCTYPE] = childNodes[0];
      }
      return document2;
    }
    importNode(externalNode) {
      const deep = 1 < arguments.length && !!arguments[1];
      const node = externalNode.cloneNode(deep);
      const { [CUSTOM_ELEMENTS]: customElements2 } = this;
      const { active } = customElements2;
      const upgrade = (element) => {
        const { ownerDocument, nodeType } = element;
        element.ownerDocument = this;
        if (active && ownerDocument !== this && nodeType === ELEMENT_NODE)
          customElements2.upgrade(element);
      };
      upgrade(node);
      if (deep) {
        switch (node.nodeType) {
          case ELEMENT_NODE:
          case DOCUMENT_FRAGMENT_NODE: {
            let { [NEXT]: next, [END]: end } = node;
            while (next !== end) {
              if (next.nodeType === ELEMENT_NODE)
                upgrade(next);
              next = next[NEXT];
            }
            break;
          }
        }
      }
      return node;
    }
    toString() {
      return this.childNodes.join("");
    }
    querySelector(selectors) {
      return query(super.querySelector, this, selectors);
    }
    querySelectorAll(selectors) {
      return query(super.querySelectorAll, this, selectors);
    }
    /* c8 ignore start */
    getElementsByTagNameNS(_, name) {
      return this.getElementsByTagName(name);
    }
    createAttributeNS(_, name) {
      return this.createAttribute(name);
    }
    createElementNS(nsp, localName, options) {
      return nsp === SVG_NAMESPACE ? new SVGElement(this, localName, null) : this.createElement(localName, options);
    }
    /* c8 ignore stop */
  };
  setPrototypeOf(
    globalExports.Document = function Document3() {
      illegalConstructor();
    },
    Document2
  ).prototype = Document2.prototype;

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/html/document.js
  var createHTMLElement = (ownerDocument, builtin, localName, options) => {
    if (!builtin && htmlClasses.has(localName)) {
      const Class = htmlClasses.get(localName);
      return new Class(ownerDocument, localName);
    }
    const { [CUSTOM_ELEMENTS]: { active, registry } } = ownerDocument;
    if (active) {
      const ce = builtin ? options.is : localName;
      if (registry.has(ce)) {
        const { Class } = registry.get(ce);
        const element = new Class(ownerDocument, localName);
        customElements.set(element, { connected: false });
        return element;
      }
    }
    return new HTMLElement(ownerDocument, localName);
  };
  var HTMLDocument = class extends Document2 {
    constructor() {
      super("text/html");
    }
    get all() {
      const nodeList = new NodeList();
      let { [NEXT]: next, [END]: end } = this;
      while (next !== end) {
        switch (next.nodeType) {
          case ELEMENT_NODE:
            nodeList.push(next);
            break;
        }
        next = next[NEXT];
      }
      return nodeList;
    }
    /**
     * @type HTMLHeadElement
     */
    get head() {
      const { documentElement } = this;
      let { firstElementChild } = documentElement;
      if (!firstElementChild || firstElementChild.tagName !== "HEAD") {
        firstElementChild = this.createElement("head");
        documentElement.prepend(firstElementChild);
      }
      return firstElementChild;
    }
    /**
     * @type HTMLBodyElement
     */
    get body() {
      const { head } = this;
      let { nextElementSibling: nextElementSibling3 } = head;
      if (!nextElementSibling3 || nextElementSibling3.tagName !== "BODY") {
        nextElementSibling3 = this.createElement("body");
        head.after(nextElementSibling3);
      }
      return nextElementSibling3;
    }
    /**
     * @type HTMLTitleElement
     */
    get title() {
      const { head } = this;
      return head.getElementsByTagName("title").at(0)?.textContent || "";
    }
    set title(textContent2) {
      const { head } = this;
      let title = head.getElementsByTagName("title").at(0);
      if (title)
        title.textContent = textContent2;
      else {
        head.insertBefore(
          this.createElement("title"),
          head.firstChild
        ).textContent = textContent2;
      }
    }
    createElement(localName, options) {
      const builtin = !!(options && options.is);
      const element = createHTMLElement(this, builtin, localName, options);
      if (builtin)
        element.setAttribute("is", options.is);
      return element;
    }
  };

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/svg/document.js
  var SVGDocument = class extends Document2 {
    constructor() {
      super("image/svg+xml");
    }
    toString() {
      return this[MIME].docType + super.toString();
    }
  };

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/xml/document.js
  var XMLDocument = class extends Document2 {
    constructor() {
      super("text/xml");
    }
    toString() {
      return this[MIME].docType + super.toString();
    }
  };

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/dom/parser.js
  var DOMParser = class _DOMParser {
    /** @typedef {{ "text/html": HTMLDocument, "image/svg+xml": SVGDocument, "text/xml": XMLDocument }} MimeToDoc */
    /**
     * @template {keyof MimeToDoc} MIME
     * @param {string} markupLanguage
     * @param {MIME} mimeType
     * @returns {MimeToDoc[MIME]}
     */
    parseFromString(markupLanguage, mimeType, globals = null) {
      let isHTML = false, document2;
      if (mimeType === "text/html") {
        isHTML = true;
        document2 = new HTMLDocument();
      } else if (mimeType === "image/svg+xml")
        document2 = new SVGDocument();
      else
        document2 = new XMLDocument();
      document2[DOM_PARSER] = _DOMParser;
      if (globals)
        document2[GLOBALS] = globals;
      if (isHTML && markupLanguage === "...")
        markupLanguage = "<!doctype html><html><head></head><body></body></html>";
      return markupLanguage ? parseFromString(document2, isHTML, markupLanguage) : document2;
    }
  };

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/shared/parse-json.js
  var { parse: parse4 } = JSON;

  // ../node_modules/.pnpm/linkedom@0.18.12/node_modules/linkedom/esm/index.js
  var parseHTML = (html, globals = null) => new DOMParser().parseFromString(
    html,
    "text/html",
    globals
  ).defaultView;
  function Document4() {
    illegalConstructor();
  }
  setPrototypeOf(Document4, Document2).prototype = Document2.prototype;

  // ../node_modules/.pnpm/postcss@8.5.16/node_modules/postcss/lib/postcss.mjs
  var import_postcss = __toESM(require_postcss(), 1);
  var stringify = import_postcss.default.stringify;
  var fromJSON = import_postcss.default.fromJSON;
  var plugin = import_postcss.default.plugin;
  var parse5 = import_postcss.default.parse;
  var list = import_postcss.default.list;
  var document = import_postcss.default.document;
  var comment = import_postcss.default.comment;
  var atRule = import_postcss.default.atRule;
  var rule = import_postcss.default.rule;
  var decl = import_postcss.default.decl;
  var root = import_postcss.default.root;
  var CssSyntaxError = import_postcss.default.CssSyntaxError;
  var Declaration = import_postcss.default.Declaration;
  var Container = import_postcss.default.Container;
  var Processor = import_postcss.default.Processor;
  var Document5 = import_postcss.default.Document;
  var Comment5 = import_postcss.default.Comment;
  var Warning = import_postcss.default.Warning;
  var AtRule = import_postcss.default.AtRule;
  var Result = import_postcss.default.Result;
  var Input = import_postcss.default.Input;
  var Rule = import_postcss.default.Rule;
  var Root2 = import_postcss.default.Root;
  var Node4 = import_postcss.default.Node;

  // ../packages/kit/dist/index.js
  var import_postcss_selector_parser = __toESM(require_dist(), 1);
  var ATTRS = `(?:\\s+[^\\s=/>]+(?:\\s*=\\s*(?:"[^"]*"|'[^']*'|[^\\s"'=<>\`]+))?)*`;
  function rewriteComponentTags(html, names) {
    let out = html;
    for (const name of names) {
      const n = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      out = out.replace(
        new RegExp(`<${n}(${ATTRS})\\s*(/?)>`, "g"),
        (_m, attrs, slash) => slash === "/" ? `<apex-component data-apex-name="${name}"${attrs}></apex-component>` : `<apex-component data-apex-name="${name}"${attrs}>`
      );
      out = out.replace(new RegExp(`</${n}>`, "g"), "</apex-component>");
    }
    return out;
  }
  function createScopeProxy(layers) {
    const ordered = layers;
    const findOwner = (key2) => {
      for (let i = ordered.length - 1; i >= 0; i--) {
        const layer = ordered[i];
        if (layer && key2 in layer) return layer;
      }
      return void 0;
    };
    return new Proxy(
      {},
      {
        get(_t, key2) {
          const owner = findOwner(key2);
          return owner ? owner[key2] : void 0;
        },
        set(_t, key2, value) {
          const owner = findOwner(key2) ?? ordered[ordered.length - 1];
          if (owner) owner[key2] = value;
          return true;
        },
        has(_t, key2) {
          if (typeof key2 === "symbol") return false;
          return findOwner(key2) !== void 0;
        }
      }
    );
  }
  var cache = /* @__PURE__ */ new Map();
  var AlpineEvalError = class extends Error {
    constructor(expression, cause) {
      const reason = cause instanceof Error ? cause.message : String(cause);
      super(`Failed to evaluate Alpine expression \`${expression}\`: ${reason}`);
      this.expression = expression;
      this.cause = cause;
      this.name = "AlpineEvalError";
    }
    expression;
    cause;
  };
  function compile4(expression) {
    const cached = cache.get(expression);
    if (cached) return cached;
    let fn;
    try {
      fn = new Function("__scope", `with (__scope) { return (${expression}) }`);
    } catch {
      fn = new Function("__scope", `with (__scope) { ${expression} }`);
    }
    cache.set(expression, fn);
    return fn;
  }
  function evaluate(expression, layers, opts = {}) {
    const scope = createScopeProxy(layers);
    try {
      return compile4(expression)(scope);
    } catch (cause) {
      if (opts.throwOnError) throw new AlpineEvalError(expression, cause);
      return void 0;
    }
  }
  var BOOLEAN_ATTRS = /* @__PURE__ */ new Set([
    "disabled",
    "checked",
    "selected",
    "readonly",
    "required",
    "multiple",
    "hidden",
    "open",
    "autofocus",
    "novalidate",
    "formnovalidate"
  ]);
  function applyClassBinding(el, value) {
    const existing = (el.getAttribute("class") ?? "").split(/\s+/).filter(Boolean);
    const set = new Set(existing);
    collectClasses(value, set);
    const next = [...set].join(" ");
    if (next) el.setAttribute("class", next);
    else el.removeAttribute("class");
  }
  function collectClasses(value, set) {
    if (!value) return;
    if (typeof value === "string") {
      for (const t of value.split(/\s+/).filter(Boolean)) set.add(t);
    } else if (Array.isArray(value)) {
      for (const v of value) collectClasses(v, set);
    } else if (typeof value === "object") {
      for (const [key2, on] of Object.entries(value)) {
        if (on) for (const t of key2.split(/\s+/).filter(Boolean)) set.add(t);
        else for (const t of key2.split(/\s+/).filter(Boolean)) set.delete(t);
      }
    }
  }
  function applyStyleBinding(el, value) {
    if (!value) return;
    const existing = el.getAttribute("style") ?? "";
    let addition = "";
    if (typeof value === "string") {
      addition = value;
    } else if (typeof value === "object") {
      addition = Object.entries(value).filter(([, v]) => v != null && v !== false).map(([k, v]) => `${camelToKebab(k)}: ${String(v)}`).join("; ");
    }
    if (!addition) return;
    const sep = existing && !existing.trim().endsWith(";") ? "; " : existing ? " " : "";
    el.setAttribute("style", `${existing}${sep}${addition}`.trim());
  }
  function camelToKebab(s) {
    return s.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
  }
  function applyAttrBinding(el, attr, value) {
    if (attr === "class") {
      applyClassBinding(el, value);
      return;
    }
    if (attr === "style") {
      applyStyleBinding(el, value);
      return;
    }
    if (BOOLEAN_ATTRS.has(attr)) {
      if (value) el.setAttribute(attr, "");
      else el.removeAttribute(attr);
      return;
    }
    if (value == null || value === false) {
      el.removeAttribute(attr);
      return;
    }
    el.setAttribute(attr, String(value));
  }
  function resolveBindTarget(attrName) {
    if (attrName.startsWith(":")) return attrName.slice(1);
    if (attrName.startsWith("x-bind:")) return attrName.slice("x-bind:".length);
    return null;
  }
  function applyBinding(el, target, expression, layers) {
    applyAttrBinding(el, target, evaluate(expression, layers));
  }
  var FOR_RE = /^\s*(?:\(\s*([^,\s]+)\s*(?:,\s*([^)\s]+)\s*)?\)|([^,\s]+))\s+(?:in|of)\s+(.+?)\s*$/;
  function parseForExpression(expr) {
    const m = FOR_RE.exec(expr);
    if (!m) return null;
    const item = m[1] ?? m[3];
    if (!item) return null;
    return { item, index: m[2], items: m[4] };
  }
  function toIterablePairs(value) {
    if (value == null) return [];
    if (typeof value === "number") {
      return Array.from({ length: value }, (_, i) => [i + 1, i]);
    }
    if (Array.isArray(value)) return value.map((v, i) => [v, i]);
    if (typeof value === "object") {
      return Object.values(value).map((v, i) => [v, i]);
    }
    return [];
  }
  function createMagics(el, idCounter, stores = {}) {
    return {
      // `$el` is the element currently being rendered — works naturally.
      $el: el,
      // Deterministic id stub (Alpine's $id). Deterministic keeps SSR stable.
      $id: (name) => `${name}-ssr-${idCounter.n++}`,
      // Inert during SSR — no event loop, no reactivity yet.
      $refs: {},
      $dispatch: () => {
      },
      $nextTick: (cb) => {
        if (typeof cb === "function") cb();
      },
      $watch: () => {
      },
      // Global stores are available during SSR (initial state) so `$store.x.y`
      // renders server-side; real Alpine reactivity takes over after hydration.
      $store: stores
    };
  }
  var ELEMENT_NODE2 = 1;
  var SSR_IGNORED_PREFIXES = ["@", "x-on:"];
  async function renderComponent(input) {
    const { template, rootXData, componentId, scopeId, loaderData } = input;
    const registry = input.registry ?? {};
    const prepared = rewriteComponentTags(template, Object.keys(registry));
    const { document: document2 } = parseHTML(`<!DOCTYPE html><html><body>${prepared}</body></html>`);
    const body = document2.body;
    const root2 = document2.createElement("div");
    root2.setAttribute("x-data", `apex_${componentId}`);
    root2.setAttribute("data-apex-root", componentId);
    while (body.firstChild) root2.appendChild(body.firstChild);
    const authoredExpr = rootXData ?? void 0;
    const authoredDefaults = input.authoredDefaults ?? (authoredExpr?.trim() ? evaluate(authoredExpr, [{}]) ?? {} : {});
    const rootData = { ...authoredDefaults, ...loaderData };
    const idCounter = { n: 0 };
    const magics = createMagics(root2, idCounter, input.stores);
    const layers = [magics, rootData];
    stampScope(root2, scopeId);
    await walkChildren(root2, layers, scopeId, document2, registry);
    return { html: root2.outerHTML, rootData };
  }
  async function renderFragmentInternal(templateHtml, layers, scopeId, registry) {
    const prepared = rewriteComponentTags(templateHtml, Object.keys(registry));
    const { document: document2 } = parseHTML(`<!DOCTYPE html><html><body>${prepared}</body></html>`);
    const body = document2.body;
    await walkChildren(body, layers, scopeId, document2, registry);
    return body.innerHTML;
  }
  async function walkChildren(parent, layers, scopeId, document2, registry) {
    const children = Array.from(parent.childNodes);
    for (const node of children) {
      if (node.nodeType !== ELEMENT_NODE2) continue;
      await walkElement(node, layers, scopeId, document2, registry);
    }
  }
  async function walkElement(el, layers, scopeId, document2, registry) {
    const tag = String(el.tagName).toLowerCase();
    if (tag === "apex-component") {
      await renderComponentInstance(el, layers, scopeId, document2, registry);
      return;
    }
    if (tag === "template") {
      const xFor = el.getAttribute("x-for");
      if (xFor != null) {
        await renderFor(el, xFor, layers, scopeId, document2, registry);
        return;
      }
      const xIf = el.getAttribute("x-if");
      if (xIf != null) {
        await renderIf(el, xIf, layers, scopeId, document2, registry);
        return;
      }
      return;
    }
    if (el.hasAttribute("x-cloak")) el.removeAttribute("x-cloak");
    let scoped = layers;
    const nestedData = el.getAttribute("x-data");
    if (nestedData?.trim()) {
      const obj = evaluate(nestedData, layers) ?? {};
      scoped = [...layers, obj];
    }
    stampScope(el, scopeId);
    for (const attr of Array.from(el.attributes)) {
      const name = attr.name;
      if (SSR_IGNORED_PREFIXES.some((p) => name.startsWith(p))) continue;
      const target = resolveBindTarget(name);
      if (target) applyBinding(el, target, attr.value, scoped);
    }
    const xShow = el.getAttribute("x-show");
    if (xShow != null && !evaluate(xShow, scoped)) {
      const style = el.getAttribute("style") ?? "";
      const sep = style && !style.trim().endsWith(";") ? "; " : style ? " " : "";
      el.setAttribute("style", `${style}${sep}display: none`.trim());
    }
    const xHtml = el.getAttribute("x-html");
    const xText = el.getAttribute("x-text");
    if (xHtml != null) {
      el.innerHTML = String(evaluate(xHtml, scoped) ?? "");
    } else if (xText != null) {
      el.textContent = String(evaluate(xText, scoped) ?? "");
    } else {
      await walkChildren(el, scoped, scopeId, document2, registry);
    }
  }
  async function renderComponentInstance(el, layers, scopeId, document2, registry) {
    const name = el.getAttribute("data-apex-name");
    const entry = registry[name];
    if (!entry) {
      el.replaceWith(document2.createComment(` apex: unknown component "${name}" `));
      return;
    }
    const slotSource = String(el.innerHTML ?? "");
    const slotHtml = slotSource.trim() ? await renderFragmentInternal(slotSource, layers, scopeId, registry) : "";
    const props = {};
    let clientDirective = null;
    for (const attr of Array.from(el.attributes)) {
      const n = attr.name;
      if (n === "data-apex-name") continue;
      if (n.startsWith("client:")) {
        clientDirective = n;
        continue;
      }
      if (n.startsWith(":")) props[n.slice(1)] = evaluate(attr.value, layers);
      else if (n.startsWith("x-bind:"))
        props[n.slice("x-bind:".length)] = evaluate(attr.value, layers);
      else props[n] = attr.value;
    }
    const loaderData = entry.loader ? await entry.loader({ props }) ?? {} : {};
    const dataObj = entry.rootXData?.trim() ? evaluate(entry.rootXData, [{ ...props, ...loaderData }]) ?? {} : {};
    const merged = { ...props, ...loaderData, ...dataObj };
    const idCounter = { n: 0 };
    const innerLayers = [createMagics(el, idCounter), merged];
    const innerHtml = await renderFragmentInternal(
      entry.template,
      innerLayers,
      entry.scopeId,
      registry
    );
    const root2 = document2.createElement("div");
    root2.setAttribute("x-data", JSON.stringify(merged));
    root2.setAttribute("data-apex-component", name);
    root2.setAttribute(entry.scopeId, "");
    if (clientDirective) root2.setAttribute(clientDirective, "");
    root2.innerHTML = innerHtml.replace(
      /<slot\b[^>]*>([\s\S]*?)<\/slot>/,
      (_m, fallback) => slotHtml || fallback
    );
    el.replaceWith(root2);
  }
  function expandTemplateComponents(template, document2, registry) {
    template.innerHTML = expandComponentsHtml(template.innerHTML, document2, registry);
  }
  function expandComponentsHtml(html, document2, registry) {
    const holder = document2.createElement("div");
    holder.innerHTML = html;
    expandComponentsInEl(holder, document2, registry);
    return holder.innerHTML;
  }
  function expandComponentsInEl(container, document2, registry) {
    for (const node of Array.from(container.childNodes ?? [])) {
      if (node.nodeType !== ELEMENT_NODE2) continue;
      const tag = String(node.tagName).toLowerCase();
      if (tag === "apex-component") {
        const repl = buildStructuralComponent(node, document2, registry);
        node.replaceWith(repl);
        expandComponentsInEl(repl, document2, registry);
      } else if (tag === "template") {
        node.innerHTML = expandComponentsHtml(node.innerHTML, document2, registry);
      } else {
        expandComponentsInEl(node, document2, registry);
      }
    }
  }
  function buildStructuralComponent(el, document2, registry) {
    const name = el.getAttribute("data-apex-name");
    const entry = registry[name];
    if (!entry) return document2.createComment(` apex: unknown component "${name}" `);
    const staticEntries = [];
    const dynEntries = [];
    for (const attr of Array.from(el.attributes)) {
      const n = attr.name;
      if (n === "data-apex-name" || n.startsWith("client:")) continue;
      if (n.startsWith(":")) dynEntries.push(`${JSON.stringify(n.slice(1))}: (${attr.value})`);
      else if (n.startsWith("x-bind:"))
        dynEntries.push(`${JSON.stringify(n.slice("x-bind:".length))}: (${attr.value})`);
      else staticEntries.push(`${JSON.stringify(n)}: ${JSON.stringify(attr.value)}`);
    }
    const propObj = `{ ${[...staticEntries, ...dynEntries].join(", ")} }`;
    const hasProps = staticEntries.length + dynEntries.length > 0;
    const rootXData = entry.rootXData?.trim();
    const base = rootXData ? (
      // Props are in scope (as bare names) for the component's x-data, then merged.
      `(function(p){with(p){return Object.assign({},p,(${rootXData}))}})(${propObj})`
    ) : hasProps ? propObj : null;
    let xData = base;
    if (entry.loader) {
      xData = `Object.assign({}, ${base ?? "{}"}, (__APEX_LMAP__[String(__APEX_LKEY__)]||{}))`;
    }
    const slotSource = String(el.innerHTML ?? "").trim();
    const inner = rewriteComponentTags(entry.template, Object.keys(registry)).replace(
      /<slot\b[^>]*>([\s\S]*?)<\/slot>/,
      (_m, fallback) => slotSource || fallback
    );
    const root2 = document2.createElement("div");
    root2.setAttribute("data-apex-component", name);
    root2.setAttribute(entry.scopeId, "");
    if (xData) root2.setAttribute("x-data", xData);
    if (entry.loader) {
      root2.setAttribute("data-apex-lname", name);
      root2.setAttribute("data-apex-lprops", propObj);
    }
    root2.innerHTML = inner;
    stampSubtreeScope(root2, entry.scopeId);
    return root2;
  }
  function stampSubtreeScope(el, scopeId) {
    for (const child of Array.from(el.childNodes ?? [])) {
      if (child.nodeType !== ELEMENT_NODE2) continue;
      if (child.hasAttribute("data-apex-component")) continue;
      child.setAttribute(scopeId, "");
      stampSubtreeScope(child, scopeId);
    }
  }
  async function bakeComponentLoaders(template, instanceScopes, keyExpr, registry, document2) {
    const holder = document2.createElement("div");
    holder.innerHTML = template.innerHTML;
    const divs = Array.from(holder.querySelectorAll("[data-apex-lname]"));
    if (!divs.length) return;
    for (const div of divs) {
      const name = div.getAttribute("data-apex-lname");
      const propsExpr = div.getAttribute("data-apex-lprops") || "{}";
      div.removeAttribute("data-apex-lname");
      div.removeAttribute("data-apex-lprops");
      const loader = registry[name]?.loader;
      if (!loader) continue;
      const map = {};
      const memo = /* @__PURE__ */ new Map();
      for (const scope of instanceScopes) {
        const props = evaluate(`(${propsExpr})`, scope) ?? {};
        const keyVal = String(evaluate(keyExpr, scope));
        const memoKey = JSON.stringify(props);
        let data;
        if (memo.has(memoKey)) data = memo.get(memoKey);
        else {
          data = await loader({ props }) ?? {};
          memo.set(memoKey, data);
        }
        map[keyVal] = data;
      }
      const xd = (div.getAttribute("x-data") ?? "").replace("__APEX_LMAP__", JSON.stringify(map)).replace("__APEX_LKEY__", `(${keyExpr})`);
      div.setAttribute("x-data", xd);
    }
    template.innerHTML = holder.innerHTML;
  }
  async function renderFor(template, expr, layers, scopeId, document2, registry) {
    expandTemplateComponents(template, document2, registry);
    const parsed = parseForExpression(expr);
    if (!parsed) return;
    const pairs = Array.from(toIterablePairs(evaluate(parsed.items, layers)));
    const itemScopeFor = (value, index) => {
      const s = { [parsed.item]: value };
      if (parsed.index) s[parsed.index] = index;
      return s;
    };
    const keyExpr = template.getAttribute(":key") || parsed.item;
    await bakeComponentLoaders(
      template,
      pairs.map(([value, index]) => [...layers, itemScopeFor(value, index)]),
      keyExpr,
      registry,
      document2
    );
    let anchor = template;
    for (const [value, index] of pairs) {
      const scoped = [...layers, itemScopeFor(value, index)];
      const frag = template.content.cloneNode(true);
      const clones = Array.from(frag.childNodes);
      anchor.after(frag);
      for (const clone of clones) {
        if (clone.nodeType !== ELEMENT_NODE2) continue;
        clone.setAttribute("data-apex-ssr", "");
        await walkElement(clone, scoped, scopeId, document2, registry);
        anchor = clone;
      }
    }
  }
  async function renderIf(template, expr, layers, scopeId, document2, registry) {
    expandTemplateComponents(template, document2, registry);
    if (!evaluate(expr, layers)) return;
    await bakeComponentLoaders(template, [layers], "'_'", registry, document2);
    const frag = template.content.cloneNode(true);
    const clones = Array.from(frag.childNodes);
    template.after(frag);
    for (const clone of clones) {
      if (clone.nodeType !== ELEMENT_NODE2) continue;
      clone.setAttribute("data-apex-ssr", "");
      await walkElement(clone, layers, scopeId, document2, registry);
    }
  }
  function stampScope(el, scopeId) {
    el.setAttribute(scopeId, "");
  }

  // render-entry.mjs
  async function run() {
    const { html } = await renderComponent({
      template: '<main><h1 x-text="title"></h1><p x-show="ok">visible</p><ul><template x-for="n in items"><li x-text="n"></li></template></ul></main>',
      componentId: "c0",
      scopeId: "data-apex-x",
      loaderData: { title: "Rendered on a bare JS engine", ok: true, items: ["alpha", "beta", "gamma"] }
    });
    return html;
  }
  return __toCommonJS(render_entry_exports);
})();
/*! Bundled license information:

cssesc/cssesc.js:
  (*! https://mths.be/cssesc v3.0.0 by @mathias *)
*/
