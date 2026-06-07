// /ambulance/tools/gcs.js
// CHANGELOG (2026-06-06):
// - Rebuild with the shared Android-aligned score chip UI and add the Android note/reset behavior.

import { renderChipScore, levelForGcs } from "../score_common.js";

export async function run(root, params = {}) {
  renderChipScore(root, {
    hash: params.embedded !== true,
    tool:"gcs",
    title:"Glasgow Coma Scale",
    initialText:"E4, V5, M6  (Total 15)",
    note:"When assessing level of consciousness, consider alcohol or other intoxicating substances.\n\nRegularly reassess LOC to identify deterioration or improvement.",
    sections:[
      { key:"e", title:"Eye (E)", defaultScore:4, maxColumns:2, options:[
        { score:4, label:"Spontaneous" },
        { score:3, label:"Reacts to speech" },
        { score:2, label:"Reacts to pain" },
        { score:1, label:"No response" }
      ]},
      { key:"v", title:"Verbal (V)", defaultScore:5, chipFont:11, maxColumns:3, rowHeight:58, options:[
        { score:5, label:"Oriented" },
        { score:4, label:"Confused" },
        { score:3, label:"Inappropriate words" },
        { score:2, label:"Incomprehensible" },
        { score:1, label:"No response" }
      ]},
      { key:"m", title:"Motor (M)", defaultScore:6, chipFont:11, maxColumns:3, rowHeight:58, options:[
        { score:6, label:"Obeys commands" },
        { score:5, label:"Localises to pain" },
        { score:4, label:"Withdraws from pain" },
        { score:3, label:"Flexion response" },
        { score:2, label:"Extension response" },
        { score:1, label:"No response" }
      ]}
    ],
    compute(values) {
      const total = values.e + values.v + values.m;
      return { text:`E${values.e}, V${values.v}, M${values.m}  (Total ${total})`, level:levelForGcs(total) };
    }
  });
}
