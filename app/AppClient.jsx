"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { UserButton } from "@clerk/nextjs";
import {
  NON_NEGOTIABLES, VOICE_PAIRS, PRODUCTS, SHIPPING_ROWS, ESCALATION,
  PRODUCT_CARDS, ABOUT_IM8_QA, COMMON_PRODUCT_QA, PRODUCT_QA_CHIPS,
  POLICY_QA, POLICY_QA_CHIPS, PLAYBOOK_SUBTABS_NEW,
} from "../lib/playbook-data";
import { AFFILIATES_DATA } from "../lib/affiliates-data";
import { PRODUCT_LIST, PRODUCT_CATALOGUE, PRODUCT_CATALOGUE_SIMPLE, PRODUCT_LIST_SIMPLE } from "../lib/products-catalogue";
import { REPLACEMENT_MAIN_REASONS, getSubsForMains } from "../lib/replacement-reasons";
import {
  buildAskLumaSystem,
  SHIPPING_LEAD_TIMES,
  ESCALATE_IMMEDIATELY,
  DECISION_TREE,
  VOICE_RULES,
  TOOLKIT,
} from "../lib/ask-luma-knowledge";

// ─── Design Tokens ───────────────────────────────────────────────────────────
const RED  = "#B44444";
const BURG = "#0A0A09";
const GOLD = "#C4A96B";
const CREAM = "#F4F0E8";
const W = "#FAF8F3";
const F = {
  sans:  "'DM Sans','Arial',sans-serif",
  serif: "'Cormorant Garamond','Georgia',serif",
};
const HEADER_GRAD = "#FAF8F3";
const HERO_GRAD   = "#F4F0E8";

// ─── Constants ───────────────────────────────────────────────────────────────
const LB_KEY = "luma_cx_lb_v1";
const TABS = ["Home","Insights","Reports","Logs","Records","Ask LUMÉ","Playbook","Affiliates","Training","Team"];
// Roles list mirrored from lib/auth.js — kept inline so the client bundle
// doesn't have to pull in the server-only helpers from that module.
const TEAM_ROLES = ["New Starter", "Agent", "Ops", "Lead Agent", "Manager", "Admin", "Owner"];
const BC_KEY = "luma_cx_bc_v1";
const BC_PASS = 0.75;

// ─── Quiz Data ────────────────────────────────────────────────────────────────
const MODULES = [
  {
    id:"m1", title:"Brand, Culture and Values", day:1,
    tag:"Day 1 - Foundation", critical:false,
    questions:[
      {
        q:"What does IM8 stand for?",
        options:[
          "I Make 8 vitamins",
          "I AM plus 8 symbolizing infinity and balance",
          "Integrated Medicine 8",
          "International Minerals 8"
        ],
        correct:1,
        exp:"IM equals I AM, a declaration of self-empowerment. The 8 symbolizes balance, infinity, and continuous improvement."
      },
      {
        q:"Which IM8 value means going beyond the minimum to make interactions memorable?",
        options:["Passion","Resilience","Epic","Integrity"],
        correct:2,
        exp:"Epic means going beyond the minimum. Look for opportunities to turn a standard interaction into a memorable, positive experience."
      },
      {
        q:"Which value applies when you stay calm with an aggressive customer?",
        options:["Transparency","Resilience","Empowerment","Selfless"],
        correct:1,
        exp:"Resilience means staying calm under pressure. Handle frustrated customers without losing focus or empathy."
      },
      {
        q:"What is the correct ticket prioritization order?",
        options:[
          "Oldest first always",
          "VIPs and escalations, then SLA deadlines, then first-time customers, then all others oldest first",
          "Refunds first then shipping",
          "First-time customers first"
        ],
        correct:1,
        exp:"P1 VIPs and escalations. P2 SLA approaching. P3 First-time customers. P4 All others oldest first."
      },
      {
        q:"The IM8 mindset includes all of these EXCEPT:",
        options:["Intensity","Humility","Complacency","Grit"],
        correct:2,
        exp:"The IM8 mindset is Intensity, Humility, Ambition, Grit, Team-first. Complacency has no place here."
      },
      {
        q:"Who is the IM8 customer?",
        options:[
          "Budget-conscious shoppers",
          "Health-conscious, informed, proactive about well-being, expecting clear answers and fast resolution",
          "Elderly customers only",
          "Fitness athletes only"
        ],
        correct:1,
        exp:"The IM8 user is health-conscious, informed, and proactive. They invest in long-term health and expect a premium experience."
      },
    ]
  },
  {
    id:"m2", title:"Tools, Workflow and Documentation", day:1,
    tag:"Day 1 - Systems", critical:false,
    questions:[
      {
        q:"What is Gorgias used for?",
        options:[
          "Warehouse management",
          "Central hub for all customer conversations including email, live chat, and social media",
          "Subscription management",
          "Order tracking only"
        ],
        correct:1,
        exp:"Gorgias is your primary ticketing platform, the central hub for email, live chat, and social media conversations."
      },
      {
        q:"What platform manages customer subscriptions?",
        options:["Shopify","Extensiv","Skio","Aftership"],
        correct:2,
        exp:"Skio is the subscription portal. Customers can pause, skip, cancel, or change frequency through it."
      },
      {
        q:"What should you check FIRST at the start of every shift?",
        options:[
          "Your email inbox",
          "Slack for urgent announcements or escalations then open tickets",
          "Gorgias ticket queue",
          "Yesterday closed tickets"
        ],
        correct:1,
        exp:"Morning routine: Check Slack first especially channels you are tagged in, then review open tickets, then read daily TL notes."
      },
      {
        q:"What must good internal ticket notes always include?",
        options:[
          "Just the customer name and order number",
          "Summary of issue, action taken, reason for action, and next steps",
          "Only the resolution",
          "A copy of your response"
        ],
        correct:1,
        exp:"Good notes tell a story anyone can understand in seconds: issue summary, action taken, reason such as Applied 30-Day Guarantee, and next steps."
      },
      {
        q:"When should you tag a ticket?",
        options:[
          "Only when escalating",
          "Always apply relevant tags like refund or shipping delay before closing every ticket",
          "Only for refund tickets",
          "Only when QC requests it"
        ],
        correct:1,
        exp:"Always tag before closing. Tags like refund, shipping_delay, damaged_product are essential for team reporting and QC review."
      },
      {
        q:"Aftership is used for:",
        options:[
          "Processing refunds",
          "Subscription management",
          "Tracking and delivery monitoring",
          "Escalating to FedEx"
        ],
        correct:2,
        exp:"Aftership is your tracking and delivery monitoring tool. Always check it before responding to any delivery query."
      },
    ]
  },
  {
    id:"m3", title:"Tone of Voice and Communication", day:2,
    tag:"Day 2 - Voice", critical:false,
    questions:[
      {
        q:"Which response best reflects IM8 tone for a shipping delay?",
        options:[
          "Your ticket has been received and will be processed shortly",
          "Thanks for flagging the delay, that is not the experience we promise. I have asked our logistics team to trace the parcel within 24 hours",
          "We apologize for the inconvenience caused by this delay in accordance with our shipping policy",
          "I will look into your order shortly"
        ],
        correct:1,
        exp:"IM8 voice is warm, direct, action-oriented. Short sentences. Own the problem. Give a clear timeline. Never corporate or passive."
      },
      {
        q:"A customer is very angry. The IM8 way is to:",
        options:[
          "Match their energy",
          "Apologise repeatedly",
          "Acknowledge their frustration, stay calm, and focus on resolution",
          "Immediately offer a refund"
        ],
        correct:2,
        exp:"Acknowledge, stay calm, solve. Say: I can absolutely see how frustrating this is and I want to get this sorted for you right now."
      },
      {
        q:"Which phrase is NOT IM8 voice?",
        options:[
          "We have got your back",
          "Thanks for flagging that",
          "Per our policy we cannot process this request",
          "Here is how we will make this right"
        ],
        correct:2,
        exp:"Per our policy is corporate and cold. IM8 is warm and solution-focused. Say: While this falls outside our standard policy, here is what I can do for you."
      },
      {
        q:"What does Epic look like in a customer interaction?",
        options:[
          "Closing the ticket quickly",
          "Doing the bare minimum to resolve the issue",
          "Turning a standard resolution into a memorable experience such as a personal follow-up",
          "Using all available macros"
        ],
        correct:2,
        exp:"Epic means going above and beyond. A follow-up checking the replacement arrived. A personal note. Something the customer does not expect."
      },
      {
        q:"The QC scorecard checks 5 areas. Which is NOT one of them?",
        options:[
          "Accuracy",
          "Tone and Empathy",
          "Response Speed",
          "Records and Notes"
        ],
        correct:2,
        exp:"The 5 QC categories are Accuracy, Tone and Empathy, Clarity, Efficiency, and Records and Notes. Response Speed is part of Efficiency, not its own category."
      },
    ]
  },
  {
    id:"m4", title:"Daily Ultimate Essentials PRO", day:2,
    tag:"Day 2 - Product", critical:false,
    questions:[
      {
        q:"How many ingredients are in Daily Ultimate Essentials?",
        options:["62","78","92","104"],
        correct:2,
        exp:"92 carefully selected premium ingredients targeting 8 key health areas: Energy, Immunity, Cognitive Function, Digestion, Cardiovascular, Hydration, Nourishment, Cellular Renewal."
      },
      {
        q:"What ingredient is exclusive to PRO vs the original?",
        options:[
          "Extra CoQ10",
          "Saffron Flower Extract 30mg for mood and cognitive function",
          "Astaxanthin",
          "Turmeric"
        ],
        correct:1,
        exp:"Saffron Flower Extract 30mg is PRO exclusive. Clinically studied for mood, stress reduction, and cognitive performance."
      },
      {
        q:"MSM dosage in PRO?",
        options:["500mg","1000mg","1500mg","2000mg"],
        correct:2,
        exp:"1500mg in PRO, up from 1000mg in the original. This is the full clinical dosage range for joint and muscle support."
      },
      {
        q:"A customer asks if Essentials breaks their intermittent fast:",
        options:[
          "No it is calorie-free",
          "Essentials PRO has 20 calories and may technically break a strict fast. Best taken in the eating window.",
          "Only if taken with food",
          "It is fine for any fasting protocol"
        ],
        correct:1,
        exp:"Be honest. Essentials PRO has 20 calories. For strict fasting recommend taking it in the eating window. Do not over-promise."
      },
      {
        q:"Can Essentials replace a fish oil supplement?",
        options:[
          "Yes IM8 has everything",
          "No, current products have no DHA or EPA. A separate omega-3 may still be needed.",
          "Only with the Beckham Stack",
          "Yes CoQ10 covers it"
        ],
        correct:1,
        exp:"DHA was removed from the Longevity Powder. A dedicated omega product is planned. Be transparent and recommend a separate omega-3 for now."
      },
      {
        q:"The probiotic strains in Essentials are:",
        options:[
          "Lactobacillus acidophilus plus Bifidobacterium",
          "DE111 Bacillus subtilis plus BC99 Bacillus coagulans, 10B CFU, shelf-stable",
          "L casei 327 only",
          "Saccharomyces boulardii"
        ],
        correct:1,
        exp:"DE111 and BC99, both spore-forming and shelf-stable with no refrigeration needed. FloraSMART L casei 327 is the postbiotic component."
      },
    ]
  },
  {
    id:"m5", title:"Daily Ultimate Longevity Powder", day:2,
    tag:"Day 2 - Product", critical:false,
    questions:[
      {
        q:"How many hallmarks of aging does the Longevity Powder target?",
        options:["6","8","10","All 12"],
        correct:3,
        exp:"The 5-complex system targets all 12 hallmarks of aging as defined by Cell journal 2023. First supplement to do so."
      },
      {
        q:"NMN dosage per sachet?",
        options:["100mg","200mg","300mg","500mg"],
        correct:2,
        exp:"300mg NMN, a direct NAD+ precursor and one step closer to NAD+ than NR which is Nicotinamide Riboside."
      },
      {
        q:"The Cellular Foundation Builder complex contains:",
        options:[
          "NMN plus PQQ",
          "Glycine 3g plus Taurine 2g",
          "Resveratrol plus Quercetin",
          "Spermidine plus Astaxanthin"
        ],
        correct:1,
        exp:"3g Glycine plus 2g Taurine equals 5g total. Based on breakthrough Science journal taurine longevity research."
      },
      {
        q:"Why is the Longevity Powder orange?",
        options:[
          "Artificial colouring",
          "Pomegranate extract",
          "From astaxanthin AstaPure, a natural antioxidant carotenoid. Color may vary between batches and this is normal.",
          "Beta-carotene added separately"
        ],
        correct:2,
        exp:"The orange colour comes naturally from astaxanthin. Same compound that gives salmon their colour. Natural batch variation is normal, reassure customers."
      },
      {
        q:"An existing subscriber asks why they are charged $89 but the website shows $149:",
        options:[
          "There is a billing error",
          "Existing subscribers are grandfathered at their original price for life as a permanent loyalty benefit",
          "The $89 is a limited-time promotion",
          "They need to upgrade their plan"
        ],
        correct:1,
        exp:"Grandfathered pricing is permanent for existing subscribers as a thank-you for early support. For Longevity: new customers pay $149 one-time or $119/month subscription."
      },
      {
        q:"Is the Longevity Powder NSF Certified for Sport?",
        options:[
          "Yes all IM8 products are NSF certified",
          "No, NSF certification is PENDING. Never confirm until officially received.",
          "Yes certified Q4 2025",
          "Only the original capsule was certified"
        ],
        correct:1,
        exp:"IMPORTANT: NSF certification for the Longevity Powder is PENDING. Never confirm certifications not yet received. This is a compliance issue."
      },
    ]
  },
  {
    id:"m6", title:"Policies and Resolutions", day:3,
    tag:"Day 3 - Policies", critical:false,
    questions:[
      {
        q:"A first-time customer wants a refund 25 days after delivery. What applies?",
        options:[
          "Reject, too close to the 30-day limit",
          "Apply the 30-day money-back guarantee, opened or unopened, first order only. Customer pays return shipping.",
          "Offer store credit only",
          "Approve only if unopened"
        ],
        correct:1,
        exp:"30-day money-back guarantee covers first orders, opened or unopened, from date of arrival. Customer pays return shipping. Complimentary items are non-refundable."
      },
      {
        q:"A customer says their package is marked delivered but has not arrived. First step?",
        options:[
          "Immediately send a replacement",
          "Confirm their shipping address is correct, advise checking with neighbours, wait 24 hours",
          "File a claim with the courier",
          "Ask for a photo"
        ],
        correct:1,
        exp:"Confirm address, advise checking with neighbours, wait 24 hours. If still missing send a free replacement. Do not jump straight to replacement."
      },
      {
        q:"A customer claims a second lost package within 12 months. You:",
        options:[
          "Process replacement as normal",
          "Escalate immediately, second claim within 12 months is a fraud flag",
          "Ask them to wait longer",
          "Offer a partial refund"
        ],
        correct:1,
        exp:"Second lost package or empty box within 12 months equals escalate immediately. This is a fraud flag per the CS Handbook."
      },
      {
        q:"A customer sends a photo of a damaged product. You:",
        options:[
          "Offer a refund immediately",
          "Ask what happened before deciding",
          "Thank them for the photo and process a free replacement shipping within 24 hours",
          "Send a discount code"
        ],
        correct:2,
        exp:"Damaged product plus photo evidence equals replacement. Say: I am so sorry to see this. I have processed a free replacement and it will ship within 24 hours."
      },
      {
        q:"Free shipping applies to subscriptions EXCEPT which countries?",
        options:[
          "UK and USA",
          "Norway and Switzerland at $15 flat rate, plus Israel, Saudi Arabia, and UAE calculated at checkout",
          "Canada and Australia",
          "All countries get free shipping"
        ],
        correct:1,
        exp:"Free worldwide shipping on subscriptions EXCEPT Norway and Switzerland at $15 flat. Israel, Saudi Arabia, UAE calculated at checkout."
      },
      {
        q:"A customer wants to pause their subscription for 2 months. You:",
        options:[
          "Tell them to cancel and resubscribe",
          "Direct them to their subscription portal where they can pause, skip, change frequency, or cancel anytime",
          "Process it manually through Skio",
          "Tell them pausing is not available"
        ],
        correct:1,
        exp:"Customers have full control via the subscription portal: pause, skip, swap, change frequency, or cancel. Empower them, do not create friction."
      },
    ]
  },
  {
    id:"m7", title:"Shipping and Delivery", day:3,
    tag:"Day 3 - Shipping", critical:false,
    questions:[
      {
        q:"Standard US delivery takes approximately:",
        options:[
          "1-2 business days",
          "3-4 business days",
          "Around 6 calendar days",
          "10-14 calendar days"
        ],
        correct:2,
        exp:"US average delivery is around 6 calendar days from order date based on real shipping data."
      },
      {
        q:"Which country has the fastest delivery time?",
        options:[
          "Singapore 5 days",
          "Hong Kong 4 days",
          "United States 6 days",
          "Japan 6 days"
        ],
        correct:1,
        exp:"Hong Kong has the fastest average delivery at around 4 calendar days. Singapore is second at around 5 days."
      },
      {
        q:"A UK customer says their order has not arrived after 5 days. What do you tell them?",
        options:[
          "Their order is definitely lost",
          "UK average is around 7 days so they are still within normal range. Check tracking and advise them to wait a little longer.",
          "Immediately send a replacement",
          "Escalate to the warehouse"
        ],
        correct:1,
        exp:"UK average is around 7 calendar days. At day 5, still within normal range. Check Aftership for tracking status and reassure the customer."
      },
      {
        q:"A Canadian customer asks why their order is taking so long at 12 days:",
        options:[
          "That is unusual, escalate immediately",
          "Canada average is around 16 days so they are still within normal range. Reassure them.",
          "Tell them international orders take 7-14 days",
          "Offer a refund proactively"
        ],
        correct:1,
        exp:"Canada average is around 16 calendar days. At 12 days, still within range. Reassure with accurate timeline. Never quote generic 7-14 days when you have real data."
      },
      {
        q:"Norway has a flat shipping surcharge for subscription orders of:",
        options:["$5","$10","$15","$20"],
        correct:2,
        exp:"Norway and Switzerland both have a $15 flat shipping rate for subscription orders, even though all other countries ship free on subscriptions."
      },
      {
        q:"Which tool do you check first before responding to any delivery query?",
        options:["Shopify","Skio","Aftership","Extensiv"],
        correct:2,
        exp:"Always check Aftership first before responding to any delivery query. Never guess, check the actual tracking status."
      },
    ]
  },
  {
    id:"m8", title:"Sensitive Info and Compliance", day:4,
    tag:"Day 4 - Critical", critical:true,
    questions:[
      {
        q:"A customer asks: I have Type 2 diabetes, is IM8 safe? You:",
        options:[
          "Say IM8 is safe for most people",
          "Give them the ingredient list and let them decide",
          "Direct them to consult their healthcare professional. We cannot give medical advice. No exceptions.",
          "Ask what medications they take and advise"
        ],
        correct:2,
        exp:"CRITICAL: Any medical condition question means refer to healthcare professional. No exceptions. This is a legal liability. Never diagnose, advise, or imply safety for specific conditions."
      },
      {
        q:"A customer asks for the exact mg breakdown of your proprietary blend. You:",
        options:[
          "Share everything from the label",
          "Share only label-listed ingredient amounts. Proprietary blend ratios and manufacturing details are confidential.",
          "Refuse and close the ticket",
          "Estimate based on the formula"
        ],
        correct:1,
        exp:"WITHHOLD: Proprietary formulation details, blend ratios, manufacturing processes. SAFE SHARE: individual ingredient amounts as listed on the public label."
      },
      {
        q:"A customer says the energy is amazing but the taste is not for them. Include Trustpilot link?",
        options:[
          "Yes they mentioned a positive",
          "No, any negative comment at all means no Trustpilot link",
          "Only if they rate you 4 stars or above",
          "Ask if they would like to leave a review"
        ],
        correct:1,
        exp:"STRICT RULE: Any negative comment however minor means NO Trustpilot link. 100% positive with absolutely zero negatives only. Link: https://www.trustpilot.com/evaluate/im8health.com"
      },
      {
        q:"A customer asks for a free sample before committing. You:",
        options:[
          "Send a 3-day supply",
          "Offer a discount instead",
          "Decline clearly, free samples are not available",
          "Ask your team leader"
        ],
        correct:2,
        exp:"RULE: Never offer free samples or complimentary products. Decline clearly. You can offer to share more product information to help them decide."
      },
      {
        q:"Is the NSF Sport certification confirmed for the Longevity Powder?",
        options:[
          "Yes confirmed",
          "No, PENDING. Never confirm until officially received. This is a compliance issue.",
          "Yes confirmed Q4 2025",
          "It was never going to be certified"
        ],
        correct:1,
        exp:"NSF certification for Longevity Powder is PENDING. Confirming a certification not yet received creates a compliance and legal risk."
      },
      {
        q:"A customer question might involve their specific medical condition and you are not sure what to say. You:",
        options:[
          "Answer your best guess",
          "Refer to the FAQ and answer based on that",
          "Direct to healthcare professional. When in doubt always refer. Better safe than legally liable.",
          "Escalate to team leader before responding"
        ],
        correct:2,
        exp:"When in doubt about any medical or health question refer to healthcare professional. This protects the customer, IM8, and you legally."
      },
    ]
  },
  {
    id:"m9", title:"Escalation and Severity Triage", day:4,
    tag:"Day 4 - Critical", critical:true,
    questions:[
      {
        q:"A customer reports a serious adverse health reaction after taking IM8. This is:",
        options:[
          "P3, standard complaint",
          "P2, monitor the situation",
          "P1, escalate immediately to Head of CX within 1-2 hours",
          "Only P1 if they threaten legal action"
        ],
        correct:2,
        exp:"P1 CRITICAL: Any adverse health reaction means immediate escalation to Head of CX. 1-2 hour response. Health and legal risk. Do not delay."
      },
      {
        q:"Moderate social media backlash with some traction but not viral. This is:",
        options:[
          "P1, immediate crisis",
          "P2, 2-4 hour initiation, investigate, PR alignment needed",
          "P3, standard complaint handling",
          "Ignore until it goes viral"
        ],
        correct:1,
        exp:"P2: Social media backlash with moderate traction. 2-4 hour response initiation, 24-48 hour full resolution. Needs fact-based response and PR alignment."
      },
      {
        q:"Standard delivery delay complaint from a regular customer. This is:",
        options:["P1","P2","P3, SOP-driven, 0-2 hour response","Not a priority"],
        correct:2,
        exp:"P3: Contained, low-risk. Handle via standard SOP. 0-2 hour response. Do not over-escalate standard complaints."
      },
      {
        q:"A customer is threatening legal action. You:",
        options:[
          "Calmly explain your policy",
          "P1, escalate immediately. Do not respond substantively without guidance from Head of CX and legal team.",
          "Ask them to clarify their complaint",
          "Try to resolve it yourself first"
        ],
        correct:1,
        exp:"P1 CRITICAL: Legal threats mean immediate cross-functional escalation. Use the escalation script: I have shared this with our specialist team and I will personally monitor and keep you updated."
      },
      {
        q:"A regulatory inquiry arrives for example from FDA or Health Canada:",
        options:[
          "P3, respond using standard templates",
          "P2, medium risk, respond carefully",
          "P1, escalate immediately. Never respond independently.",
          "Ask your team leader if it seems serious"
        ],
        correct:2,
        exp:"P1 CRITICAL: Any regulatory inquiry requires immediate escalation. Never respond independently. This carries legal and compliance risk."
      },
      {
        q:"The approved escalation script to use with customers is:",
        options:[
          "I need to transfer you to another team.",
          "I have shared this with our specialist team so we can get you the best possible answer. I will personally monitor this and keep you updated on our progress.",
          "This issue is above my pay grade.",
          "Please wait while I investigate."
        ],
        correct:1,
        exp:"Use the approved escalation script. It is confident, personal, and reassures the customer without making promises you cannot keep."
      },
    ]
  },
  {
    id:"m10", title:"Final Assessment", day:5,
    tag:"Day 5 - Graduation", critical:false,
    questions:[
      {
        q:"A pregnant customer asks if IM8 is safe. Best response?",
        options:[
          "Say IM8 is allergen-free so it should be fine",
          "Refer her to her OB-GYN. Every pregnancy is unique and we cannot give medical advice.",
          "Share the ingredients list and let her decide",
          "Tell her to stop taking it immediately"
        ],
        correct:1,
        exp:"Pregnancy is a medical question. Always refer to healthcare professional. Say: Congrats on your pregnancy! While our products are free from common allergens please share our ingredients list with your OB-GYN and follow their guidance."
      },
      {
        q:"A new subscriber is upset their first order took 19 days to arrive in Ireland. You:",
        options:[
          "Apologise and offer a refund",
          "Acknowledge their frustration. Ireland average is around 19 days so this is within normal range. Explain and reassure.",
          "Tell them international shipping is unpredictable",
          "Escalate to the warehouse team"
        ],
        correct:1,
        exp:"Ireland average is around 19 calendar days, within normal range. Acknowledge frustration, explain the timeline accurately, and reassure them."
      },
      {
        q:"A customer says IM8 has changed their life and they tell everyone about it. You:",
        options:[
          "Thank them and close the ticket",
          "Thank them warmly and include the Trustpilot link. This is a 100% positive response.",
          "Thank them and offer a discount code",
          "Close with a standard template"
        ],
        correct:1,
        exp:"100% positive with zero negatives means Trustpilot eligible. Thank them genuinely and invite them to share at https://www.trustpilot.com/evaluate/im8health.com"
      },
      {
        q:"A customer asks about IM8 vs AG1. Best approach?",
        options:[
          "Say AG1 is inferior without details",
          "Focus on IM8 unique value: 92 ingredients, NSF Certified for Sport, CRT8 technology, clinical dosages, 12 hallmarks coverage",
          "Say they are basically the same",
          "Refuse to discuss competitors"
        ],
        correct:1,
        exp:"Never trash competitors. Focus on IM8 differentiators: 92 ingredients, NSF Certified, clinical trial results, CRT8 technology, science-backed formulation. Let the facts speak."
      },
      {
        q:"Which QC score means meets expectations with very minor issues?",
        options:["5 Excellent","4 Good","3 Fair","2 Poor"],
        correct:1,
        exp:"QC scoring: 5 Excellent exceeds with no errors, 4 Good meets expectations with very minor issues, 3 Fair acceptable with improvements needed, 2 Poor frequent mistakes, 1 Unsatisfactory."
      },
      {
        q:"A customer reports that IM8 made them feel dizzy and nauseous. You:",
        options:[
          "Suggest they take it with food",
          "Apologise and offer a refund",
          "P1, escalate immediately to Head of CX. Adverse health reaction. Do not delay.",
          "Ask them how much they took"
        ],
        correct:2,
        exp:"Any adverse health reaction means P1 immediate escalation. Do not troubleshoot, do not delay, do not offer solutions. This is a safety and legal issue."
      },
    ]
  },
];

// ─── Scenario Data ─────────────────────────────────────────────────────────────
const SCENARIOS = [
  { id:"s1",  label:"Too Expensive",          difficulty:"Medium", customerMsg:"I looked at the price and $89 a month is way too much. I can buy separate supplements cheaper." },
  { id:"s2",  label:"Switching from AG1",     difficulty:"Hard",   customerMsg:"I have been using AG1 for years and I am happy with it. Why would I switch to IM8?" },
  { id:"s3",  label:"Just a Celebrity Brand", difficulty:"Hard",   customerMsg:"This is just David Beckham slapping his name on a product to make money. There is no real science here." },
  { id:"s4",  label:"Taste Issue",            difficulty:"Easy",   customerMsg:"Hi, why does IM8 taste so bad? I really do not enjoy drinking it." },
  { id:"s5",  label:"Health Condition",       difficulty:"Medium", customerMsg:"Hi, I have Type 2 diabetes. Is IM8 safe for me to take with my medication?" },
  { id:"s6",  label:"Drug Testing Concern",   difficulty:"Easy",   customerMsg:"I am a professional athlete and I cannot risk taking anything that might show up on a drug test." },
  { id:"s7",  label:"Pregnant Customer",      difficulty:"Medium", customerMsg:"Hi, I am 8 weeks pregnant. Is IM8 safe to take during pregnancy?" },
  { id:"s8",  label:"Subscription Cancel",    difficulty:"Easy",   customerMsg:"Hi, it seems really difficult to stop my subscription. How do I cancel?" },
  { id:"s10", label:"Free Sample Request",    difficulty:"Medium", customerMsg:"I would love to try IM8 before I commit to a full order. Can you send me a free sample?" },
  { id:"s11", label:"Not Seeing Results",     difficulty:"Hard",   customerMsg:"I have been taking IM8 for 3 weeks and I do not see any difference. I want a refund." },
  { id:"s12", label:"Lost Package",           difficulty:"Medium", customerMsg:"My tracking says delivered but there is nothing here. Where is my order?" },
];

// ─── Compare Data ─────────────────────────────────────────────────────────────
const COMPARE_ROWS = [
  { label:"Format",          essPro:"Stick packs (30/pack)", longevity:"Stick packs (30/pack)", origEss:"Powder",       longevityCap:"Capsule" },
  { label:"Serving",         essPro:"13.6g",                longevity:"7.8g",                  origEss:"11.8g",        longevityCap:"1 cap" },
  { label:"Calories",        essPro:"40",                   longevity:"15",                    origEss:"20",           longevityCap:"none" },
  { label:"Ingredients",     essPro:"92",                   longevity:"5 complexes",           origEss:"92",           longevityCap:"limited" },
  { label:"CoQ10",           essPro:"100mg",                longevity:"none",                  origEss:"100mg",        longevityCap:"none" },
  { label:"MSM",             essPro:"1500mg increased",     longevity:"none",                  origEss:"1000mg",       longevityCap:"none" },
  { label:"Saffron",         essPro:"30mg exclusive",       longevity:"none",                  origEss:"none",         longevityCap:"none" },
  { label:"CRT8",            essPro:"100mg increased",      longevity:"none",                  origEss:"25mg",         longevityCap:"25mg" },
  { label:"NMN",             essPro:"none",                 longevity:"300mg",                 origEss:"none",         longevityCap:"none" },
  { label:"Senolytics",      essPro:"none",                 longevity:"600mg triple",          origEss:"none",         longevityCap:"none" },
  { label:"Glycine+Taurine", essPro:"none",                 longevity:"5g",                    origEss:"none",         longevityCap:"none" },
  { label:"NAD Approach",    essPro:"none",                 longevity:"Direct NMN",            origEss:"none",         longevityCap:"NAD3 blend" },
  { label:"DHA",             essPro:"none",                 longevity:"removed",               origEss:"none",         longevityCap:"200mg algal" },
  { label:"Probiotics",      essPro:"10B CFU",              longevity:"none",                  origEss:"10B CFU",      longevityCap:"none" },
  { label:"Hallmarks",       essPro:"Some",                 longevity:"All 12",                origEss:"Some",         longevityCap:"Some" },
  { label:"NSF Sport",       essPro:"confirmed",            longevity:"pending",               origEss:"confirmed",    longevityCap:"none" },
  { label:"Price (OTP)",     essPro:"$112",                 longevity:"$149",                  origEss:"disc.",        longevityCap:"disc." },
  { label:"Price (monthly)", essPro:"$89/mo",               longevity:"$89 legacy / $119 new", origEss:"disc.",        longevityCap:"disc." },
  { label:"Price (quarter)", essPro:"$235/qtr",             longevity:"$312/qtr",              origEss:"disc.",        longevityCap:"disc." },
  { label:"Flavors",         essPro:"Acai+Berry / Mango+Passionfruit / Lemon+Orange / Variety Pack", longevity:"Single flavor (no variants)", origEss:"Acai Berry",   longevityCap:"Neutral" },
];

// ─── Bootcamp Data ────────────────────────────────────────────────────────────
const BOOTCAMP_DAYS = [
  // ─── DAY 1 ───────────────────────────────────────────────────────────────────
  {
    day:1, title:"Identity & Standards",
    subtitle:"Understand who IM8 is, how we speak, and how you will be measured every day", duration:"3-4 hrs",
    lessons:[
      {
        id:"d1l0", title:"The IM8 DNA & Values",
        content:[
          {t:"video", label:"🎬 TO RECORD: Welcome to the IM8 CX Team (2-3 min)", dur:"TBD", url:""},
          {t:"video", label:"Intro Part 1 — Team & Tone of Voice", dur:"", url:"/videos/Intro - Part 1 (Team & Tone of Voice).mp4"},
          {t:"h",v:"Welcome to the IM8 Customer Experience Team"},
          {t:"p",v:"We are the voice of the brand and the champions of our customers. Every interaction you handle shapes how people experience IM8. Your work is guided by the IM8 DNA and the Prenetics culture — these are not aspirational statements. They are behavioral standards that define how you show up, solve problems, and treat customers and teammates."},
          {t:"h",v:"The 9 IM8 Values — What They Mean on the Floor"},
          {t:"kv",pairs:[
            ["Passion","You bring energy and care to every interaction. You genuinely want to help and take pride in finding the right solution."],
            ["Resilience","You stay calm under pressure. You handle frustrated customers, high volumes, and complex issues without losing focus or empathy."],
            ["Empowerment","You take ownership. You do not wait to be told — when you see a problem, you help solve it and support your teammates."],
            ["Integrity","You do the right thing, even when no one is watching. You follow through on commitments and act in the best interest of the customer and IM8."],
            ["Epic","You go beyond the minimum. You look for opportunities to turn a standard interaction into a memorable, positive experience."],
            ["Transparency","You communicate honestly and clearly. You set realistic expectations and raise issues early with your team."],
            ["Ingenuity","You think critically and adapt quickly. When the answer is not obvious, you find a smart, practical way forward."],
            ["Communication","You communicate with clarity, empathy, and professionalism. You listen first and respond in a way customers can understand and trust."],
            ["Selfless","You put the team and the mission first. You take on tough cases, share knowledge, and support others to ensure team success."],
          ]},
          {t:"h",v:"The IM8 Mindset"},
          {t:"kv",pairs:[
            ["Intensity","We stay focused and fully engaged. We move with urgency and give our best effort on every interaction."],
            ["Humility","We lead with respect and self-awareness. We listen, stay open to feedback, and put learning ahead of ego."],
            ["Ambition","We take on tough challenges and look for better ways to solve them. We are motivated to improve outcomes for both customers and the business."],
            ["Grit","We do not back down when things get difficult. We remain steady under pressure and follow issues through to resolution."],
            ["Team-first","We act in service of the team and the broader IM8 mission. We support one another and make decisions that benefit the collective."],
          ]},
          {t:"h",v:"The IM8 Customer"},
          {t:"p",v:"The IM8 customer is health-conscious, informed, and proactive about their well-being. They are investing in long-term health and expect clear answers, fast resolution, and a customer experience that reflects the premium nature of the brand. Every interaction must live up to that standard."},
          {t:"h",v:"Your 3 Guiding Principles"},
          {t:"kv",pairs:[
            ["1. Empathetic Ownership","Own the customer's problem until it is resolved. Understand their emotional state throughout. Measured by: CSAT, NPS, Trustpilot Reviews."],
            ["2. Effortless Resolution","Solve quickly and completely with as little back-and-forth as possible. Measured by: volume and resolution composite."],
            ["3. Root Cause Mindset","Cancellation is often a sign of dissatisfaction, not the real goal. Identify the underlying issue and solve that first. Measured by: Retention Rate and saved cancellation tags."],
          ]},
          {t:"warn",v:"These values are behavioral standards — not a wall poster. You will be evaluated on them in QC scoring every week. Start applying them from your very first ticket."},
          {t:"tip",v:"Integrity means doing the right thing even when no one is watching. When you are unsure what to do — whether to escalate, offer a refund, or push back — ask yourself: what would a person of integrity do here? That question cuts through every ambiguous situation."},
          {t:"scenario",customer:"I have been a customer for 6 months and I am really unhappy with how my last complaint was handled. Nobody followed up and I feel completely ignored.",hint:"Which values apply here? How do you embody Empathy, Integrity, and Epic in a single response? You cannot undo what happened — what do you do now?",response:"I completely understand your frustration, and I am so sorry that fell through the cracks — you deserved a follow-up and you did not get one. That is on us. I am picking this up personally right now and I am not closing this ticket until your situation is fully resolved. Can you tell me what happened so I can make it right? With health, [Name] - IM8 Customer Experience"},
          {t:"summary",items:["9 IM8 Values: Passion, Resilience, Empowerment, Integrity, Epic, Transparency, Ingenuity, Communication, Selfless — behavioral standards, not aspirations","IM8 Mindset: Intensity, Humility, Ambition, Grit, Team-first — how high performers show up every day","The IM8 customer is health-conscious and premium — they expect a CX experience that matches the brand","3 Guiding Principles: Empathetic Ownership (CSAT/NPS), Effortless Resolution, Root Cause Mindset","You are evaluated on these values every week through QC scoring — apply them from ticket one"]},
        ],
        check:[
          {q:"Which IM8 value means taking ownership without being asked — when you see a problem, you help solve it?",options:["Integrity","Empowerment","Selfless","Resilience"],correct:1,exp:"Empowerment: you take ownership of your work. You do not wait to be told — when you see a problem, you help solve it and support your teammates."},
          {q:"What is Guiding Principle 3 (Root Cause Mindset)?",options:["Process all cancellations immediately","Cancellation is often a symptom of dissatisfaction — identify the real issue first","Always offer a discount before cancelling","Escalate every cancellation to the CS Lead"],correct:1,exp:"Root Cause Mindset: cancellation is often a sign of dissatisfaction, not the real goal. Identify the underlying issue and solve that first. Measured by Retention Rate and saved cancellation tags."},
          {q:"The IM8 values are best described as:",options:["Aspirational goals for the company","Behavioral standards that define how you show up and are evaluated","Optional guidelines for senior agents","Marketing language for customers"],correct:1,exp:"The values are behavioral standards — not aspirational statements. They define how you show up, solve problems, and treat customers. You are evaluated on them weekly through QC scoring."},
        ]
      },
      {
        id:"d1l1", title:"The IM8 Voice",
        content:[
          {t:"h",v:"How IM8 Sounds"},
          {t:"p",v:"IM8's tone of voice is human, confident, and supportive — never scripted or transactional. Every message should feel personal, show genuine care, and focus on achieving the best outcome for the customer. Customers should leave each interaction feeling heard, respected, and supported."},
          {t:"compare",pairs:[
            ["Robotic & Scripted","Warm & Friendly"],
            ["Corporate & Vague","Clear & Direct"],
            ["Defensive & Unsure","Confident & In Control"],
            ["Over-Apologetic & Dismissive","Empathetic & Understanding"],
          ]},
          {t:"h",v:"The IM8 Voice in Action — Before & After"},
          {t:"compare",pairs:[
            ["Thank you for contacting us. Your ticket has been received.","Thanks so much for reaching out! I have received your message and I am looking into this for you right now."],
            ["Per our policy, we cannot issue a refund.","While our policy does not allow for a refund in this case, I can offer you a full store credit or an exchange for a product that might be a better fit."],
            ["I understand you are frustrated.","I can absolutely see how frustrating this situation is, and I want to get this sorted for you immediately."],
            ["You have to log in to your account to change your address.","You can update your address right from your account! Just head to this link and follow these two simple steps. Let me know if you run into any trouble."],
          ]},
          {t:"rule",v:"Always close every customer response with: With health, [Your first name] - IM8 Customer Experience"},
          {t:"h",v:"The 6 Ticket Categories"},
          {t:"kv",pairs:[
            ["Safety","Adverse reactions, GI issues, medical conditions, athletes, pregnancy"],
            ["Product","Timing/dosage, quality, taste, ingredients, certifications, stacking"],
            ["Results","Not feeling effects, bloodwork concerns, under/over 90 days"],
            ["Value","Price concerns, competitor comparisons"],
            ["Shipping","Delays, wrong address, missing, damaged, inquiries"],
            ["Subscription","Excess product, pause/change/cancel, inquiries"],
          ]},
          {t:"h",v:"Rules You Cannot Break"},
          {t:"warn",v:"NEVER offer free samples. If asked: 'We do not offer free samples currently, but I am happy to share more about the product to help you decide.'"},
          {t:"warn",v:"NEVER apologize for a delayed reply. It draws attention to something negative. Instead say: 'Thanks for your patience — here is your answer.'"},
          {t:"warn",v:"NEVER proactively mention refunds. Only discuss if the customer raises it or the situation clearly qualifies."},
          {t:"h",v:"The Trustpilot Rule"},
          {t:"rule",v:"Include the Trustpilot link ONLY when the message is 100% positive with ZERO negatives. Any comment about taste, packaging, price, shipping, or any negative — even minor — disqualifies the link."},
          {t:"h",v:"Medical Advice — Zero Exceptions"},
          {t:"warn",v:"NEVER give medical advice, diagnose, or suggest treatments. For ANY medical or medication question, refer to their personal physician. Share the ingredient list so their doctor can review it."},
          {t:"tip",v:"Keep the before/after examples from this lesson next to you during your first week. You will catch yourself reaching for corporate language — these examples are your fastest reset. The IM8 voice is a habit, not a natural instinct for most people. Build it deliberately."},
          {t:"spot",label:"Spot the Problem — Tone",ticket:"Thank you for contacting IM8. We apologize for any inconvenience caused. A member of our team will review your case and respond to you as soon as possible. Kind regards, The IM8 Customer Service Team",problems:["'Thank you for contacting IM8' — robotic opener that adds nothing. The customer knows we know they contacted us.","'Apologize for any inconvenience' — apologizing before knowing the issue. Also draws attention to a negative.","'A member of our team will review your case' — passive, impersonal. No name, no ownership, no urgency.","'As soon as possible' — meaningless. Give a real commitment or say nothing.","Sign-off is completely wrong — must be: 'With health, [First name] - IM8 Customer Experience'"],fixed:"I have your message and I am on this right now. [Resolution in this same message.] With health, [Name] - IM8 Customer Experience"},
          {t:"spot",label:"Spot the Problem — Medical Advice",ticket:"Hi! Great question — IM8 is generally very safe and well-tolerated. Most people on blood pressure medication are absolutely fine taking it. Just drink plenty of water and take it with food. Hope that helps! With health, [Name] - IM8 Customer Experience",problems:["'Generally very safe' — you are clearing a medication interaction. That is medical advice.","'Most people on blood pressure medication are absolutely fine' — this is medical advice. It is also legally dangerous.","Did not provide the ingredient list — that is the required step.","Did not refer to their prescribing physician — that is the required step.","This response creates real liability for IM8 if something goes wrong."],fixed:"Great question to ask before starting — please share the full ingredient list with your doctor or prescribing physician so they can advise based on your specific medication. Here is the full list: [ingredient list link]. They are best placed to give you a clear answer. With health, [Name] - IM8 Customer Experience"},
          {t:"scenario",customer:"I am absolutely furious. I have been waiting 10 days for my order and nobody has responded to my two previous emails. This is completely unacceptable.",hint:"De-escalation first. Acknowledge the emotion and take ownership. Do NOT apologize for the delayed reply — that draws attention to something negative. Write the IM8 voice response.",response:"I hear you completely, and you are right to be frustrated — 10 days is too long and you deserved a response sooner. I am taking care of this right now. Can you share your order number so I can check exactly where your shipment is and make this right for you today? With health, [Name] - IM8 Customer Experience"},
          {t:"summary",items:["IM8 voice: human, confident, supportive — never scripted, corporate, or transactional","We are: Warm & Friendly, Clear & Direct, Confident & In Control, Empathetic & Understanding","We are NOT: Robotic, Corporate, Defensive, Over-Apologetic","Sign-off: With health, [First name] - IM8 Customer Experience — every single time","3 non-negotiables: never offer free samples, never apologize for a delayed reply, never proactively mention refunds","Trustpilot link: 100% positive, zero negatives — any complaint at all disqualifies it"]},
        ],
        check:[
          {q:"A customer says 'IM8 has genuinely changed my life and I recommend it to everyone!' Do you include the Trustpilot link?",options:["No — never include links","Yes — 100% positive with zero negatives","Only if they ask","Only for subscribers"],correct:1,exp:"100% positive + zero negatives = Trustpilot eligible. Include the link to invite them to leave a review."},
          {q:"A customer asks 'Can I take IM8 with my blood pressure medication?' You:",options:["Tell them IM8 is generally safe","Say the ingredients should be fine","Provide the ingredient list and advise them to check with their prescribing physician","Escalate to TL"],correct:2,exp:"For ANY medical or medication question: share the ingredient list and refer to their personal physician. Never clear or deny use based on a medical condition."},
          {q:"The correct IM8 sign-off is:",options:["Best regards, IM8 Support","Kind regards, Customer Service","With health, [Your first name] - IM8 Customer Experience","Thanks, [Name] - IM8"],correct:2,exp:"Always close with: With health, [Your first name] - IM8 Customer Experience — on every single response."},
        ]
      },
      {
        id:"d1l2", title:"The QC Scorecard — Know Your Standard",
        content:[
          {t:"h",v:"Why This Matters on Day 1"},
          {t:"p",v:"Everything you learn this week — voice, policies, tools, de-escalation — will be evaluated against one standard: the QC Scorecard. You need to know this framework before your first ticket, not after your first QC review. Understanding how you are measured from day one changes how you approach every interaction."},
          {t:"h",v:"The 5 QC Categories"},
          {t:"kv",pairs:[
            ["1. Accuracy","Correct application of policies. Factually correct product and shipping information. No made-up or guessed details."],
            ["2. Tone & Empathy","Brand-appropriate IM8 voice. Genuine empathy and understanding. Warm, direct, human — never scripted or corporate."],
            ["3. Clarity","Clear, easy-to-understand language. No typos, jargon, or confusing structure. Customer can act on what you wrote."],
            ["4. Efficiency","Resolved within SLAs with no unnecessary back-and-forth. One clear answer that anticipates the customer's next question."],
            ["5. Records & Notes","Internal notes are complete and accurate. Correct tags applied before closing. Tells the story anyone needs to pick up where you left off."],
          ]},
          {t:"h",v:"The Scoring Scale"},
          {t:"kv",pairs:[
            ["5 — Excellent","Exceeds expectations. No errors. Could be used as a training example."],
            ["4 — Good","Meets expectations. Very minor issues that do not affect the outcome."],
            ["3 — Fair","Acceptable, but multiple small improvements needed. Would not embarrass IM8, but not our standard."],
            ["2 — Poor","Frequent mistakes. Requires coaching. Would leave a customer frustrated or confused."],
            ["1 — Unsatisfactory","Major errors. Unacceptable response. Compliance or brand risk."],
          ]},
          {t:"rule",v:"Your target is 20+ out of 25. That means scoring mostly 4s across all five categories. This is the standard for Weeks 2-4. Strive to exceed it — not just meet it."},
          {t:"scorecard",context:"Active US subscriber. Order is 7 business days in transit with no update.",ticket:"Hi, I'm sorry for the delay! There can sometimes be delays with carriers. I'll look into this and get back to you. Thanks, IM8 Support",scores:[{cat:"Accuracy",score:2,why:"No tracking check performed. Policy requires a compensation offer at 4-6 BD for active subscribers — a complimentary 6-pack should have been offered. Policy not applied."},{cat:"Tone & Empathy",score:2,why:"'I'm sorry for the delay' draws attention to the negative. No genuine acknowledgment of frustration. Vague and impersonal."},{cat:"Clarity",score:2,why:"'I'll look into this' means nothing. No action stated, no timeline given, customer has no idea what happens next."},{cat:"Efficiency",score:1,why:"Zero resolution. Forces the customer to contact again. Re-contact is the worst outcome and inflates ticket volume."},{cat:"Records & Notes",score:1,why:"No mention of tagging the ticket as Shipping Delay. No documentation of what action was taken. Anyone picking this up is flying blind."}],total:8,fixed:"I can see your order is still in transit after 7 days and that is longer than it should be — I am checking Aftership right now. I am also adding a complimentary 6-pack of Essentials to your next order right away, because you should not have to wait this long without something to make it right. I will follow up with a full tracking update within the next 24 hours and I am not closing this ticket until this is resolved. With health, [Name] - IM8 Customer Experience"},
          {t:"tip",v:"Before sending any response, run it through the 5 categories in your head in 10 seconds: Is this accurate? Is this warm and on-brand? Is this clear? Did I resolve everything in one message? Did I tag and document this correctly? That 10-second habit separates 4s from 2s."},
          {t:"scenario",customer:"Hi, I just wanted to say that I have been taking IM8 for 3 months and my energy levels are incredible. Best supplement I have ever taken by far.",hint:"This is 100% positive with zero negatives. Score your ideal response across the 5 QC categories. What do you include and why?",response:"That is absolutely incredible to hear — three months is when the real magic happens and it sounds like you are right in the middle of it! Thank you so much for taking the time to share this with us. Messages like yours are what drives our whole team. If you have a moment and would like to share your experience, we would love to read it on Trustpilot. With health, [Name] - IM8 Customer Experience [QC self-score: Accuracy 5, Tone 5, Clarity 5, Efficiency 5 — one message, complete, Trustpilot eligible]"},
          {t:"summary",items:["5 QC categories: Accuracy, Tone & Empathy, Clarity, Efficiency, Records & Notes — each scored 1-5","Target: 20+/25 — mostly 4s across all categories by Weeks 2-4","5=Excellent (training example quality), 4=Good, 3=Fair (improvements needed), 2=Poor (coaching required), 1=Unsatisfactory","10-second pre-send check: accurate? warm? clear? resolved in one go? tagged and noted?","You receive QC feedback weekly — review it, ask questions, and focus on the categories where you lose points"]},
        ],
        check:[
          {q:"What is the target QC score for Weeks 2-4?",options:["15 out of 25","18 out of 25","20 out of 25","25 out of 25"],correct:2,exp:"Your target is 20+ out of 25. This means scoring mostly 4s (Good) across all five categories. Treat it as a floor, not a ceiling."},
          {q:"Which QC category covers whether internal notes and ticket tags are complete?",options:["Accuracy","Tone & Empathy","Efficiency","Records & Notes"],correct:3,exp:"Records & Notes is the category that covers internal note quality, tagging completeness, and documentation before closing."},
          {q:"A QC score of 3 means:",options:["Excellent — could be a training example","Good — minor issues only","Fair — acceptable but multiple improvements needed","Poor — requires coaching"],correct:2,exp:"3=Fair: acceptable, but multiple small improvements needed. Would not embarrass IM8, but it is not our standard. Aim for 4s consistently."},
        ]
      },
    ],
    quiz:[
      {q:"Which IM8 value means taking ownership and solving problems without being told?",options:["Integrity","Empowerment","Selfless","Resilience"],correct:1,exp:"Empowerment: you take ownership. You do not wait to be told — when you see a problem, you help solve it and support your teammates."},
      {q:"What does Guiding Principle 3 (Root Cause Mindset) mean?",options:["Process all cancellations immediately","Cancellation is often a symptom of dissatisfaction — identify the real issue first","Always offer a discount before cancelling","Escalate every cancellation"],correct:1,exp:"Root Cause Mindset: cancellation is often a sign of dissatisfaction, not the real goal. Identify the underlying issue and solve that first."},
      {q:"IM8's tone of voice is best described as:",options:["Formal and professional","Human, confident, and supportive — never scripted or transactional","Empathetic but corporate","Friendly but cautious"],correct:1,exp:"IM8 voice is human, confident, and supportive. Never scripted or transactional. Warm and direct, not corporate or vague."},
      {q:"A customer says 'Great product but the shipping was really slow.' Do you include the Trustpilot link?",options:["Yes — mostly positive","Yes — shipping feedback is minor","No — any negative means no link","Only if they rate 5 stars"],correct:2,exp:"STRICT RULE: Any negative at all — even 'shipping was slow' — means no Trustpilot link. 100% positive with zero negatives only."},
      {q:"What is the correct IM8 sign-off?",options:["Best regards, IM8 Support","Kind regards, Customer Service","With health, [Your first name] - IM8 Customer Experience","Thanks, [Name] - IM8"],correct:2,exp:"Always: With health, [Your first name] - IM8 Customer Experience. Every single response."},
      {q:"What is the QC score target for Weeks 2-4?",options:["15/25","18/25","20/25","25/25"],correct:2,exp:"Target: 20+ out of 25. Mostly 4s across all five categories. Treat this as the floor, not the ceiling."},
      {q:"Which QC category covers whether the policy was correctly applied?",options:["Tone & Empathy","Clarity","Accuracy","Efficiency"],correct:2,exp:"Accuracy covers correct application of policies and factually correct product and shipping information."},
      {q:"The QC category measuring whether the issue was resolved without unnecessary back-and-forth is:",options:["Clarity","Efficiency","Records & Notes","Tone & Empathy"],correct:1,exp:"Efficiency: resolved within SLAs with no unnecessary back-and-forth. One clear answer that anticipates the next question."},
    ],
  },
  // ─── DAY 2 ───────────────────────────────────────────────────────────────────
  {
    day:2, title:"Products & Tools",
    subtitle:"Know every product and every system you will use on every shift", duration:"3-4 hrs",
    lessons:[
      {
        id:"d2l0", title:"Product Knowledge",
        content:[
          {t:"video", label:"Intro Part 2 — Product Knowledge", dur:"", url:"/videos/Intro - Part 2 (Product).mp4"},
          {t:"video", label:"Section 2 — Detailed Product Deep Dive", dur:"", url:"/videos/Section 2.mp4"},
          {t:"h",v:"The Three Product Lines"},
          {t:"kv",pairs:[
            ["Daily Ultimate Essentials PRO","The core daily supplement — stick packs, 30 per pack"],
            ["Daily Ultimate Longevity","Longevity-focused formula — stick packs, 30 per pack"],
            ["The Beckham Stack","Bundled offering: Essentials PRO + Longevity Set together"],
          ]},
          {t:"h",v:"Daily Ultimate Essentials PRO"},
          {t:"kv",pairs:[
            ["Format","Stick packs (sachet packs), 30 per pack — no pouches or capsules"],
            ["Serving","92 premium ingredients, 13.6g per serving, 20 calories"],
            ["Key highlights","MSM 1500mg, Saffron 30mg (PRO exclusive), CRT8 100mg, CoQ10 100mg, 10B CFU probiotics"],
            ["Sweetener","Reb M (natural, zero glycemic impact)"],
            ["Certification","NSF Certified for Sport"],
            ["One-time purchase","$112"],
            ["Monthly subscription (30-day)","$89/month"],
            ["Quarterly subscription (90-day)","$235/quarter"],
          ]},
          {t:"h",v:"Essentials PRO Flavors"},
          {t:"kv",pairs:[
            ["Acai + Berry","Original flavor"],
            ["Mango + Passionfruit","New flavor"],
            ["Lemon + Orange","New flavor"],
            ["Variety Pack","Mix of all three flavors — perfect for trying before committing to one"],
          ]},
          {t:"rule",v:"Flavor options are ONLY available for Daily Ultimate Essentials PRO. The Longevity component has no flavor variants — it is a single offering."},
          {t:"rule",v:"Saffron Flower Extract 30mg is PRO exclusive — clinically studied for mood, stress reduction, and cognitive performance. It does NOT exist in the original Essentials formula."},
          {t:"h",v:"Daily Ultimate Longevity"},
          {t:"kv",pairs:[
            ["Format","Stick packs (sachet packs), 30 per pack — single flavor, no variants"],
            ["Key ingredients","NMN 300mg, Glycine 3g, Taurine 2g, Resveratrol 250mg, Quercetin 250mg, Fisetin 100mg, Dihydroberberine 100mg, Spermidine 3mg, PQQ 10mg"],
            ["Science","First supplement targeting all 12 hallmarks of aging (Cell journal 2023)"],
            ["One-time purchase","$149"],
            ["Monthly subscription (30-day)","$119/month (new) OR $89/month (grandfathered — permanent)"],
            ["Quarterly subscription (90-day)","$312/quarter (new subscribers)"],
          ]},
          {t:"warn",v:"CRITICAL: NSF Certified for Sport status for the Longevity Powder is PENDING. Never confirm it. Confirming a certification not yet received is a legal and compliance risk."},
          {t:"rule",v:"Existing subscribers are permanently grandfathered at $89/month as a loyalty benefit. New subscribers pay $119/month. Never tell a grandfathered customer they must pay more."},
          {t:"h",v:"The Beckham Stack"},
          {t:"p",v:"The Beckham Stack is a bundled offering combining Essentials PRO and the Longevity Set. Both can be mixed in the same glass. This is the most complete daily routine IM8 offers."},
          {t:"kv",pairs:[
            ["One-time purchase","$261"],
            ["Monthly subscription (30-day)","$208/month"],
            ["Quarterly subscription (90-day)","$548/quarter"],
          ]},
          {t:"h",v:"Discontinued Products"},
          {t:"warn",v:"Original Daily Ultimate Essentials (V1), Longevity Capsules, and pouch/capsule formats are DISCONTINUED. The only current format is stick packs (30 per pack). Never suggest discontinued formats or products."},
          {t:"rule",v:"No DHA or EPA in current products. If a customer asks if IM8 replaces their fish oil: be honest. Recommend a separate omega-3."},
          {t:"tip",v:"When a customer asks what makes Essentials PRO different from the original formula: lead with the upgrades — MSM increased to 1500mg, Saffron added exclusively, CRT8 boosted from 25mg to 100mg. Never apologize for discontinuing the old version — position the change as a significant upgrade."},
          {t:"scenario",customer:"I used to take the original Essentials and loved it. Is the PRO version the same thing, or should I upgrade?",hint:"Product knowledge — this is a positive opportunity. What are the 3 key improvements in PRO vs the original? Be confident and enthusiastic.",response:"Great news — Essentials PRO is a major upgrade from the original formula. We increased MSM from 1000mg to 1500mg for even better joint and tissue support, added Saffron Flower Extract 30mg exclusively (clinically studied for mood and cognitive performance), and boosted CRT8 from 25mg to 100mg. The core formula you already loved is still there — just significantly more powerful. With health, [Name] - IM8 Customer Experience"},
          {t:"scenario",customer:"What flavors does Essentials PRO come in? I'm not sure I like the Acai Berry one.",hint:"Flavor question — you have great news to share. Three flavors plus a Variety Pack.",response:"We actually just launched two brand-new flavors for Essentials PRO — Mango + Passionfruit and Lemon + Orange, alongside our original Acai + Berry. If you'd like to try them all before committing, we also have a Variety Pack that includes all three. The Variety Pack is a great way to find your favourite before going all-in on one flavour. With health, [Name] - IM8 Customer Experience"},
          {t:"summary",items:["Three product lines: Daily Ultimate Essentials PRO, Daily Ultimate Longevity, The Beckham Stack (bundled)","Essentials PRO flavors: Acai+Berry (original), Mango+Passionfruit, Lemon+Orange, Variety Pack — flavor options for Essentials PRO only","Format: stick packs only (30 per pack) — no pouches or capsules available","Subscriptions: 30-day or 90-day, or one-time purchase","Longevity Powder: targets all 12 hallmarks of aging — NSF Sport certification PENDING (never confirm it)","Grandfathered subscribers: $89/month permanently protected — never tell them to pay more","Saffron 30mg is PRO EXCLUSIVE — does not exist in any other IM8 product","Beckham Stack = Essentials PRO + Longevity Set — can be mixed in the same glass"]},
        ],
        check:[
          {q:"How many ingredients does Essentials PRO contain?",options:["72","82","92","102"],correct:2,exp:"Essentials PRO contains 92 premium ingredients in a 13.6g serving (20 calories)."},
          {q:"What is the NSF Certified for Sport status of the Longevity Powder?",options:["Fully certified since launch","Pending — never confirm it","Certified in the US only","Not applicable"],correct:1,exp:"NSF certification for the Longevity Powder is PENDING. Never confirm it. This is a legal and compliance risk."},
          {q:"Which products offer flavor options?",options:["Both Essentials PRO and Longevity","Longevity only","Essentials PRO only — Longevity has no flavor variants","The Beckham Stack only"],correct:2,exp:"Flavor options (Acai+Berry, Mango+Passionfruit, Lemon+Orange, Variety Pack) are available for Daily Ultimate Essentials PRO only. Longevity is a single offering with no flavor variants."},
          {q:"What pack format do current IM8 products come in?",options:["Pouches and capsules","Capsules only","Pouches only","Stick packs / sachet packs (30 per pack)"],correct:3,exp:"The only current format is stick packs (sachet packs), 30 per pack. Pouches and capsules are discontinued."},
        ]
      },
      {
        id:"d2l1", title:"Your Toolkit — Gorgias, Shopify & All Systems",
        content:[
          {t:"video", label:"Intro Part 4 — Main Platforms Used", dur:"", url:"/videos/Intro - Part 4 - Main Platforms Used.mp4"},
          {t:"video", label:"Part 1 — Platform, Tools & Slack Channels", dur:"", url:"/videos/Part 1 - Platform, Tools, and Slack Channels.mp4"},
          {t:"video", label:"Intro Part 3 — Warehouses", dur:"", url:"/videos/Intro - Part 3 (Warehouses).mp4"},
          {t:"video", label:"🎬 TO RECORD: Looking Up an Order (3 min screen recording)", dur:"TBD", url:""},
          {t:"h",v:"Gorgias — Your Ticketing Home"},
          {t:"p",v:"Gorgias is the central hub for all customer conversations — email, live chat, and social media messages. Every ticket arrives in Gorgias. You will spend most of your working day here."},
          {t:"h",v:"The Ticket Workflow"},
          {t:"list",items:["1. Check Slack first — read any updates from TL before opening Gorgias","2. Open Gorgias — work tickets from OLDEST to NEWEST","3. Identify the segment using the Decision Tree Master","4. Apply the correct tag before responding","5. Write your response, personalize any macro used","6. Add an internal note: issue summary, action taken, reason, next steps","7. Close the ticket — never close without tags and notes","8. Inbox must be zero by end of shift"]},
          {t:"rule",v:"Work tickets from OLDEST to NEWEST. Clear your inbox to zero every shift. This is non-negotiable."},
          {t:"h",v:"Shopify — Order Management"},
          {t:"p",v:"Shopify is where all customer orders are recorded. Use it to look up order history, verify delivery addresses, check order status, and process refunds."},
          {t:"kv",pairs:[
            ["Access","Request login from Michelle"],
            ["Use for","Order lookup, address verification, refund processing, order history"],
          ]},
          {t:"h",v:"Skio — Subscription Portal"},
          {t:"p",v:"Skio manages all subscription orders. Customers can pause, skip, cancel, or change their subscription frequency. Use Skio to manage all subscription changes."},
          {t:"kv",pairs:[
            ["Access","Request login from Michelle"],
            ["Use for","Subscription lookup, pause/skip/cancel, frequency changes, next order date"],
          ]},
          {t:"h",v:"Warehouse Systems"},
          {t:"kv",pairs:[
            ["Extensiv (Europa/HK)","ID: im8.cs@prenetics.com — For HK and European warehouse orders"],
            ["OMS GPS UK","ID: IM8-UK — UK orders only"],
            ["OMS GPS US","ID: im8-cs — US, CA, UAE, FR and other regions"],
            ["Stord","Email: im8.cs@prenetics.com — Stord warehouse platform"],
            ["FedEx Support Hub","ID: im8.cs@prenetics.com — For FedEx escalations"],
          ]},
          {t:"warn",v:"These are shared team credentials. Never share them outside the CS team. Keep them secure."},
          {t:"h",v:"Aftership — Tracking"},
          {t:"p",v:"Use Aftership to check tracking status on any order before responding to a delivery question. Never guess a delivery status — always check Aftership first."},
          {t:"h",v:"The 30-Second Order Lookup Flow"},
          {t:"list",items:["1. Open the Gorgias ticket and note the customer email","2. Search for the customer in Shopify — verify order history and address","3. Check Skio if subscription-related — subscription status, next order date, pricing tier","4. Check Aftership for live tracking status if a delivery question","5. Check the relevant warehouse system (GPS US/UK/Extensiv) if the order may be in fulfillment","6. Now you have the full picture — respond once with everything resolved"]},
          {t:"h",v:"Other Tools"},
          {t:"kv",pairs:[
            ["Slack","Internal communication and escalations — check every morning before Gorgias"],
            ["ChatGPT","Drafting and brainstorming support — never send AI-generated text verbatim as a final response"],
            ["Lark/Feishu","Communication with the GPS CS team — request access from William via Michelle"],
          ]},
          {t:"tip",v:"Before processing any subscription change, check BOTH Shopify AND Skio. Sometimes a customer has a paused subscription they forgot about, or there is a charge coming in 2 days that explains their request. Always read the full picture before acting."},
          {t:"scenario",customer:"Hi, I was charged for my subscription today but I have not seen anything shipped yet. Can you check what is going on?",hint:"You need to check multiple systems. What is your exact lookup sequence — Shopify, Skio, warehouse — and what do you say while you investigate?",response:"Hi [Name], I am on this right now. Let me pull up your account in Shopify to confirm the charge and check fulfillment status in our warehouse system. If the order has not been picked and packed within our standard 1-2 business day window, I will flag it immediately with our team. I will come back to you with a clear status update shortly. With health, [Name] - IM8 Customer Experience"},
          {t:"summary",items:["Gorgias = your main hub: email, live chat, Instagram, Facebook — all in one place","30-second lookup sequence: Gorgias ticket → Shopify (order/history) → Skio (subscription) → Aftership (tracking) → Warehouse (fulfillment)","Shopify: order history, address verification, refund processing — access via Michelle","Skio: subscription portal — pause, skip, cancel, frequency changes, next order date","Warehouse systems: Extensiv (HK/EU), GPS UK (UK), GPS US (US/CA/UAE/FR), Stord, FedEx Hub","Aftership: ALWAYS check before responding to any delivery question — never guess a delivery status"]},
        ],
        check:[
          {q:"In what order should you work through tickets?",options:["Newest to oldest","By ticket priority only","Oldest to newest","Random, as assigned by TL"],correct:2,exp:"Always work oldest to newest. Clear your inbox to zero every shift. This is non-negotiable."},
          {q:"Which system do you use to manage a customer subscription pause request?",options:["Shopify","Extensiv","Skio","Aftership"],correct:2,exp:"Skio is the subscription portal. Use it to pause, skip, cancel, or change subscription frequency."},
          {q:"Before responding to any delivery question, you should ALWAYS:",options:["Check Shopify order history","Check Aftership for real tracking status","Contact the warehouse directly","Ask the customer to check their tracking email"],correct:1,exp:"Always check Aftership first before responding to any delivery question. Never guess a delivery status."},
        ]
      },
      {
        id:"d2l2", title:"Daily Workflow & Documentation Standards",
        content:[
          {t:"video", label:"Part 2 — Daily Sheets Used", dur:"", url:"/videos/Part 2 - Daily Sheets Used.mp4"},
          {t:"h",v:"Morning Routine (First 30 Mins)"},
          {t:"list",items:["1. Check Slack for urgent announcements or escalations from your TL","2. Review your open tickets and prioritize them","3. Read daily TL notes before opening any ticket"]},
          {t:"h",v:"Ticket Prioritization Order"},
          {t:"kv",pairs:[
            ["Priority 1","VIPs, influencers, and escalations — handle first, every time"],
            ["Priority 2","Tickets approaching their SLA deadline — time-sensitive"],
            ["Priority 3","First-time customer inquiries — first impressions matter"],
            ["Priority 4","All other tickets, oldest first"],
          ]},
          {t:"h",v:"End-of-Day Checklist (Last 15 Mins)"},
          {t:"list",items:["1. Ensure all urgent tickets have a response","2. Update notes on any complex open cases","3. Share a screenshot of your inbox + snoozed tickets in the asai Slack channel","4. Post 'Finished shift, going out soon' in asai","5. Log out of all systems"]},
          {t:"h",v:"Key Slack Channels"},
          {t:"kv",pairs:[
            ["im8-cs","Draft responses or inquiries needing review by Sam and/or Michelle/Adrian"],
            ["im8-peace-love-escalations","All CS escalations — post with ticket link and brief summary"],
            ["asai","Internal CS agent chat — shift check-ins, questions, updates"],
            ["asai-important-info","Important team updates — check regularly"],
            ["im8-cs-hkops","HK Warehouse inquiries — tag Suki and Carman"],
            ["im8-shopify-integrations","Tech-related queries — tag Ajay, Adrian Chan, and Leon Woo"],
          ]},
          {t:"rule",v:"Every morning, check Slack BEFORE opening Gorgias. Your TL may have posted urgent updates you need to know before handling tickets."},
          {t:"h",v:"Documentation Standards — What Good Notes Look Like"},
          {t:"p",v:"Clear internal notes are essential for team alignment and QC. Your notes should tell a story that anyone can understand in seconds. This is how the team picks up where you left off without reading the entire conversation."},
          {t:"h",v:"Good Notes Include"},
          {t:"list",items:["A brief summary of the customer's issue","The action you took","The reason for your action (e.g. 'Applied 30-Day Guarantee')","Any next steps for the customer or the team"]},
          {t:"rule",v:"Example of good notes: 'Customer order delayed 8 days. Per Shipping Delay Policy, issued a 100% refund. Informed customer and confirmed no cancellation needed. Ticket closed.'"},
          {t:"h",v:"Tagging Standards"},
          {t:"warn",v:"Always apply relevant tags (e.g. refund, shipping_delay, damaged_product) before closing a ticket. An untagged, closed ticket is an incomplete ticket."},
          {t:"h",v:"Shift Routine"},
          {t:"list",items:[
            "Start of shift: post 'In' in the asai channel",
            "Taking a break: post 'Taking a break' + when you will be back (breaks are 5-10 minutes)",
            "Questions during shift: post in im8-cs with the ticket link and exactly what you need help with",
            "End of shift: post 'Finished shift, going out soon' + inbox screenshot in asai",
            "Weeks 1-3: stay on Zep or Meet for your full shift — a senior reviews responses before they send",
          ]},
          {t:"tip",v:"The Slack check-in is not optional admin — it is how your TL spots problems before they become serious. Post your start, breaks, questions, and end-of-shift status. The more visible you are, the more support you get. This is Selfless and Transparency in practice."},
          {t:"scenario",customer:"I sent an email 3 days ago and have not heard back. I am starting to think nobody actually reads these.",hint:"This customer has been waiting 3 days. Do NOT apologize for the delay. What do you say and what do you commit to?",response:"Hi [Name], I have your message right in front of me and I am taking care of this now. I want to make sure I resolve this completely for you today — can you give me just a moment to pull up your account? With health, [Name] - IM8 Customer Experience [Internal note: customer contacted 3 days ago, prior response not sent. Responding now. Redirected to resolution per policy — no apology for delay.]"},
          {t:"summary",items:["Morning routine: Slack first, then open Gorgias — check for TL updates before touching any ticket","Ticket priority: VIP/escalations first, then SLA-approaching, then first-timers, then oldest first","Internal note format: issue summary + action taken + reason + next steps — tells the story in 2-3 lines","Always tag tickets before closing — untagged closed tickets fail the Records & Notes QC category","Weeks 1-3: stay on Zep/Meet for full shift — senior reviews your responses before they are sent"]},
        ],
        check:[
          {q:"Which Slack channel do you post in at the start and end of your shift?",options:["im8-cs","im8-peace-love-escalations","asai","im8-cs-hkops"],correct:2,exp:"Post 'In' at start and 'Finished shift, going out soon' at end in the asai channel. Also share your inbox screenshot at end of shift."},
          {q:"A VIP ticket and a ticket approaching its SLA deadline both need attention. Which do you handle first?",options:["SLA deadline — time-sensitive","VIP — always Priority 1","Ask TL","Handle both at once"],correct:1,exp:"VIPs, influencers, and escalations are always Priority 1. SLA-approaching tickets are Priority 2."},
          {q:"What must every internal note in a ticket include?",options:["Just the resolution","Summary, action taken, reason, next steps","Customer name and order number only","Just a tag"],correct:1,exp:"Every internal note: (1) Summary of issue, (2) Action taken, (3) Reason for action, (4) Next steps. This directly affects your Records & Notes QC score."},
        ]
      },
    ],
    quiz:[
      {q:"How many ingredients does Essentials PRO contain?",options:["72","82","92","102"],correct:2,exp:"Essentials PRO contains 92 premium ingredients in a 13.6g serving (20 calories)."},
      {q:"NSF Certified for Sport status for the Longevity Powder is:",options:["Fully confirmed","Pending — never confirm it","Certified in the US only","Not applicable"],correct:1,exp:"NSF certification for the Longevity Powder is PENDING. Never confirm it. This is a legal and compliance risk."},
      {q:"An existing subscriber's monthly price for the Longevity Powder is:",options:["$149","$119","$99","$89"],correct:3,exp:"Grandfathered/existing subscribers pay $89/month permanently. New subscribers pay $119/month."},
      {q:"In what order do you work tickets?",options:["Newest to oldest","By tag only","Oldest to newest","As assigned by TL"],correct:2,exp:"Always work oldest to newest. Inbox must be zero by end of shift."},
      {q:"Which system manages customer subscription pause and skip requests?",options:["Shopify","Extensiv","Skio","Aftership"],correct:2,exp:"Skio is the subscription portal for pausing, skipping, cancelling, and adjusting subscription frequency."},
      {q:"Which warehouse system handles UK orders?",options:["Extensiv","OMS GPS US","Stord","OMS GPS UK"],correct:3,exp:"OMS GPS UK is for UK orders only. GPS US handles other regions (US, CA, UAE, FR, etc.)."},
      {q:"What does every internal note require?",options:["Just the resolution applied","Summary, action taken, reason, next steps","Customer name and order number only","A link to the relevant macro"],correct:1,exp:"Every internal note: (1) Summary of issue, (2) Action taken, (3) Reason for action, (4) Next steps."},
      {q:"Ticket priority order — which comes first?",options:["Oldest tickets first","First-time customers","VIPs, influencers, and escalations","Tickets approaching SLA deadline"],correct:2,exp:"Priority 1: VIPs, influencers, and escalations. Priority 2: SLA-approaching. Priority 3: First-time customers. Priority 4: All others, oldest first."},
    ],
  },
  // ─── DAY 3 ───────────────────────────────────────────────────────────────────
  {
    day:3, title:"Policies",
    subtitle:"Master every policy and apply the correct decision on your first attempt every time", duration:"3-4 hrs",
    lessons:[
      {
        id:"d3l0", title:"The Policy Decision Tree",
        content:[
          {t:"video", label:"Part 1 — SOP Sheet", dur:"", url:"/videos/Part 1 - SOP Sheet.mp4"},
          {t:"video", label:"🎬 TO RECORD: Handling a Refund Request End-to-End (8-10 min)", dur:"TBD", url:""},
          {t:"h",v:"The 29 Ticket Segments"},
          {t:"p",v:"Every customer ticket falls into one of 29 segments across 6 categories. Once you identify the segment using the Decision Tree Master, you know: whether to escalate, the replacement/refund policy, your first response approach, and which macro to use."},
          {t:"h",v:"The 6 Categories at a Glance"},
          {t:"kv",pairs:[
            ["Safety (Seg 1-5)","Adverse reactions, GI adjustment, athletes, medical conditions, pregnancy/age"],
            ["Product Quality (Seg 6-9)","Safety concern, texture, damage, cosmetic"],
            ["Product Questions (Seg 10-15)","Timing/dosage, certifications, stacking, interactions, ingredients, taste"],
            ["Results (Seg 16-17)","Under 90 days, over 90 days"],
            ["Value (Seg 18-19)","Price, competitors"],
            ["Shipping (Seg 20-24)","Wrong address, delays, missing/damaged, wrong order, inquiry"],
          ]},
          {t:"h",v:"Escalation Levels"},
          {t:"kv",pairs:[
            ["VP Ops","Adverse reactions (Segment 1) — highest priority, escalate immediately"],
            ["CS Manager","Product quality safety concern (Segment 6)"],
            ["CS Lead","Texture issues, over-90-day results, excess product, all cancellations, medical conditions, partnerships"],
            ["Any agent","All other segments"],
          ]},
          {t:"rule",v:"When you escalate, post in im8-peace-love-escalations with the Gorgias ticket link and a brief summary. Then STOP communicating with the customer — the escalation owner takes over completely."},
          {t:"h",v:"Quick Reference: Policy Decision Tree"},
          {t:"kv",pairs:[
            ["Adverse reaction / negative health effect?","Follow Adverse Reaction Policy — escalate immediately to Head of CX"],
            ["First-time customer, refund within 30 days of delivery?","Follow 30-Day Money Back Guarantee"],
            ["Order delayed?","Follow Shipping Delay Refunds policy"],
            ["Product damaged or defective?","Follow Damaged or Defective Product policy — photo evidence required"],
            ["Package lost or stolen?","Follow Lost or Stolen Packages policy"],
            ["Refund requested for prohibited reason?","Follow Prohibited Refunds policy — deny, offer alternative"],
          ]},
          {t:"tip",v:"When you are unsure which segment a ticket belongs to: pick the more cautious one. If it could be Safety or Product, choose Safety. If it could be Results or Value, choose Results. Being over-cautious costs nothing. Missing a safety trigger can cost everything."},
          {t:"scenario",customer:"Hi, I take IM8 daily but lately I have been feeling dizzy after my morning serving. It started about 2 weeks ago. Could IM8 be causing this?",hint:"This is ambiguous — could be Segment 1 (adverse reaction) or could be unrelated dizziness. Which segment do you choose and why? What are your exact steps?",response:"Thank you for letting us know right away — your safety is our absolute priority. I have refunded your most recent order immediately. Please stop taking the product for now and speak with your doctor as soon as possible — they are the best person to assess what is happening. We take all reports like this very seriously. [Internal: escalate to VP Ops via Slack, log in Adverse Reaction Report, stop all further communication on this ticket]"},
          {t:"summary",items:["29 segments across 6 categories: Safety (1-5), Product Quality (6-9), Product Questions (10-15), Results (16-17), Value (18-19), Shipping (20-24)","Siena Automate YES = AI handles first response. NO = you must respond manually","Escalation levels: VP Ops (adverse reactions), CS Manager (quality safety), CS Lead (medical/results/cancellations)","When escalating: post in im8-peace-love-escalations with link and summary, then STOP all communication","When in doubt: always choose the more cautious segment"]},
        ],
        check:[
          {q:"How many ticket segments does the Decision Tree Master cover?",options:["15","22","29","36"],correct:2,exp:"The Decision Tree Master covers 29 segments across 6 categories."},
          {q:"When you escalate a ticket, you should:",options:["Continue helping the customer until the escalation owner responds","Post in im8-peace-love-escalations with the ticket link and stop communicating","Update the customer and continue helping","Wait for the escalation owner to contact you first"],correct:1,exp:"Post in im8-peace-love-escalations with the ticket link and summary. Then stop communicating with the customer — the escalation owner takes over completely."},
          {q:"A customer's issue could be either a Safety or a Product ticket. You should:",options:["Default to Product — it is less serious","Default to Safety — always choose the more cautious segment","Ask the TL before deciding","Send to Siena Automate"],correct:1,exp:"When in doubt: always choose the more cautious segment. If it could be Safety or Product, choose Safety. Being over-cautious costs nothing — missing a safety trigger can cost everything."},
        ]
      },
      {
        id:"d3l1", title:"Refunds, Shipping & Product Policies",
        content:[
          {t:"h",v:"The 30-Day Money-Back Guarantee"},
          {t:"kv",pairs:[
            ["Who qualifies","First-time customers only — their first order ever with IM8"],
            ["Condition","Opened or unopened product accepted"],
            ["Time limit","Within 30 calendar days of the delivery date"],
            ["Return shipping","Customer pays return shipping"],
            ["Complimentary items","Non-refundable"],
          ]},
          {t:"h",v:"The Refund Procedure"},
          {t:"list",items:[
            "1. Verify it is their first order ever with IM8",
            "2. Confirm delivery date via carrier tracking — calculate days passed",
            "3. Days 1-30: eligible. Proceed to save attempt per Cancellation Policy, then process 100% refund",
            "4. Days 31-60: NOT automatically eligible. Escalate to CS Lead (50% or 100% at their discretion)",
            "5. Days 61+: ineligible. Use the 30day_Refund_Ineligible Gorgias macro",
            "6. Document: reason for refund, delivery date, and date of request in the Refund Sheet",
          ]},
          {t:"rule",v:"The 30-day guarantee covers FIRST ORDERS ONLY. A returning customer's second or third order does not qualify automatically. Always verify before processing."},
          {t:"h",v:"Shipping Delay Policy — Compensation Triggers"},
          {t:"kv",pairs:[
            ["US Domestic","Compensation trigger after 4-6 business days from fulfillment"],
            ["UK","Compensation trigger after 5-7 business days from fulfillment"],
            ["APAC","Compensation trigger after 6-8 business days from fulfillment"],
            ["Europe/International","Compensation trigger after 15-17 business days from fulfillment"],
          ]},
          {t:"h",v:"Active Subscriber Delay Resolution"},
          {t:"list",items:["First touch: Add a free 6-pack of Essentials with next order. Ask them to wait until early following week.","If still unsatisfied: give 25% refund.","Following week — no tracking movement: issue a replacement. If still upset, give additional 25% (total 50%).","Following week — tracking shows movement: advise contacting local courier. If still upset, offer additional 25% (total 50%)."]},
          {t:"h",v:"One-Time Purchase Delay Resolution"},
          {t:"list",items:["First touch: Give 10% refund. Ask them to wait until early following week.","If still unsatisfied: give 15% refund (25% total).","Following week: if still not delivered, issue a replacement."]},
          {t:"h",v:"Missing and Damaged Packages"},
          {t:"kv",pairs:[
            ["Missing — steps","1. Confirm address correct. 2. Ask to check neighbors/building office. 3. Advise 24hr wait. 4. If still missing: free replacement."],
            ["Damaged — steps","Request photo evidence. Once received: process free replacement immediately. No return needed."],
          ]},
          {t:"warn",v:"FRAUD FLAG: A second lost package claim within 12 months must be escalated immediately to Head of CX. Do not process a replacement independently."},
          {t:"h",v:"Fulfilment Delay Refund"},
          {t:"kv",pairs:[
            ["4-6 business days unfulfilled","Process 50% refund of the product. Do not cancel unless requested."],
            ["7+ business days unfulfilled","Process 100% refund of total order value. Do not cancel unless requested."],
          ]},
          {t:"h",v:"Shipping Times & Free Shipping"},
          {t:"kv",pairs:[
            ["Delivery times","US 6 days, UK 7 days, SG 5 days, HK 4 days, AU 7 days, CA 16 days"],
            ["Free shipping","Free worldwide on subscriptions — EXCEPT Norway/Switzerland ($15 flat)"],
            ["Guarantee timing","30-day guarantee starts from DELIVERY DATE, not order date"],
          ]},
          {t:"rule",v:"Always quote actual average delivery times for the customer's country. Never give a generic range. The 30-day guarantee starts from the delivery date — shipping delays do not reduce the trial period."},
          {t:"tip",v:"Before processing any refund: verify two things. (1) Is this their first ever order? (2) How many calendar days since tracking showed delivered? These two checks prevent 80% of policy errors. Build this as a habit before touching the refund button."},
          {t:"scenario",customer:"I ordered IM8 two months ago as a first-time customer and tried it for 4 weeks. I did not feel anything and stopped using it. I would now like a refund please.",hint:"First order + approximately 2 months since ordering. What window applies — 30-day guarantee, 31-60 days, or ineligible? What do you do?",response:"Hi [Name], thank you for reaching out. I want to be transparent with you: our 30-day money-back guarantee runs from the delivery date, and with approximately 2 months having passed since your order arrived, we are outside the automatic guarantee window. I am escalating this to our CS Lead who can review your situation — they have discretion to offer a 50% or 100% refund in cases like yours. I will come back to you as soon as I hear from them. Thank you for your patience. With health, [Name] - IM8 Customer Experience"},
          {t:"summary",items:["30-day guarantee: FIRST orders ONLY, opened or unopened, within 30 calendar days of delivery date","Days 1-30: eligible — save attempt first, then 100% refund. Days 31-60: escalate CS Lead. Days 61+: ineligible macro","Active subscriber delay first touch: free 6-pack Essentials + ask to wait. OTP first touch: 10% refund + ask to wait","Missing package: check Aftership → ask to check neighbors → 24-hour wait → free replacement","Second lost package claim within 12 months: FRAUD FLAG — escalate Head of CX immediately","Unfulfilled 4-6 BD: 50% refund. 7+ BD: 100% refund (verify with warehouse first)"]},
        ],
        check:[
          {q:"The 30-day guarantee applies to:",options:["All orders within 30 days","First orders only, opened or unopened, within 30 days of delivery date","All orders if the product is unopened","Any order if the customer is unhappy"],correct:1,exp:"First orders only, opened or unopened, within 30 calendar days from the delivery date. Customer pays return shipping."},
          {q:"An active subscriber reports a 6-day delay in the US. Your first offer is:",options:["A 25% refund","A full replacement","A free 6-pack of Essentials added to their next order, ask them to wait","A 10% refund"],correct:2,exp:"Active subscriber first touch for delay: add a free 6-pack of Essentials with next order and ask them to wait until early the following week."},
          {q:"A customer's second shipment is reported lost within 12 months. You:",options:["Process a free replacement as standard","Offer a refund instead of replacement","Escalate immediately to Head of CX — do not process a replacement independently","Ask for more evidence before deciding"],correct:2,exp:"FRAUD FLAG: A second lost package claim within 12 months must be escalated immediately to Head of CX. Do not process a replacement independently."},
        ]
      },
      {
        id:"d3l2", title:"Subscriptions & Cancellations",
        content:[
          {t:"video", label:"Section 5 — Templates & Scripts", dur:"", url:"/videos/Section 5.mp4"},
          {t:"h",v:"How Subscriptions Work"},
          {t:"list",items:[
            "Customers manage their subscription via the Skio portal",
            "They can: pause, skip next order, change frequency, update address, cancel",
            "Grandfathered subscribers: existing pricing is protected permanently — if they cancel and resubscribe, they lose it forever",
            "Essentials PRO: $112 one-time, $89/month (30-day sub), $235/quarter (90-day sub)",
            "Longevity: $149 one-time, $119/month (30-day sub), $312/quarter (90-day sub) — or $89/month grandfathered",
            "Beckham Stack: $261 one-time, $208/month, $548/quarter",
            "Subscription includes free worldwide shipping (except Norway/Switzerland at $15)",
          ]},
          {t:"rule",v:"For ALL subscription adjustment requests: offer skip, pause, or frequency change BEFORE discussing cancellation. Only after all options are offered and declined should you proceed to cancel."},
          {t:"h",v:"Subscription Tickets — Segments 25-27"},
          {t:"kv",pairs:[
            ["Segment 25 — Excess Product","Too much product stacked up. Escalate CS Lead. Offer skip, pause, or extend frequency. Only cancel if all options declined."],
            ["Segment 26 — Change/Pause/Upgrade","High-leverage save. Always offer pause/frequency change first. Only cancel if they clearly insist after all options explained."],
            ["Segment 27 — Inquiry","Neutral question about subscription management. Answer directly — explain Skio portal, no upsell pressure."],
          ]},
          {t:"h",v:"SEGMENT 28: The Cancellation Decision Tree"},
          {t:"warn",v:"MANDATORY: Before processing any cancellation, you MUST check the order date and ask for the reason. Use the cancellation macro. Only after understanding the reason do you proceed to the Cancellation Decision Tree."},
          {t:"h",v:"Cancellation Decision by Reason"},
          {t:"kv",pairs:[
            ["Safety - adverse reactions","No save. Cancel immediately. Safety over revenue every time."],
            ["Safety - medical conditions","No save attempt. Cancel immediately."],
            ["Safety - GI adjustment (soft tone)","Can save: normalize GI, offer timing tweaks. Cancel if save refused."],
            ["Results - under 90 days (soft tone)","Can save: normalize adaptation curve, encourage full 90 days."],
            ["Results - over 90 days / firm/angry","Validate, cancel politely, no push."],
            ["Value - price (soft/exploratory)","Strong save: reframe value, offer downgrade or lower frequency."],
            ["Value - competitor switch","One short save attempt (value framing). Cancel if still decided."],
            ["Subscription - excess product","High save: skip, pause, extend frequency. Cancel only if all options refused."],
          ]},
          {t:"h",v:"Golden Rules of Cancellation"},
          {t:"list",items:[
            "ALWAYS ask for the reason before cancelling",
            "NEVER make cancellation difficult or frustrating — respect the customer's right to cancel",
            "NEVER use guilt, pressure, or desperation in save attempts",
            "ONE save attempt maximum per reason category — never repeat after it is declined",
            "Cancel immediately for: adverse reactions, medical conditions, pregnancy concerns",
            "Always tag the ticket with the cancellation reason for team learning",
          ]},
          {t:"tip",v:"One question saves approximately 20% of cancellations: 'Before I process that, can I ask what prompted this decision today?' It is genuine curiosity, not a delay tactic. The reason the customer gives determines everything — which save attempt applies, how firm to be, and what you tag."},
          {t:"scenario",customer:"Hi, I would like to cancel my subscription please. Thank you.",hint:"A cancellation with zero context. What is your MANDATORY first step? What exactly do you ask and how do you phrase it so it does not feel like a sales pitch?",response:"Of course, I can take care of that for you. Before I process it, could I ask what has prompted this decision today? I want to make sure I handle this the right way for you — and if there is anything I can do, I want to know. With health, [Name] - IM8 Customer Experience [Internal: waiting for reason — do not cancel until reason is known. Use Cancellation DT once reason is provided.]"},
          {t:"summary",items:["Offer save options in this order: skip → pause → frequency change → cancel. NEVER jump straight to cancel","MANDATORY before any cancellation: check order date + ask for the reason using the cancellation macro","No save attempts ever for: adverse reactions, medical conditions, pregnancy — safety above retention always","ONE save attempt maximum per reason — never repeat after it has been declined once","Cancel immediately and politely when the customer insists — never make it difficult or guilt-laden","Grandfathered customers: warn them that cancelling loses their $89/month rate permanently before processing"]},
        ],
        check:[
          {q:"What is MANDATORY before processing any cancellation?",options:["Process the cancellation first, then ask why","Check the order date and ask for the reason before proceeding","Offer a 10% discount immediately","Escalate to CS Lead"],correct:1,exp:"MANDATORY: Check the order date and ask for the reason before processing any cancellation. Use the cancellation macro. Only then proceed to the Cancellation Decision Tree."},
          {q:"A customer says they want to cancel because they have too much product. Your first response is:",options:["Process the cancellation immediately","Offer to pause or extend the frequency of their subscription so they keep their pricing","Escalate to CS Lead without responding","Ask what size bag they prefer for their next order"],correct:1,exp:"Excess product = offer skip, pause, or frequency extension first — high save opportunity. Only cancel if they decline all options and explicitly request cancellation."},
          {q:"A customer reports a severe rash and wants to cancel. You:",options:["Attempt a save — the rash could be unrelated to IM8","Offer a replacement product that might agree with them better","Cancel immediately with no save attempt — safety over revenue. Follow adverse reaction escalation protocol.","Ask them to wait 1-2 weeks to see if symptoms subside"],correct:2,exp:"Adverse reactions: no save attempt ever. Cancel immediately. Safety is always above revenue. Follow full adverse reaction escalation protocol."},
        ]
      },
    ],
    quiz:[
      {q:"The 30-day guarantee applies to which orders?",options:["All orders within 30 days","First orders only, opened or unopened, within 30 days of delivery","All orders if the product is unopened","Any order if the customer is unhappy"],correct:1,exp:"First orders only, opened or unopened, within 30 calendar days from delivery date. Customer pays return shipping."},
      {q:"An order has not been fulfilled for 8 business days. After verifying with warehouse, you process:",options:["A 50% refund","A 100% refund of the total order value","A free replacement","An escalation to CS Lead"],correct:1,exp:"7+ business days unfulfilled = 100% refund of total order value (after verifying with warehouse that it is truly unfulfilled)."},
      {q:"A customer reports 'tracking says delivered' but they received nothing. After checking Aftership, you:",options:["Send a replacement immediately","Ask customer to check neighbors/mailroom, advise 24-hour wait — if still missing, send free replacement","Escalate to Head of CX","Contact the carrier and wait for their investigation"],correct:1,exp:"Check Aftership > ask customer to check neighbors/mailroom > advise 24-hour wait. If still missing after 24 hours: send free replacement."},
      {q:"A second lost package claim within 12 months:",options:["Process replacement as standard","Offer refund instead","Escalate immediately to Head of CX — fraud flag","Ask for additional photo evidence"],correct:2,exp:"FRAUD FLAG: A second lost package claim within 12 months must be escalated immediately to Head of CX. Do not process independently."},
      {q:"What is MANDATORY before processing any cancellation?",options:["Offer a discount first","Check order date and ask for the reason using the cancellation macro","Cancel first, then ask why","Escalate to CS Lead"],correct:1,exp:"MANDATORY: Check the order date and ask for the reason before processing any cancellation. Use the cancellation macro. Only then proceed to the Cancellation Decision Tree."},
      {q:"A customer says 'just cancel my subscription' after you explain save options. You:",options:["Try one more save attempt","Escalate to CS Lead","Cancel politely and tag the cancellation reason — never make cancellation difficult","Put the ticket on hold"],correct:2,exp:"If a customer clearly insists after options are explained: cancel politely, no additional push. Always tag the cancellation reason."},
      {q:"For subscription change requests, what do you offer BEFORE discussing cancellation?",options:["A 10% discount","Pause, skip, or frequency change","Escalation to CS Lead","A free product replacement"],correct:1,exp:"For ALL subscription tickets: offer pause, skip, or frequency change before discussing cancellation. Only cancel after all options are offered and declined."},
      {q:"A one-time purchase customer reports a 5-day delay in the US. Your first offer is:",options:["A free 6-pack of Essentials","A full replacement","A 10% refund, ask them to wait until early next week","A 25% refund"],correct:2,exp:"OTP/inactive subscriber first touch: 10% refund + ask to wait. Active subscribers get the free 6-pack of Essentials instead."},
    ],
    writing:{
      scenario:"Hi, I ordered IM8 two weeks ago and my package has not arrived. I have sent two emails already and nobody has replied. I am really disappointed with this service.",
      prompt:"You are an IM8 CS quality coach. A trainee agent responded to this customer message: [CUSTOMER]. Their response was: [RESPONSE]. Grade out of 10 across: IM8 Voice (warm, direct, no corporate jargon), Empathy (acknowledged frustration genuinely), Accuracy (correct Aftership-first protocol and delay compensation applied), Completeness (clear next step given). Start with SCORE: X/10 on its own line, then 3-4 sentences: what they did well, one concrete improvement, and one specific IM8 policy they should reference next time."
    }
  },
  // ─── DAY 4 ───────────────────────────────────────────────────────────────────
  {
    day:4, title:"Difficult Conversations",
    subtitle:"Build the resilience, empathy, and judgment to handle the hardest situations confidently", duration:"3-4 hrs",
    lessons:[
      {
        id:"d4l0", title:"De-escalation & Resilience",
        content:[
          {t:"video", label:"🎬 TO RECORD: De-escalation in Action (4-5 min)", dur:"TBD", url:""},
          {t:"h",v:"Why This Is a Skill, Not an Instinct"},
          {t:"p",v:"When a customer is angry, frustrated, or distressed, the human instinct is to become defensive, over-apologize, or shut down. None of those responses help. De-escalation is a learnable skill — a specific sequence of moves that consistently turns difficult interactions into resolutions. It requires Resilience and Empathetic Communication from the IM8 DNA, applied deliberately."},
          {t:"h",v:"The 3-Step De-escalation Framework"},
          {t:"kv",pairs:[
            ["Step 1: Acknowledge","Name what the customer is feeling before you say anything else. This is not about agreeing with them — it is about showing you heard them. 'I can absolutely see how frustrating this is.' This alone reduces emotional intensity significantly."],
            ["Step 2: Empathize","Connect their feeling to the specific situation. 'Waiting this long for an order you were excited about is genuinely disappointing.' Specific empathy lands harder than generic empathy. Never use 'I understand your frustration' — it sounds scripted."],
            ["Step 3: Resolve","Take clear, immediate ownership. 'Here is what I am doing right now.' Give one concrete action. Do not give options at this stage — act first, then offer choices once they are calm."],
          ]},
          {t:"h",v:"What NOT to Do"},
          {t:"warn",v:"NEVER say 'I understand your frustration' — customers know it is scripted and it makes things worse. Say something specific about their situation instead."},
          {t:"warn",v:"NEVER become defensive or justify the company's position when a customer is emotional. Acknowledge first, always."},
          {t:"warn",v:"NEVER over-apologize — excessive apologies focus on the problem, not the solution. One genuine acknowledgment is enough. Then move to action."},
          {t:"warn",v:"NEVER match their tone. Calm, confident, and caring — always. The customer's emotional temperature will drop to meet yours if you hold the frame."},
          {t:"h",v:"De-escalation in Practice — Four Scenarios"},
          {t:"kv",pairs:[
            ["Angry refund denial","Acknowledge anger first. Check policy. Offer a solution even if it is not a full refund: 'I completely understand your frustration. While a refund is not possible under our policy here, I absolutely want to make this right — I can offer you a full store credit or an exchange.'"],
            ["Shipping frustration","'I can see how concerning it is — you were expecting this by now and it has not arrived. I am checking Aftership right now and I will not close this ticket until I have an answer for you.'"],
            ["Policy denial","'Our policy does not allow for a refund in this specific situation, but I do not want you to walk away without a resolution. Let me see what I can offer you.' Never say 'per our policy' as an opener — it sounds like a wall going up."],
            ["Demanding an exception","Listen first. Acknowledge why they think an exception is reasonable. Explain clearly what you can and cannot do. 'I cannot do X, but I can do Y right now.'"],
          ]},
          {t:"h",v:"Resilience Under Pressure"},
          {t:"p",v:"IM8 agents handle frustrated customers, high volumes, and complex issues every shift. Resilience is not the absence of stress — it is the ability to stay focused and empathetic under pressure. Your emotional state is visible in your writing. If you are frustrated, customers feel it. Take 10 seconds before responding to a difficult ticket. Breathe. Reset. Then write."},
          {t:"tip",v:"The fastest way to de-escalate any interaction is to make the customer feel like you are on their side — not on the company's side. You are. Your job is to solve their problem. Acknowledge that truth in your first sentence and the emotional temperature drops immediately."},
          {t:"scenario",customer:"This is absolutely ridiculous. I have spent $200 on your product and it has been sitting in transit for 3 weeks with no update. Your customer service is a joke and I want a full refund immediately.",hint:"High emotion, long delay, refund demand. Apply the 3-step framework: Acknowledge → Empathize → Resolve. Do not jump to policy first. What do you write?",response:"I completely understand your frustration — three weeks with no tracking update on a $200 order is absolutely not acceptable, and I am sorry this happened. I am checking your shipment status right now and I am not closing this ticket until this is resolved. If your order has been lost, I will process a full replacement immediately — no questions asked. Can you confirm your shipping address so I can investigate right now? With health, [Name] - IM8 Customer Experience"},
          {t:"summary",items:["3-step de-escalation: Acknowledge (name the feeling) → Empathize (connect to their specific situation) → Resolve (one clear action)","Never say 'I understand your frustration' — it is scripted and makes things worse. Be specific.","Never become defensive, never over-apologize, never match their angry tone — stay calm, confident, and caring","Policy denials: never open with 'per our policy' — acknowledge first, then explain what you can offer instead","Resilience: take 10 seconds before responding to a difficult ticket — your emotional state shows in your writing"]},
        ],
        check:[
          {q:"What is the correct first step when a customer sends an angry message?",options:["Explain the relevant policy immediately","Acknowledge what the customer is feeling before saying anything else","Offer a refund to defuse the situation","Escalate to TL"],correct:1,exp:"Step 1: Acknowledge. Name what the customer is feeling before anything else. This reduces emotional intensity and shows you heard them."},
          {q:"Which phrase should you NEVER use when de-escalating?",options:["'I can absolutely see how frustrating this is'","'I understand your frustration'","'Here is what I am doing right now'","'Let me check this for you immediately'"],correct:1,exp:"'I understand your frustration' sounds scripted and customers know it. Say something specific about their situation instead."},
          {q:"A customer is extremely angry about a policy denial. You should:",options:["Explain the policy clearly and stand firm","Acknowledge their frustration first, then explain what you CAN offer as an alternative","Over-apologize and offer a full exception","Match their urgent tone to show you take it seriously"],correct:1,exp:"Acknowledge first, always. Then explain what you can and cannot do. Never open with 'per our policy' — it sounds like a wall. Offer an alternative where possible."},
        ]
      },
      {
        id:"d4l1", title:"Results, Value & Product Tickets",
        content:[
          {t:"h",v:"SEGMENT 16: Results — Under 90 Days"},
          {t:"kv",pairs:[
            ["Example","'I do not feel anything yet' / 'Not sure it is working' / 'Thinking of cancelling — no results'"],
            ["Siena Automate","YES"],
            ["Escalate?","No — any agent can handle"],
            ["Approach","Educate on the 90-day curve using clinical trial results. Normalize. Ask how consistent they have been."],
          ]},
          {t:"rule",v:"NEVER promise specific outcomes or timelines. Sub-90-days with soft tone: one save attempt (encourage full 90 days). Over 90 days or firm/angry: validate, cancel politely, no push."},
          {t:"flowchart",id:"results-tree"},
          {t:"h",v:"SEGMENT 17: Results — Over 90 Days"},
          {t:"kv",pairs:[
            ["Example","'I have used it for 4+ months and it is not working'"],
            ["Escalate?","YES — escalate to CS Lead"],
            ["Approach","Validate their experience. Escalate. Never argue. If they insist on cancelling, cancel politely."],
          ]},
          {t:"h",v:"SEGMENT 18: Value — Price"},
          {t:"kv",pairs:[
            ["Example","'It is too expensive' / 'I cannot afford this long term'"],
            ["Approach","Frame IM8 as replacing many separate supplements. Propose lower-cost options: Essentials only, longer frequency, or reduced quantity."],
            ["Save guidance","Soft/exploratory: strong save via downgrade or frequency change. Serious financial hardship or 'just cancel': cancel quickly with empathy, no hard save."],
          ]},
          {t:"h",v:"SEGMENT 19: Value — Competitors"},
          {t:"kv",pairs:[
            ["Example","'AG1 is cheaper/better' / 'Why choose IM8 instead of X?'"],
            ["Approach","Explain differentiation — Beckham Stack, longevity focus, all 12 hallmarks of aging, clinical data, NSF cert — without attacking competitors."],
            ["Save guidance","Just comparing: educate only. Explicitly cancelling to switch: one short save attempt. If still decided: cancel and tag as competitor churn."],
          ]},
          {t:"h",v:"SEGMENT 6-9: Product Quality Tickets"},
          {t:"kv",pairs:[
            ["Segment 6 — Quality Safety (foreign object)","Escalate CS Manager. Request photo + batch number. 100% refund + free replacement."],
            ["Segment 7 — Texture (clumpy)","Escalate CS Lead. Free replacement always. Advise discard."],
            ["Segment 8 — Damage (broken sachets)","Request photo evidence. Free replacement immediately. Partial or full refund depending on severity."],
            ["Segment 9 — Cosmetic (color variation)","Explain natural variation (orange from astaxanthin — same compound that makes salmon orange). Offer replacement if still uncomfortable."],
          ]},
          {t:"h",v:"SEGMENTS 10-15: Product Question Tickets"},
          {t:"kv",pairs:[
            ["Segment 10 — Timing/Dosage","ONE clear default: once daily in the morning with water. Never overwhelm with multiple protocols."],
            ["Segment 11 — Certifications","Reassure with NSF Certified for Sport, 3rd-party testing. Link to Science page."],
            ["Segment 12 — Stacking","Most take both together as the Beckham Stack. Emphasize simplicity and flexibility."],
            ["Segment 13 — Interactions with prescriptions","Reclassify immediately as Segment 4 (medical conditions). Direct to doctor."],
            ["Segment 15 — Taste","Normalize. Offer mixing tips: more water, colder water, juice or smoothie, frother. Remind of 30-day guarantee if within window."],
          ]},
          {t:"tip",v:"The Results ticket is where your patience pays off. A customer 'feeling nothing' at week 6 is a real save opportunity. Educate first, validate second, ask about their routine. Rushing to offer refunds loses the customer and teaches them that asking always gets money back."},
          {t:"scenario",customer:"I love the idea of IM8 and I have been consistent for 8 weeks, but I do not notice any difference in energy or focus. My friend takes AG1 and swears by it. Starting to wonder if I should switch.",hint:"Two things at once: results concern (Segment 16) AND competitor comparison (Segment 19). How do you address both without being pushy or attacking AG1?",response:"Eight weeks is real commitment and I respect that. The cellular-level changes IM8 drives — NAD+ pathway support, gut microbiome development — are foundational. Many people notice the shift between weeks 8-12. As for AG1: it is a greens powder with a very different focus. IM8 is the only supplement targeting all 12 hallmarks of aging with clinical backing. Two more weeks and a quick routine check could make all the difference — would you like to take a look at how you are currently taking it? With health, [Name] - IM8 Customer Experience"},
          {t:"summary",items:["Sub-90 days + soft tone = strong save opportunity. Educate on 90-day clinical curve, one save attempt maximum","Over-90 days results: escalate CS Lead, validate, cancel if firm — do not argue","Value/price soft tone: reframe value, offer downgrade to Essentials only or lower frequency","Competitors: differentiate using 12 hallmarks of aging, NSF cert, clinical data — never attack competitors","Product quality safety (Seg 6): escalate CS Manager, photo + batch number, 100% refund + replacement","For prescription drug questions in Segment 13: reclassify immediately to Segment 4 (medical conditions)"]},
        ],
        check:[
          {q:"A customer has been taking IM8 for 5 weeks and says they feel nothing. Your response is:",options:["Offer a refund immediately","Tell them to increase the dosage","Educate on the 90-day clinical curve, normalize the timeline, one save attempt","Escalate to CS Lead"],correct:2,exp:"Sub-90 days + soft tone: educate on the 90-day curve, normalize, encourage full trial. One save attempt maximum."},
          {q:"A customer has been taking IM8 for 5 months and says it has done nothing. You:",options:["Educate them on the 90-day curve","Offer a free replacement","Validate their experience and escalate to CS Lead","Immediately process a full refund"],correct:2,exp:"Over-90-day results ticket: validate their experience and escalate to CS Lead. Do not argue or push save attempts."},
          {q:"A customer mentions they take a prescription drug and asks about interactions. You:",options:["Reclassify to Segment 4 (medical conditions) and direct to their prescribing doctor","Use stacking/interaction macros as for basic supplement combos","Escalate to CS Lead","Tell them IM8 is generally safe"],correct:0,exp:"Prescription drug mentions: reclassify immediately to Segment 4 (medical conditions). Provide ingredient list, direct to prescribing doctor. Never clear or deny use."},
        ]
      },
      {
        id:"d4l2", title:"Safety Tickets & Escalation Protocol",
        content:[
          {t:"video", label:"🎬 TO RECORD: Adverse Reaction Protocol (3 min)", dur:"TBD", url:""},
          {t:"h",v:"SEGMENT 1: Safety — Adverse Reactions"},
          {t:"kv",pairs:[
            ["Example","Allergic reaction, rash, hives, dizziness, unwell after taking IM8"],
            ["Siena Automate","NO"],
            ["Escalate?","YES — escalate to VP Ops immediately"],
            ["Refund","YES — 100% immediately, no questions asked"],
            ["Replacement","No"],
          ]},
          {t:"warn",v:"STOP all conversation with the customer immediately. Escalate to VP Ops via Slack with the ticket link. Process 100% refund of most recent order. Log in the Adverse Reaction Report. Do not communicate further — the escalation owner takes over."},
          {t:"compare",pairs:[
            ["I understand, it sounds like IM8 might have caused your reaction.","I am so sorry to hear you are not feeling well. I have refunded your most recent order immediately. Please stop use of the product and consult your doctor — they are the best person to advise you."],
            ["IM8 is safe and well-tested so it is unlikely this is from our product.","We take all reports of this nature very seriously. Your safety is our absolute priority."],
          ]},
          {t:"rule",v:"NEVER say or imply the product caused or did not cause the reaction. NEVER give medical advice. NEVER minimize their experience. NEVER tell them to keep taking the product while symptomatic."},
          {t:"h",v:"SEGMENTS 2-5: Other Safety Tickets"},
          {t:"kv",pairs:[
            ["Segment 2 — GI Adjustment","'Is this normal?' — digestive discomfort. Educate on probiotics/enzymes, normalize mild discomfort, suggest monitoring. Any agent can handle."],
            ["Segment 3 — Athletes","Drug-tested athlete concern. Reassure with NSF Certified for Sport. Siena Automate YES."],
            ["Segment 4 — Medical Conditions","Customer mentions medications or conditions. Provide ingredient list, direct to prescribing doctor. Escalate CS Lead."],
            ["Segment 5 — Pregnancy/Age","Young customer or pregnant. Provide ingredient list, direct to healthcare provider. Never clear or deny use. Escalate CS Lead."],
          ]},
          {t:"h",v:"Escalation Protocol — When to Ask for Help"},
          {t:"p",v:"Escalating the right issue at the right time protects both the customer and IM8. When in doubt, escalate. Your team is here to support you."},
          {t:"h",v:"Escalate Immediately For:"},
          {t:"kv",pairs:[
            ["Adverse health reactions","Any negative physiological effect — escalate to VP Ops immediately, no exceptions"],
            ["Legal threats","Customer threatening legal action — escalate to Head of CX"],
            ["Abusive language","Customer using abusive or hateful language — escalate, do not engage"],
            ["Regulatory inquiries","FDA, TGA, Health Canada, etc. — escalate immediately"],
            ["GDPR / data privacy requests","Any data deletion or privacy request — escalate immediately"],
            ["VIPs and influencers","Known VIP or influencer — escalate to CS Lead"],
            ["Refund significantly outside policy","Escalate to CS Lead for discretionary decision"],
            ["Repeat lost package claims","Second claim within 12 months — escalate to Head of CX (fraud flag)"],
            ["Technical issues affecting many customers","Multiple customers reporting same issue — escalate to CS Lead immediately"],
          ]},
          {t:"rule",v:"Escalation script for the customer: 'I have shared this with our specialist team so we can get you the best possible answer. I will personally monitor this and keep you updated on our progress.'"},
          {t:"h",v:"How to Escalate"},
          {t:"list",items:[
            "1. Post in im8-peace-love-escalations with the Gorgias ticket link and a brief summary of the issue",
            "2. STOP all communication with the customer — the escalation owner takes over completely",
            "3. Do NOT close the ticket — leave it open for the escalation owner",
            "4. Use confident and clear language when communicating the escalation to the customer",
          ]},
          {t:"tip",v:"Escalating is not a sign of weakness — it is Integrity in action. Recognizing the limits of your authority and protecting the customer (and IM8) by involving the right person is exactly what the handbook asks of you. The agents who never escalate are the ones who make costly mistakes."},
          {t:"scenario",customer:"Hi, I take IM8 daily and I have noticed some heart palpitations over the last week. I also have a heart condition and take medication for it. Should I continue taking it?",hint:"This has TWO escalation triggers: potential adverse reaction AND medical condition with prescription medication. What are your exact steps? What do you say and what do you never say?",response:"Thank you for telling us this right away — your health is our absolute priority. Please stop taking the product for now and speak with your doctor as soon as possible — they are the best person to assess what is happening. I have processed a full refund of your most recent order immediately. [Internal: Segment 1 adverse reaction + Segment 4 medical condition — escalate to VP Ops immediately via Slack. Log in Adverse Reaction Report. Stop all communication on this ticket. Do not state product caused or did not cause palpitations. Do not give any medical advice.]"},
          {t:"summary",items:["Segment 1 (adverse reactions): STOP, escalate VP Ops, 100% refund, log Adverse Reaction Report, stop all communication","NEVER: imply product caused/did not cause reaction, give medical advice, minimize, tell them to keep taking it","Escalation triggers: adverse reactions, legal threats, abusive language, regulatory inquiries, GDPR, VIPs, repeat lost packages","Escalation steps: post in im8-peace-love-escalations with link + summary → stop communicating → leave ticket open","Escalation script: 'I have shared this with our specialist team. I will personally monitor this and keep you updated.'","When in doubt about escalating: escalate. Protecting the customer and IM8 is always the right call"]},
        ],
        check:[
          {q:"A customer reports hives and a rash after taking IM8. Your immediate action is:",options:["Send the GI adjustment macro","Ask for photos and advise them to monitor","Escalate to VP Ops, process 100% refund, stop all conversation, log in Adverse Reaction Report","Reassure them it is likely a detox reaction"],correct:2,exp:"Adverse reactions are P1. Escalate to VP Ops. 100% refund. Stop all conversation. Log in Adverse Reaction Report."},
          {q:"A customer threatens legal action. You:",options:["Handle it yourself using the policy macros","Politely explain the refund policy and close the ticket","Escalate to Head of CX immediately — legal threats are an immediate escalation trigger","Offer a full refund to resolve the situation"],correct:2,exp:"Legal threats are an immediate escalation trigger. Escalate to Head of CX. Do not negotiate or promise outcomes."},
          {q:"After posting an escalation in im8-peace-love-escalations, you should:",options:["Continue monitoring and responding in case the escalation owner needs help","Use the escalation script with the customer, then stop communicating — the escalation owner takes over","Ask the customer to wait 48 hours","Close the ticket and flag to TL verbally"],correct:1,exp:"Use the escalation script to communicate to the customer, then stop communicating — the escalation owner takes over completely. Do not close the ticket."},
        ]
      },
    ],
    quiz:[
      {q:"What is the first step of the de-escalation framework?",options:["Explain the relevant policy","Offer a refund","Acknowledge what the customer is feeling before anything else","Ask clarifying questions"],correct:2,exp:"Step 1: Acknowledge. Name what the customer is feeling before anything else. This reduces emotional intensity and shows you heard them."},
      {q:"A customer reports feeling dizzy after taking IM8. Your immediate action is:",options:["Send the GI adjustment macro","Ask for photos of any visible symptoms","Escalate to VP Ops, process 100% refund, stop all conversation, log in Adverse Reaction Report","Reassure them it is likely a detox reaction"],correct:2,exp:"Any negative physiological effect = adverse reaction. Escalate to VP Ops immediately. 100% refund. Stop all conversation. Log in Adverse Reaction Report."},
      {q:"A customer has been on IM8 for 6 weeks with no noticeable results. Your approach is:",options:["Offer an immediate refund","Escalate to CS Lead as an over-90-day results ticket","Educate on the 90-day clinical curve, offer a routine check, one save attempt","Process a replacement as a goodwill gesture"],correct:2,exp:"Sub-90 days + soft tone: educate on the 90-day curve, normalize, encourage full trial. One save attempt."},
      {q:"A customer says they want to cancel because IM8 is too expensive. They seem open to alternatives. You:",options:["Cancel immediately","Suggest downgrading to Essentials only ($89/month) or a lower frequency option","Tell them to come back when they can afford it","Offer a 10% discount"],correct:1,exp:"Value/price with soft/exploratory tone = strong save opportunity. Reframe value, offer downgrade to Essentials only, suggest lower frequency."},
      {q:"A customer mentions they take a prescription heart medication and asks about interactions. You:",options:["Use stacking interaction macros — basic combos are fine","Reclassify immediately to Segment 4 (medical conditions) and direct to their prescribing doctor","Reassure them IM8 is safe for most people","Escalate to VP Ops"],correct:1,exp:"Prescription drug mentions: reclassify to Segment 4 (medical conditions). Provide ingredient list, direct to prescribing doctor. Never clear or deny use."},
      {q:"When de-escalating, you should NEVER:",options:["Acknowledge the customer's frustration specifically","Take clear immediate ownership","Say 'I understand your frustration'","Offer a concrete action in your first response"],correct:2,exp:"'I understand your frustration' sounds scripted. Say something specific to their situation instead — specific empathy lands much harder than generic."},
      {q:"A legal threat from a customer is:",options:["An opportunity to explain the refund policy clearly","Handled with the standard escalation macro","An immediate escalation trigger — escalate to Head of CX","Resolved by offering a full refund"],correct:2,exp:"Legal threats are an immediate escalation trigger. Escalate to Head of CX. Do not negotiate or promise outcomes."},
      {q:"A customer with over-90-day results is unhappy and firmly wants to cancel. You:",options:["Educate them on the 90-day curve","Offer a save attempt — maybe price is the real issue","Validate their experience and escalate to CS Lead — cancel if they insist, no additional push","Offer a 50% refund as a compromise"],correct:2,exp:"Over-90-day results + firm/angry: validate, escalate CS Lead, cancel politely if they insist. Do not argue or make additional save attempts."},
    ],
    writing:{
      scenario:"Hi, I have been taking IM8 for 2 weeks and I have noticed some heart palpitations. Could this be from IM8? I also have a heart condition and take medication. Should I continue taking it?",
      prompt:"You are an IM8 CS quality coach reviewing a compliance-critical interaction. Customer message: [CUSTOMER]. Trainee response: [RESPONSE]. This involves BOTH a potential adverse health reaction AND a disclosed medical condition with prescription medication — both are immediate escalation triggers. Grade out of 10 across: Compliance (did they refer to a healthcare professional immediately?), Safety (did they appropriately handle the adverse reaction?), Escalation Awareness (did they flag or escalate appropriately?), Tone (empathetic and calm, not dismissive?). Start with SCORE: X/10 on its own line, then 3-4 sentences covering what they did correctly and what they MUST do differently for compliance and safety."
    }
  },
  // ─── DAY 5 ───────────────────────────────────────────────────────────────────
  {
    day:5, title:"Graduation",
    subtitle:"Prove you are ready. Understand your performance targets. Go live.", duration:"3-4 hrs",
    lessons:[
      {
        id:"d5l0", title:"Final Simulation Assessment",
        content:[
          {t:"h",v:"You Have Made It to Graduation Day"},
          {t:"p",v:"Today is not about learning new policies. Today is about proving you can apply everything from Days 1-4 in real situations. You will handle five full ticket scenarios, write complete responses, and score yourself against the QC Scorecard before checking the ideal answers."},
          {t:"h",v:"How to Use This Assessment"},
          {t:"list",items:[
            "Read each scenario carefully — identify the segment and category first",
            "Write your full response as if sending to a real customer",
            "Self-score: rate yourself 1-5 on Accuracy, Tone, Clarity, Efficiency, Records & Notes",
            "Then reveal the ideal approach and compare — where did you lose points?",
            "Target: 20+/25 on each scenario",
          ]},
          {t:"h",v:"Scenario 1 — The Refund Request"},
          {t:"ex",c:"I ordered IM8 for the first time 3 weeks ago and I am not happy with the results. Can I get a refund?",a:"Hi [Name], thank you for getting in touch. You are absolutely within your 30-day window, so I am happy to process a full refund for you. Before I do — I want to make sure we have given IM8 every opportunity to work for you. Noticeable results often build over 60-90 days as the ingredients accumulate. That said, if you have made up your mind, I completely respect that. To proceed, simply send the product back to us — you cover return shipping — and I will process your refund as soon as we receive it. Let me send you the return address now. With health, [Name] - IM8 Customer Experience [QC: Accuracy 5 — 30-day eligible, save attempt made. Tone 5 — warm and respectful. Clarity 5 — clear next step. Efficiency 5 — resolved in one message. Records: must tag refund_30day and document in Refund Sheet.]"},
          {t:"h",v:"Scenario 2 — The Angry Delay"},
          {t:"ex",c:"I have been waiting 3 weeks for my order. My tracking has shown the same status for 10 days. I have emailed twice and nobody has responded. I am absolutely furious and I want this resolved TODAY.",a:"I completely understand your frustration — three weeks with no tracking update and no response is absolutely not the experience we want to give you, and I am sorry. I am checking your shipment status right now. If your order has been lost, I will send a free replacement immediately — no waiting, no conditions. Can you confirm your shipping address is still current so I can act on this now? With health, [Name] - IM8 Customer Experience [QC: Tone 5 — acknowledge anger first, no defensive language. Accuracy 5 — lost package protocol referenced. Efficiency 5 — one clear action, commitment to resolution today. Do NOT apologize for delayed reply — redirect to resolution.]"},
          {t:"h",v:"Scenario 3 — The Cancellation"},
          {t:"ex",c:"Hi, I would like to cancel my subscription. I have too much product at home and I just cannot keep up with it.",a:"Of course, I can help you with that. Before I process it — it sounds like you are staying consistent, which is great! The good news is you do not need to cancel to solve this. I can push your next order out by 6-8 weeks so you can work through what you have at home, and you keep all your existing pricing benefits. Would that work for you? With health, [Name] - IM8 Customer Experience [QC: This is Segment 25 (excess product) — save attempt with skip/delay is correct. If they decline, cancel immediately. ONE save attempt maximum. Tag: subscription_excess_product.]"},
          {t:"h",v:"Scenario 4 — The Product Safety Concern"},
          {t:"ex",c:"Hi, I found what looks like a small piece of plastic in my powder. I am really concerned.",a:"I am so sorry to see this — this is absolutely not what we want you to find, and I completely understand your concern. Thank you for letting us know immediately. Could you please send a photo of what you found along with your batch number (on the bag or box)? I am escalating this to our quality team right away and will arrange a free replacement for you as soon as I receive the image. Please do not use the remaining product until we have investigated. With health, [Name] - IM8 Customer Experience [QC: Segment 6 — product quality safety concern. Photo + batch number required. Escalate CS Manager. 100% refund + replacement. Never process quality claim without photo except in hazardous situations.]"},
          {t:"h",v:"Scenario 5 — The Medical Question"},
          {t:"ex",c:"I take Warfarin for a heart condition. Is it safe to take IM8 alongside my medication?",a:"Thank you for checking before starting — that is exactly the right thing to do. I am not able to advise on medication interactions, but I would be happy to share our full ingredient list so your prescribing physician can review it and give you a definitive answer. I will send that over right now. With health, [Name] - IM8 Customer Experience [QC: Segment 4 — medical conditions (Warfarin is a prescription drug). Provide ingredient list. Direct to prescribing doctor. Never clear or deny use. Escalate CS Lead. Zero medical advice given.]"},
          {t:"tip",v:"Notice what all five ideal responses have in common: they start with the customer's situation, not the policy. Policy comes after empathy, not before it. That sequencing — acknowledge, empathize, then act — is the pattern in every high-scoring IM8 response."},
          {t:"summary",items:["Every scenario follows the QC framework: Accuracy, Tone, Clarity, Efficiency, Records & Notes","Identify the segment first — it tells you the escalation level, policy, and macro to use","Refund check: (1) first order? (2) days since delivery? These two questions prevent 80% of policy errors","Adverse reactions and medical conditions with prescriptions: escalate, provide ingredient list, zero medical advice","Cancellation: always ask for the reason first. Always offer skip/pause/frequency before cancelling."]},
        ],
        check:[
          {q:"In the assessment, what should you do BEFORE writing your response?",options:["Open the macros document","Identify the segment and category using the Decision Tree Master","Check the customer's order history","Send a standard acknowledgment"],correct:1,exp:"Identify the segment first — it tells you the escalation level, which policy applies, and which macro to reference. Never write a response without knowing the segment."},
          {q:"What do all five ideal assessment responses have in common?",options:["They all offer a full refund","They all start by citing the relevant policy","They start with the customer's situation before the policy — acknowledge first, then act","They are all under 100 words"],correct:2,exp:"All high-scoring IM8 responses start with the customer's situation — acknowledge, empathize, then act. Policy comes after empathy, never before it."},
          {q:"A customer mentions they take Warfarin (a blood thinner). You:",options:["Tell them IM8 is generally safe","Use the stacking macro for supplement combos","Reclassify to Segment 4 (medical conditions). Provide ingredient list and direct to their prescribing physician. Escalate CS Lead.","Escalate to VP Ops as a safety issue"],correct:2,exp:"Warfarin is a prescription drug. Reclassify to Segment 4 (medical conditions). Provide ingredient list. Direct to prescribing physician. Escalate CS Lead. Never clear or deny use."},
        ]
      },
      {
        id:"d5l1", title:"Performance Expectations & Going Live",
        content:[
          {t:"video", label:"Part 2 & Section 6 — Probation KPI & Training Activities", dur:"", url:"/videos/Part 2 & Section 6 - Probation KPI & Training Activities.mp4"},
          {t:"video", label:"Part 2 — Schedule for Month 1 & 2", dur:"", url:"/videos/Part 2 - Schedule for Month 1 & 2.mp4"},
          {t:"video", label:"Part 3 — PIC Tasks & Roster", dur:"", url:"/videos/Part 3 - PIC Tasks & Roster.mp4"},
          {t:"h",v:"Your Performance Timeline"},
          {t:"kv",pairs:[
            ["Week 1 goal","Answer 60-70% of standard product and policy questions using templates and knowledge base. Pass your final assessment."],
            ["Week 2-3 goal","85% accuracy in product knowledge. Handle standard tickets independently — escalate only complex cases."],
            ["Week 4-6 goal","All standard and moderately complex tickets independently. Consistent quality and full adherence to tone."],
            ["Ongoing","Maintain quality, adapt to updates, stay current with new FAQs and policy changes."],
          ]},
          {t:"rule",v:"Your QC target is 20+ out of 25. This means scoring mostly 4s (Good) across all five categories. This is the standard for Weeks 2-4. Treat it as the floor, not the ceiling."},
          {t:"h",v:"Probation KPI Targets"},
          {t:"list",items:[
            "Fill in your Daily Sheet on every working day (Aina shares it with you on Slack)",
            "Inbox must be zero by end of every shift",
            "Work tickets oldest to newest",
            "Complete 4 short quizzes per day during training: start of shift, before lunch, after lunch, before end of shift",
            "Save all macros in your own Google Docs template organized by keywords",
            "Create your own SOP notes after going through the SOP sheet and training videos",
          ]},
          {t:"h",v:"Weeks 4-8: PIC Task Progression"},
          {t:"kv",pairs:[
            ["Week 4-5","UA Chat, IG and FB comments, IG DM, FB Messenger, FB review, Skio SMS folder"],
            ["Week 6-7","Week 4-5 tasks + RTS emails, New Shop App Subscription, HK Ops message in Slack"],
            ["Week 8+","Full PIC task list"],
          ]},
          {t:"h",v:"Shadowing"},
          {t:"list",items:["Each new hire observes a senior agent on real tickets","Duration: 30 minutes per session","Frequency: 2 sessions per new hire","Ask your TL to schedule this in your first week — do not wait to be asked"]},
          {t:"h",v:"Your Growth & Feedback"},
          {t:"p",v:"You will receive QC feedback weekly. Review it, ask questions, and focus on the improvement areas identified in your 1-on-1s. Your growth is a partnership between you and your leaders. Do not just close tickets — solve problems."},
          {t:"tip",v:"The Probation KPIs are not a ceiling — they are the minimum. Agents who treat them as the target usually just barely meet them. Agents who treat them as the floor usually exceed them and get promoted faster. Start with the mindset of exceeding, not just completing."},
          {t:"scenario",customer:"Hi, I left a 1-star Trustpilot review because my order was delayed and nobody responded. Now my order has arrived and I actually love the product. I am still a bit frustrated but mostly over it.",hint:"You cannot delete a Trustpilot review. The customer has softened. What is your response and what is the right way to acknowledge the review without pushing them?",response:"Hi [Name], I am genuinely glad your order arrived and that you are loving the product — that means everything to us. I completely understand the frustration with the delay and the lack of response, and I am sorry we let you down at that moment. We read every review and take all feedback seriously. If your experience with the product continues to be positive and you ever feel differently about it, we always appreciate honest updated reviews. But most importantly, we are here whenever you need us. With health, [Name] - IM8 Customer Experience"},
          {t:"summary",items:["Week 1: 60-70% standard questions with templates. Weeks 2-3: 85% accuracy, standard tickets independently","QC target: 20+/25 — treat it as the floor, not the ceiling. Mostly 4s across all 5 categories.","Daily habits: Daily Sheet every day, inbox zero every shift, 4 short quizzes per day during training","PIC task progression: Week 4-5 basics, Weeks 6-7 expanded, Week 8+ full task list","Schedule two shadowing sessions in your first week — ask your TL, do not wait to be invited","QC feedback is weekly — review it, ask questions, focus on the categories where you lose points"]},
        ],
        check:[
          {q:"What is the expected mastery level by end of Week 1?",options:["Handle all tickets independently","85% accuracy in product knowledge","60-70% of standard questions using templates and knowledge base — and pass your final assessment","Full PIC task list"],correct:2,exp:"Week 1 goal: answer 60-70% of standard product and policy questions using templates and the knowledge base. And pass your final assessment."},
          {q:"A QC score of 4 means:",options:["Exceeds expectations with no errors","Meets expectations with very minor issues","Acceptable but improvements needed","Frequent mistakes"],correct:1,exp:"QC 5=Excellent (no errors), 4=Good (minor issues), 3=Fair (improvements needed), 2=Poor (frequent mistakes), 1=Unsatisfactory."},
          {q:"How often do you fill in your Daily Sheet?",options:["Only when you handle escalations","Every working day","Once a week","Only during probation period quizzes"],correct:1,exp:"Fill in your Daily Sheet every working day. Aina shares it with you on Slack."},
        ]
      },
      {
        id:"d5l2", title:"Your First 30 Days",
        content:[
          {t:"h",v:"Week 1 — Learn Fast"},
          {t:"p",v:"Your first week is about building the foundations that everything else runs on. Lean into the intensity. The pace is fast by design — the best way to learn this job is to do it, make mistakes in a supervised environment, and correct them quickly."},
          {t:"list",items:[
            "Lean into the intensity — this week is the hardest, it gets easier",
            "Ask questions openly and often — no question is too basic in Week 1",
            "Attend all shadowing sessions — watch how senior agents think through tickets",
            "Pass your final assessment — the bootcamp ends when you have proven you are ready",
            "Create your own SOP notes — writing it in your own words locks it in",
          ]},
          {t:"h",v:"Weeks 2-4 — Execute Consistently"},
          {t:"p",v:"By Week 2, you are handling real tickets with progressively less supervision. Consistency is the skill being built here. Not doing great work once — doing good work on every ticket, every shift."},
          {t:"list",items:[
            "Attend check-ins and 1-on-1s prepared — bring your questions and your QC feedback",
            "Your goal is to reach 20+ out of 25 for QC scores — mostly 4s across all categories",
            "Do not just close tickets — solve problems. There is a difference.",
            "Review your QC feedback weekly — focus on the specific categories where you lose points",
            "If you are unsure: ask first, act second. One Slack message now saves one mistake later.",
          ]},
          {t:"h",v:"The Team-First Mindset in Practice"},
          {t:"p",v:"Selfless is one of the IM8 values for a reason. This job is not solo work. When you know something useful, share it in the asai channel. When you see a teammate struggling, offer to help. When a tough ticket comes in that you could handle, volunteer. That is how this team wins together."},
          {t:"h",v:"What Good Looks Like at 30 Days"},
          {t:"kv",pairs:[
            ["Ticket handling","Standard tickets resolved independently. Complex cases escalated correctly and promptly."],
            ["QC score","Consistently 20+/25. Identified weak categories improving week over week."],
            ["Documentation","Every ticket tagged correctly, internal notes complete, Refund Sheet updated."],
            ["Communication","Proactive on Slack. Shift check-ins consistent. Questions asked before mistakes are made."],
            ["Attitude","Humble, curious, team-first. Learning from feedback, not defending against it."],
          ]},
          {t:"rule",v:"By completing this bootcamp you have covered the full SOP, every ticket segment, all policies, and the IM8 voice. You know what to do. Trust your training, use your tools, ask for help when unsure, and go make customers feel great."},
          {t:"tip",v:"The agents who thrive at IM8 are not the ones who know the most on Day 1. They are the ones who stay curious, take feedback seriously, and care genuinely about the person on the other side of every ticket. You already have everything you need. Go use it."},
          {t:"scenario",customer:"This is my first order and I am not sure how to mix it. Do I just add water? And how much? I am kind of nervous to get it wrong.",hint:"New customer, simple product question, but they are revealing some anxiety. How do you make them feel confident and welcomed into the IM8 community?",response:"Welcome to the IM8 family — we are so excited for you to start! Mixing it is super simple: add one scoop to 12-16oz of cold water, shake or stir for a few seconds, and you are ready to go. The chocolate acai berry flavor tastes best cold, so feel free to add some ice too. Take it in the morning with or without food — whatever fits your routine. You really cannot get it wrong! Feel free to reach out any time you have questions — we are always here. With health, [Name] - IM8 Customer Experience"},
          {t:"summary",items:["Week 1: lean into the intensity, ask questions, attend shadowing, pass final assessment, create your own SOP notes","Weeks 2-4: consistent 20+/25 QC, standard tickets independently, review weekly feedback, escalate when unsure","Team-first: share knowledge in asai, support teammates, volunteer for tough tickets — this is Selfless in practice","30-day standard: independent on standard tickets, consistent QC, correct documentation, proactive communication","Trust your training. Use your tools. Ask for help when unsure. Go make customers feel great."]},
        ],
        check:[
          {q:"What is the most important thing to do in Week 1?",options:["Handle all tickets independently with no supervision","Ask questions openly and often — no question is too basic in Week 1","Focus only on passing the final assessment","Avoid escalating so you learn from handling tough tickets"],correct:1,exp:"Week 1: lean into the intensity, ask questions openly, attend shadowing sessions, and pass your final assessment. The best way to learn is to do it in a supervised environment."},
          {q:"'Do not just close tickets — solve problems' means:",options:["Take longer on every ticket to be thorough","Process every refund request even if outside policy","Identify the real issue behind a ticket, not just the surface request — and address that","Escalate all tickets to be safe"],correct:2,exp:"Solving problems means addressing the real issue behind the ticket, not just completing a transaction. A customer who says they want to cancel might actually need a subscription pause. Find what they actually need."},
          {q:"The agents who thrive at IM8 are:",options:["The ones who know the most on Day 1","The ones who never need to escalate","The ones who stay curious, take feedback seriously, and genuinely care about the customer","The ones who handle the most tickets per shift"],correct:2,exp:"The best agents are curious, coachable, and genuinely care about the person on the other side of every ticket. Empathy and growth mindset matter more than knowledge on Day 1."},
        ]
      },
    ],
    quiz:[
      {q:"On Graduation Day, what is the primary goal?",options:["Learn the subscription cancellation policy","Prove you can apply Days 1-4 knowledge in real situations","Receive your full ticket load for the first time","Memorize all 29 ticket segments"],correct:1,exp:"Graduation Day is about proving you can apply everything from Days 1-4. No new policy content — it is assessment and coaching."},
      {q:"What is the QC target for Weeks 2-4?",options:["15/25","18/25","20/25","25/25"],correct:2,exp:"Target: 20+ out of 25. Mostly 4s across all five categories. Treat it as the floor, not the ceiling."},
      {q:"How often do you fill in your Daily Sheet?",options:["Only when you handle escalations","Every working day","Once a week","Only during probation quizzes"],correct:1,exp:"Fill in your Daily Sheet every working day. Aina shares it with you on Slack."},
      {q:"By the end of Week 3, you should be able to:",options:["Handle all tickets with zero supervision","Answer 60-70% of standard questions","Handle standard tickets independently with 85% product knowledge accuracy; escalate complex cases","Run the full PIC task list"],correct:2,exp:"End of Week 3: 85% accuracy in product knowledge. Handle standard tickets independently. Escalate only complex or edge cases."},
      {q:"What do all five ideal Graduation Day scenarios have in common?",options:["They all offer a full refund","They all open by citing the relevant policy","They start with the customer's situation — acknowledge first, then policy, then action","They are all under 100 words"],correct:2,exp:"All high-scoring IM8 responses start with the customer's situation. Policy comes after empathy, never before it."},
      {q:"'Do not just close tickets — solve problems' means:",options:["Take longer on every ticket","Process all refund requests","Identify the real issue behind the ticket and address that, not just the surface request","Escalate all complex tickets"],correct:2,exp:"Solving problems means finding the real issue. A customer saying 'cancel' might actually need a subscription pause. Look beneath the surface."},
      {q:"What should you do if you are unsure how to handle a ticket in your first weeks?",options:["Guess and act — learn by doing","Ask in im8-cs or asai with the ticket link before acting","Close the ticket and ask your TL to reassign it","Handle it and review the QC feedback after"],correct:1,exp:"When unsure: ask first, act second. Post in im8-cs with the ticket link and clearly state what you need help with. One Slack message now prevents one mistake later."},
      {q:"Shadowing sessions in your first week should be:",options:["Scheduled by your TL when they are available","Two sessions per new hire — you should ask your TL to schedule them, do not wait","Optional, only if you feel unprepared","One session only, at the start of your first day"],correct:1,exp:"Two shadowing sessions per new hire. Ask your TL to schedule them in your first week — do not wait to be invited."},
    ],
    writing:{
      scenario:"Hi, I have been a customer for 8 months. I take both Essentials and Longevity every day. My subscription renews in 3 days and I actually want to cancel because I feel like the products are not doing anything for me anymore. I have given it a really fair shot.",
      prompt:"You are an IM8 CS quality coach reviewing a cancellation handling response. Customer message: [CUSTOMER]. Trainee response: [RESPONSE]. This is an over-90-day results ticket with a cancellation request. Mandatory elements to check: (1) Did they ask for the reason? (2) Did they validate the customer genuinely before any save attempt? (3) Was there only ONE save attempt or did they push multiple times? (4) If the customer seemed firm, did they cancel respectfully without guilt? Grade out of 10. Start with SCORE: X/10 on its own line, then 3-4 sentences covering what they did well and what they must improve, referencing the Cancellation Decision Tree."
    }
  },
];

// ─── AI Helper ────────────────────────────────────────────────────────────────
async function callClaude(systemPrompt, messages, maxTokens = 600) {
  const res = await fetch("/api/llm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ system: systemPrompt, messages, maxTokens }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `API error ${res.status}`);
  }
  const data = await res.json();
  return data.text;
}

// ─── System Prompts ───────────────────────────────────────────────────────────
const ASK_SYSTEM = buildAskLumaSystem();

// eslint-disable-next-line no-unused-vars
const ASK_SYSTEM_LEGACY = [
  "You are an expert CX training assistant. Help new agents learn to handle every type of customer ticket correctly.",
  "Always teach using real SOPs. When showing example responses, write in the LUMÉ CX voice: warm, confident, direct, short sentences, human empathy, no corporate jargon.",
  "Sign every example response with: [Agent name] - LUMÉ CX",

  "=== 3 GUIDING PRINCIPLES ===",
  "1. Empathetic Ownership: own the problem until resolved, measured by CSAT/NPS/Trustpilot.",
  "2. Effortless Resolution: solve quickly and completely with minimal back and forth.",
  "3. Root Cause Mindset: cancellation is often dissatisfaction not the real goal — find the underlying issue first.",

  "=== PRODUCTS ===",
  "THREE PRODUCT LINES: (1) Daily Ultimate Essentials PRO, (2) Daily Ultimate Longevity, (3) The Beckham Stack (bundled: Essentials PRO + Longevity Set).",
  "FORMAT: Stick packs / sachet packs ONLY, 30 per pack. No pouches or capsules — discontinued.",
  "SUBSCRIPTIONS: 30-day or 90-day subscription, or one-time purchase.",
  "Essentials PRO: stick packs 92 ingredients 13.6g 20cal, MSM 1500mg Saffron 30mg (PRO EXCLUSIVE), CRT8 100mg CoQ10 100mg Vitamin K2 100mcg 10B CFU probiotics, NSF Certified for Sport. Pricing: $112 OTP, $89/month (30-day sub), $235/quarter (90-day sub).",
  "Essentials PRO dietary attributes: Vegan, Gluten-Free, Soy-Free, Dairy-Free, No Artificial Sweeteners, Non-GMO.",
  "Essentials PRO FLAVORS (Essentials PRO only — Longevity has no flavor variants): Acai+Berry (original), Mango+Passionfruit (new), Lemon+Orange (new), Variety Pack (all three).",
  "Essentials PRO approved structure/function claims (ONLY say these — never go beyond): Supports Joint Comfort and Mobility | Promotes a Positive Mood and Cognitive Function | Supports Healthy Energy Levels and Performance | Aids in Exercise Recovery | Supports a Healthy Immune System | Supports Digestive Health | Provides Antioxidant Support | Supports Bone and Cardiovascular Health | Supports Healthy Skin, Hair, and Nails.",
  "Longevity: stick packs 7.8g 15cal, NMN 300mg Glycine 3g Taurine 2g Resveratrol 250mg Quercetin 250mg Fisetin 100mg Dihydroberberine 100mg Spermidine 3mg PQQ 10mg, single flavor (no variants), targets all 12 hallmarks of aging.",
  "Longevity pricing: $149 OTP, $119/month (30-day new sub), $312/quarter (90-day new sub), $89/month grandfathered (existing subs — protected permanently).",
  "Beckham Stack pricing: $261 OTP, $208/month (30-day sub), $548/quarter (90-day sub).",
  "NSF Sport for Longevity Powder: PENDING — NEVER confirm it. This is a legal risk.",
  "Beckham Stack: Essentials PRO + Longevity Set bundled — both can be mixed in same glass. Discontinued: Original Essentials V1, Longevity Capsules, pouch/capsule formats.",
  "No DHA/EPA in any current products — recommend separate omega-3 if asked.",

  "=== CRITICAL RULES — NEVER BREAK ===",
  "NEVER give medical advice, diagnose, or suggest treatments. For any medical/medication question: share ingredient list and refer to their prescribing physician.",
  "NEVER offer free samples. Decline clearly: we do not offer free samples currently.",
  "NEVER apologize for a delayed reply — start with the answer directly.",
  "NEVER proactively mention refunds — only discuss if customer raises it.",
  "Trustpilot link: ONLY when message is 100% positive with zero negatives. Any complaint disqualifies.",

  "=== ESCALATION RULES ===",
  "VP Ops: adverse reactions (any negative health effect — stop all chat, 100% refund, log in Adverse Reaction Report).",
  "CS Manager: product quality safety concern (foreign objects, contamination).",
  "CS Lead: medical conditions, over-90-day results, texture quality, excess product, all cancellations, partnerships.",
  "Do NOT give medical advice for adverse reactions — only stop use, express empathy, process refund, refer to doctor.",

  "=== POLICIES ===",
  "30-day guarantee: first orders only, opened or unopened, within 30 days of delivery, customer pays return shipping.",
  "31-60 days: escalate to CS Lead — can give 50% or 100% at Lead discretion. 61+ days: ineligible.",
  "Shipping times: US 6 days, UK 7 days, SG 5 days, HK 4 days, AU 7 days, CA 16 days.",
  "Free shipping on subscriptions worldwide EXCEPT Norway/Switzerland $15 flat; Israel/Saudi/UAE at checkout.",
  "Delay compensation triggers (from fulfillment): US 4-6 BD, UK 5-7 BD, APAC 6-8 BD, Europe 15-17 BD.",
  "Active sub delay first touch: free 6-pack Essentials with next order + ask to wait. OTP delay first touch: 10% refund + ask to wait.",
  "Lost package: confirm address, check neighbors/building, 24hr wait, then free replacement. Second claim in 12 months: escalate to Head of CX.",
  "Damaged product: request photo evidence first, then free replacement — no return needed.",
  "Unfulfilled 4-6 BD: 50% refund. Unfulfilled 7+ BD: 100% refund. Never cancel unless customer requests.",
  "Subscription: customers can pause, skip, change frequency, or cancel via Skio portal anytime.",

  "=== CANCELLATION RULES ===",
  "ALWAYS ask for the reason before cancelling using cancellation macro.",
  "ONE save attempt maximum per reason — never push after it is declined.",
  "Cancel immediately (no save): adverse reactions, medical conditions, pregnancy concerns.",
  "Strong save opportunity: excess product (offer skip/pause), price (offer downgrade/frequency), sub adjustment.",
  "Always cancel respectfully if customer insists — never make cancellation difficult.",

  "=== DECISION TREE SEGMENTS ===",
  "Seg 1 safety-adverse: escalate VP Ops, 100% refund, stop all conversation.",
  "Seg 2 safety-GI: educate probiotics/enzymes, normalize, suggest monitoring, cancel if insist.",
  "Seg 3 safety-athletes: reassure NSF cert + 3rd party testing.",
  "Seg 4 safety-medical: share ingredients, refer to doctor, escalate CS Lead.",
  "Seg 5 safety-pregnancy/age: share ingredients, refer to OB/doctor, no save attempt.",
  "Seg 6 product-quality-safety: escalate CS Manager, photo+batch required, 100% refund+replace.",
  "Seg 7 product-quality-texture: escalate CS Lead, 100% replace, advise discard.",
  "Seg 8 product-quality-damage: photo evidence, free replace, partial/full refund by severity.",
  "Seg 9 product-quality-cosmetic: explain natural variation (orange=astaxanthin), offer replace if uncomfortable.",
  "Seg 10 product-timing/dosage: one clear default (once daily morning with water), consistency matters most.",
  "Seg 11 product-certifications: NSF Certified for Sport Essentials PRO, 3rd-party tested, science page im8health.com/pages/science.",
  "Seg 12 product-stacking: Beckham Stack or split, both can mix in same glass.",
  "Seg 13 product-interactions: basic combos use stacking macros; prescription drugs = reclassify as Seg 4.",
  "Seg 14 product-ingredients: provide ingredient list, refer to dossiers for detail.",
  "Seg 15 product-taste: normalize, offer mixing tips (more water, colder water, smoothie, frother), 30-day guarantee.",
  "Seg 16 results-under90: educate 90-day curve, normalize, one save attempt for soft tone.",
  "Seg 17 results-over90: escalate CS Lead, validate, cancel if firm.",
  "Seg 18 value-price: frame value, offer downgrade to Essentials only or lower frequency.",
  "Seg 19 value-competitors: explain 12 hallmarks of aging, NSF, clinical data — no competitor attacks.",
  "Seg 20 shipping-wrong-address: if not shipped update address; if shipped attempt reroute.",
  "Seg 21 shipping-delays: check Aftership first, set expectations per delay policy.",
  "Seg 22 shipping-missing: confirm address, check neighbors, 24hr wait, then replace.",
  "Seg 23 shipping-wrong-order: acknowledge, send correct immediately, customer keeps wrong item.",
  "Seg 24 shipping-inquiry: quote actual country timelines, guarantee starts on delivery not order date.",
  "Seg 25 sub-excess: offer skip/pause/frequency extension first — high save category.",
  "Seg 26 sub-change/pause: offer adjustment, only cancel if clearly insist.",
  "Seg 27 sub-inquiry: answer directly, explain Skio portal, no upsell.",
  "Seg 28 cancellation: ask reason first, use DT, one save attempt, cancel respectfully if firm.",
  "Seg 29 partnerships: request contact info, escalate to Sam.",
].join(" ");

const SIM_CUSTOMER_SYSTEM = [
  "You are a customer of IM8 supplements. Stay in character. Be realistic and skeptical but not abusive.",
  "Keep responses to 1-2 sentences.",
  "If the agent gives an excellent answer that fully addresses your concern, soften or express satisfaction.",
].join(" ");

const SIM_COACH_SYSTEM = [
  "You are an IM8 CS training coach reviewing an agent-in-training responses.",
  "Give 2-3 sentences of specific, actionable feedback.",
  "Reference actual IM8 products, policies, or tone guidelines.",
  "Always mention one thing done well and one concrete improvement.",
  "Be encouraging but honest.",
].join(" ");

const TICKET_SYSTEM = [
  "You are an AI assistant helping IM8 CS agents handle live customer tickets. Your job is to generate a ready-to-send customer reply and internal action steps.",
  "OUTPUT FORMAT — always use these exact delimiters:",
  "CATEGORY: [Safety|Product|Results|Value|Shipping|Subscription|Admin]",
  "PRIORITY: [P1|P2|P3]",
  "ESCALATE_TO: [VP Ops|CS Manager|CS Lead|none]",
  "---REPLY---",
  "[reply text, 80-150 words, IM8 voice, signed off correctly]",
  "---END REPLY---",
  "---STEPS---",
  "1. [internal step naming specific tool]",
  "---END STEPS---",
  "PRIORITY DEFINITIONS: P1 = adverse reaction, safety concern, legal threat, media threat. P2 = refund over $100, cancellation save attempt, CS escalation needed. P3 = everything else.",
  "ESCALATION RULES: VP Ops = adverse reaction / legal / regulatory / media. CS Manager = social media threat / product quality issue / repeat complaint (3+ contacts). CS Lead = results complaint over 90 days. If no escalation needed, write 'none'.",
  "PRODUCTS:",
  "IM8 Essentials PRO: 92 ingredients, 20 calories, 13.6g serving, $112 one-time / $89 subscribe / $235 3-pack. Flavors: Acai+Berry, Mango+Passionfruit, Lemon+Orange, Variety Pack. NSF Certified for Sport. Contains MSM (1,500mg) and Saffron 30mg (PRO exclusive), not NMN. Dietary: Vegan, Gluten-Free, Soy-Free, Dairy-Free, No Artificial Sweeteners, Non-GMO. Approved claims: Supports Joint Comfort and Mobility; Promotes Positive Mood and Cognitive Function; Supports Healthy Energy and Performance; Aids Exercise Recovery; Supports Immune System; Supports Digestive Health; Provides Antioxidant Support; Supports Bone and Cardiovascular Health; Supports Healthy Skin, Hair and Nails.",
  "IM8 Longevity: NMN 300mg, NR 200mg, Resveratrol, CoQ10, Astaxanthin. $149 one-time / $119 new subscriber / $89 grandfathered subscriber / $312 3-pack. NSF PENDING — do NOT tell customers it is NSF certified.",
  "Beckham Stack (PRO + Longevity): $261 one-time / $208 subscribe / $548 3-pack.",
  "POLICIES:",
  "30-day satisfaction guarantee: full refund if contacted within 30 days of delivery, one claim per household per product, no return required.",
  "Shipping: USA 5-7 business days, Canada 7-14 BD, UK/Europe 7-14 BD, Australia/NZ 10-21 BD, Rest of world 14-21 BD.",
  "Shipping delays (4-6 BD over standard): offer one free 6-pack as compensation, do not offer refund proactively.",
  "Lost package: reship after 15 BD USA / 30 BD international if tracking not updated.",
  "Damaged package: photo required, reship or refund depending on severity.",
  "NON-NEGOTIABLES: never give medical advice or diagnose. Never offer free samples. Never apologise for a shipping delay — acknowledge and compensate with 6-pack only. Never proactively mention refunds for shipping issues. Do not ask customers to leave Trustpilot reviews. NSF for Longevity is PENDING — never claim it is certified.",
  "LIABILITY RULES — CRITICAL: NEVER connect the product to any symptom or health issue in the customer reply. NEVER say 'these reactions', 'your body is responding this way', 'the product caused', or any phrase that implies causation. NEVER lead with negative language or anything that admits fault. If a customer mentions feeling unwell, say you are sorry to hear they are not feeling their best — NOT that you are sorry to hear about reactions to the product. Always recommend speaking to a GP as a general health precaution, NOT because IM8 is responsible. The internal escalation note can be direct, but the customer-facing reply must NEVER imply the product harmed them.",
  "IM8 VOICE: warm, confident, direct, short sentences, human empathy, no corporate jargon. Never say 'I apologise for any inconvenience'. Never say 'rest assured'. Always lead with warmth, never with a negative or an admission.",
  "SIGN-OFF: if agent name is provided, sign off as that name. Otherwise sign off as 'The IM8 Team'.",
  "INTERNAL STEPS QUALITY: always name the specific tool — Gorgias (ticket tagging/closing), Shopify (order lookup/refund), Skio (subscription management), Aftership (tracking lookup), Slack (escalation messages). Always include a step to tag and close the Gorgias ticket. If escalating, include: 'Slack [person] with order number and issue summary.'",
  "DECISION TREE KNOWLEDGE:",
  "Seg 1 safety/adverse: P1, escalate VP Ops. Customer reply: open with warmth ('Sorry to hear you're not feeling your best'), recommend speaking to a GP as a general precaution, do NOT connect the product to the symptoms, do NOT use the word 'reaction' or 'adverse', do NOT diagnose. Then immediately offer a full refund — do NOT make them come back after seeing their doctor. Close warmly. Example flow: express care → recommend GP → confirm we are processing a full refund → no further action needed from them.",
  "Seg 2 no results <30 days: validate realistic expectations, 90-day protocol, offer support.",
  "Seg 3 no results 30-90 days: ask about consistency/diet/sleep, offer tips.",
  "Seg 4 no results 90+ days: escalate CS Lead, one-time goodwill offer consideration.",
  "Seg 5 taste: acknowledge, suggest mixing tips, mention flavors.",
  "Seg 6 mixing issues: suggest blender bottle, cold water, 1 scoop test.",
  "Seg 7 product questions: use product knowledge, never make medical claims.",
  "Seg 8 ingredient questions: answer factually, no medical advice.",
  "Seg 9 comparison: use Compare framework — always compliment before differentiating.",
  "Seg 10 refund <30 days: verify eligibility, process in Shopify, confirm via email.",
  "Seg 11 refund >30 days: CS Manager approval required.",
  "Seg 12 damaged: photo proof required, reship or refund.",
  "Seg 13 wrong item: apologise, reship correct item immediately.",
  "Seg 14 missing item: check order, reship ASAP.",
  "Seg 15 not received USA <15BD: check Aftership, reassure, advise to wait.",
  "Seg 16 not received USA 15+ BD: reship.",
  "Seg 17 not received intl <30 BD: check Aftership, advise to wait.",
  "Seg 18 not received intl 30+ BD: reship.",
  "Seg 19 tracking stalled: check carrier, reship if over threshold.",
  "Seg 20 delay complaint: acknowledge, offer 6-pack compensation (no apology for delay).",
  "Seg 21 promo/discount: apply valid codes, cannot stack, no exceptions.",
  "Seg 22 billing error: check Shopify, correct promptly.",
  "Seg 23 payment fail: advise update card in Skio/account.",
  "Seg 24 sub-cancel save: ask reason, offer skip/pause/frequency change first.",
  "Seg 25 sub-excess: offer skip/pause/frequency extension first.",
  "Seg 26 sub-change/pause: offer adjustment, only cancel if clearly insist.",
  "Seg 27 sub-inquiry: answer directly, explain Skio portal.",
  "Seg 28 cancellation: ask reason, use decision tree, one save attempt, cancel respectfully if firm.",
  "Seg 29 partnerships: collect contact info, escalate to Sam.",
].join(" ");

// ─── Utility ──────────────────────────────────────────────────────────────────
function diffColor(d) {
  if (d === "Easy")   return "#2a7a2a";
  if (d === "Medium") return GOLD;
  return RED;
}

function cellStyle(val, isDiscontinued) {
  const base = {
    fontFamily: F.sans, fontSize: 13,
    padding: "8px 12px", borderBottom: "1px solid #eee",
  };
  if (isDiscontinued) base.opacity = 0.5;
  if (!val || val === "none") return { ...base, color: "#ccc" };
  if (val.includes("All 12") || val.includes("increased")) return { ...base, color: RED, fontWeight: "700" };
  if (val.includes("exclusive")) return { ...base, color: GOLD, fontWeight: "700" };
  if (val === "confirmed") return { ...base, color: "#2a7a2a", fontWeight: "700" };
  return base;
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App({ userId, role, displayName }) {
  // ── "View as" preview override (Cherie May 21, for Loom recordings) ──
  // Owner/Admin/Manager can temporarily render the hub as if they were
  // any lower-rank role — e.g. "View as Agent" before recording a
  // training video. Purely presentational; API role gates still see
  // the real Clerk role, so no actions break. Persisted in localStorage
  // so a refresh doesn't kick you out mid-recording. A banner appears
  // at the top while the override is active so you can't forget to reset.
  const [viewAsRole, setViewAsRole] = useState(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = window.localStorage.getItem("luma_view_as_role");
      if (stored) setViewAsRole(stored);
    } catch { /* ignore localStorage errors */ }
  }, []);
  function updateViewAsRole(next) {
    setViewAsRole(next);
    try {
      if (next) window.localStorage.setItem("luma_view_as_role", next);
      else window.localStorage.removeItem("luma_view_as_role");
    } catch { /* ignore */ }
  }
  // Only allow overrides to roles strictly LOWER than the actual role —
  // no escalation from this UI.
  const canPreviewAs = role && ["Manager", "Admin", "Owner"].includes(role);
  const effectiveRole = viewAsRole || role;

  const [tab, setTab] = useState(effectiveRole === "Ops" ? "Logs" : "Home");

  // Deep-link from email: parse #records:issues style hashes on mount and
  // jump straight to the right tab. RecordsTab reads the same hash to set
  // its sub-tab. We only read on mount — navigating around the app
  // doesn't push to URL, so the hash bar stays clean once you're in.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash.replace(/^#/, "").trim();
    if (!hash) return;
    const tabPart = hash.split(":")[0];
    const valid = ["Home", "Insights", "Reports", "Logs", "Records", "Playbook", "Affiliates", "Ask LUMÉ", "Training", "Quiz", "Progress"];
    const matched = valid.find((v) => v.toLowerCase() === tabPart.toLowerCase());
    if (matched) setTab(matched);
  }, []);

  // Player
  const [playerName, setPlayerName] = useState("");
  const [nameInput,  setNameInput]  = useState("");
  const [showName,   setShowName]   = useState(false);
  const [showLB,     setShowLB]     = useState(false);

  // Quiz
  const [selMod,        setSelMod]        = useState(null);
  const [qIdx,          setQIdx]          = useState(0);
  const [chosen,        setChosen]        = useState(null);
  const [answers,       setAnswers]       = useState([]);
  const [totalScore,    setTotalScore]    = useState(0);
  const [completed,     setCompleted]     = useState([]);
  const [sessionScores, setSessionScores] = useState({});

  // Ask LUMÉ
  const [chatMsgs,    setChatMsgs]    = useState([{ role:"assistant", content:"Hi team — I'm here for the 'what do I do here?' moments. Policies, tricky situations, what to write back, when to escalate. If I don't know something, I'll tell you and point you to your TL or Head of CX." }]);
  const [chatInput,   setChatInput]   = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Simulate
  const [selScen,     setSelScen]     = useState(null);
  const [simMsgs,     setSimMsgs]     = useState([]);
  const [simInput,    setSimInput]    = useState("");
  const [simLoading,  setSimLoading]  = useState(false);
  const [simFeedback, setSimFeedback] = useState("");
  const [simDone,     setSimDone]     = useState(false);
  const [agentTurns,  setAgentTurns]  = useState(0);
  const simEndRef = useRef(null);

  // Bootcamp
  const [bcProgress,      setBcProgress]      = useState(() => { try { return JSON.parse(localStorage.getItem(BC_KEY) || "{}"); } catch(e) { return {}; } });
  const [bcView,          setBcView]          = useState("overview"); // overview | day | lesson | check | quiz | writing | graduation
  const [bcDay,           setBcDay]           = useState(null);
  const [bcLesson,        setBcLesson]        = useState(null);
  const [bcQIdx,          setBcQIdx]          = useState(0);
  const [bcChosen,        setBcChosen]        = useState(null);
  const [bcAnswers,       setBcAnswers]       = useState([]);
  const [bcWriteInput,    setBcWriteInput]    = useState("");
  const [bcWriteFeedback, setBcWriteFeedback] = useState("");
  const [bcWriteLoading,  setBcWriteLoading]  = useState(false);
  const [bcWriteDone,     setBcWriteDone]     = useState(false);

  // Leaderboard
  const [leaderboard, setLeaderboard] = useState([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const lb = JSON.parse(localStorage.getItem(LB_KEY) || "[]");
      setLeaderboard(lb);
    } catch(e) {}
    try {
      const saved = JSON.parse(localStorage.getItem("luma_cx_state") || "{}");
      if (saved.playerName)    setPlayerName(saved.playerName);
      if (saved.totalScore !== undefined) setTotalScore(saved.totalScore);
      if (saved.completed)     setCompleted(saved.completed);
      if (saved.sessionScores) setSessionScores(saved.sessionScores);
    } catch(e) {}
  }, []);

  // Persist state
  useEffect(() => {
    try {
      localStorage.setItem("luma_cx_state", JSON.stringify({ playerName, totalScore, completed, sessionScores }));
    } catch(e) {}
  }, [playerName, totalScore, completed, sessionScores]);

  // Scroll chat to bottom
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior:"smooth" }); }, [chatMsgs]);
  useEffect(() => { simEndRef.current?.scrollIntoView({ behavior:"smooth" }); }, [simMsgs, simFeedback]);

  // ── Leaderboard save ──────────────────────────────────────────────────────
  function saveLB(name, score, mods) {
    try {
      const lb = JSON.parse(localStorage.getItem(LB_KEY) || "[]");
      const idx = lb.findIndex(e => e.name === name);
      const entry = { name, score, mods };
      if (idx >= 0) lb[idx] = entry;
      else lb.push(entry);
      lb.sort((a,b) => b.score - a.score);
      const top = lb.slice(0,20);
      localStorage.setItem(LB_KEY, JSON.stringify(top));
      setLeaderboard(top);
    } catch(e) {}
  }

  // ── Quiz Logic ────────────────────────────────────────────────────────────
  function startMod(idx) {
    setSelMod(idx);
    setQIdx(0);
    setChosen(null);
    setAnswers([]);
  }

  function pickAnswer(i) {
    if (chosen !== null) return;
    setChosen(i);
    setAnswers(prev => [...prev, { chosen: i, correct: MODULES[selMod].questions[qIdx].correct }]);
  }

  function nextQ() {
    const mod = MODULES[selMod];
    if (qIdx + 1 < mod.questions.length) {
      setQIdx(q => q + 1);
      setChosen(null);
    } else {
      finishMod();
    }
  }

  function finishMod() {
    const mod = MODULES[selMod];
    const allAnswers = [...answers];
    const finalScore = allAnswers.filter(a => a.chosen === a.correct).length;

    const newSession  = { ...sessionScores, [mod.id]: finalScore };
    const newCompleted = completed.includes(mod.id) ? completed : [...completed, mod.id];
    const newTotal    = Object.values(newSession).reduce((s,v) => s+v, 0);

    setSessionScores(newSession);
    setCompleted(newCompleted);
    setTotalScore(newTotal);
    if (playerName) saveLB(playerName, newTotal, newCompleted.length);

    setSelMod(null);
    setQIdx(0);
    setChosen(null);
    setAnswers([]);
  }

  // ── Ask LUMÉ Logic ────────────────────────────────────────────────────────
  async function sendChat() {
    if (!chatInput.trim() || chatLoading) return;
    const userMsg = { role:"user", content: chatInput.trim() };
    const newMsgs = [...chatMsgs, userMsg];
    setChatMsgs(newMsgs);
    setChatInput("");
    setChatLoading(true);
    try {
      const history = newMsgs.map(m => ({ role: m.role, content: m.content }));
      const reply = await callClaude(ASK_SYSTEM, history);
      setChatMsgs(prev => [...prev, { role:"assistant", content: reply }]);
    } catch(e) {
      setChatMsgs(prev => [...prev, { role:"assistant", content: "Error: " + e.message }]);
    }
    setChatLoading(false);
  }

  // ── Simulate Logic ────────────────────────────────────────────────────────
  function startScen(scen) {
    setSelScen(scen);
    setSimMsgs([{ role:"customer", content: scen.customerMsg }]);
    setSimInput("");
    setSimFeedback("");
    setSimDone(false);
    setAgentTurns(0);
  }

  async function sendSim() {
    if (!simInput.trim() || simLoading || simDone) return;
    const agentMsg = { role:"agent", content: simInput.trim() };
    const newMsgs  = [...simMsgs, agentMsg];
    setSimMsgs(newMsgs);
    setSimInput("");
    setSimLoading(true);
    const newTurns = agentTurns + 1;
    setAgentTurns(newTurns);

    try {
      const custHistory = newMsgs.map(m => ({
        role: m.role === "agent" ? "user" : "assistant",
        content: m.content
      }));
      const custReply = await callClaude(
        SIM_CUSTOMER_SYSTEM + " Scenario: " + selScen.customerMsg,
        custHistory
      );
      const withCust = [...newMsgs, { role:"customer", content: custReply }];
      setSimMsgs(withCust);

      if (newTurns >= 2) {
        const transcript = withCust.map(m => m.role.toUpperCase() + ": " + m.content).join("\n");
        const coachReply = await callClaude(
          SIM_COACH_SYSTEM,
          [{ role:"user", content: "Review this CS training simulation:\n" + transcript }]
        );
        setSimFeedback(coachReply);
        setSimDone(true);
      }
    } catch(e) {
      setSimMsgs(prev => [...prev, { role:"customer", content: "Error: " + e.message }]);
    }
    setSimLoading(false);
  }

  // ── Bootcamp Progress Save ────────────────────────────────────────────────
  function saveBcProgress(updated) {
    setBcProgress(updated);
    try { localStorage.setItem(BC_KEY, JSON.stringify(updated)); } catch(e) {}
  }

  async function submitWritingExercise() {
    if (!bcWriteInput.trim() || bcWriteLoading) return;
    setBcWriteLoading(true);
    const dayData = BOOTCAMP_DAYS[bcDay - 1];
    const sysPrompt = dayData.writing.prompt
      .replace("[CUSTOMER]", dayData.writing.scenario)
      .replace("[RESPONSE]", bcWriteInput.trim());
    try {
      const fb = await callClaude(sysPrompt, [{ role:"user", content:"Please evaluate this response now." }]);
      setBcWriteFeedback(fb);
      setBcWriteDone(true);
      const updated = { ...bcProgress, [bcDay]: { ...(bcProgress[bcDay] || {}), writingDone: true } };
      saveBcProgress(updated);
    } catch(e) {
      setBcWriteFeedback("Error: " + e.message);
    }
    setBcWriteLoading(false);
  }

  // ── Save Name ─────────────────────────────────────────────────────────────
  function saveName() {
    if (!nameInput.trim()) return;
    const n = nameInput.trim();
    setPlayerName(n);
    setShowName(false);
    setNameInput("");
    saveLB(n, totalScore, completed.length);
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: F.sans, background: CREAM, minHeight: "100vh" }}>

      {/* "View as" preview banner — sticky above the header so it's
          impossible to forget you're in preview mode while recording. */}
      {viewAsRole && (
        <div style={{
          background: RED, color: W,
          padding: "8px 24px",
          fontFamily: F.sans, fontSize: 12, fontWeight: 700, letterSpacing: 1,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          position: "sticky", top: 0, zIndex: 101,
        }}>
          <span>👁  Preview mode — viewing as <strong>{viewAsRole}</strong> (your real role is {role}). Permissions unchanged.</span>
          <button
            onClick={() => updateViewAsRole(null)}
            style={{
              background: W, color: RED,
              border: "none",
              fontFamily: F.sans, fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase",
              padding: "4px 10px", borderRadius: 4, cursor: "pointer",
            }}
          >
            Reset to my role
          </button>
        </div>
      )}

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <div id="luma-app-header" style={{ background: W, position: "sticky", top: viewAsRole ? 36 : 0, zIndex: 100, borderBottom: "1px solid #DDD8CE" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 24px 10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/favicon.svg" alt="" width={22} height={22} style={{ display: "block" }} />
            <div>
              <div style={{ fontFamily: F.sans, fontWeight: 700, fontSize: 16, color: BURG, letterSpacing: 3 }}>LUMÉ CX</div>
              <div style={{ fontFamily: F.sans, fontSize: 8, color: GOLD, opacity: 0.9, letterSpacing: 2.5, textTransform: "uppercase", fontWeight: 700 }}>CX Hub</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* "View as" preview selector — Manager/Admin/Owner only.
                Lets Cherie record a Loom from the Agent perspective. */}
            {canPreviewAs && (
              <select
                value={viewAsRole || ""}
                onChange={(e) => updateViewAsRole(e.target.value || null)}
                title="Preview the hub as if you were this role. Purely visual — your real permissions are unchanged."
                style={{
                  fontFamily: F.sans, fontSize: 10, fontWeight: 700,
                  letterSpacing: 1.5, textTransform: "uppercase",
                  padding: "4px 10px",
                  border: "1px solid " + (viewAsRole ? RED : SOFT_BORDER),
                  background: viewAsRole ? "#fee" : W,
                  color: viewAsRole ? RED : INK,
                  borderRadius: 99, cursor: "pointer", outline: "none",
                }}
              >
                <option value="">View as: my role</option>
                <option value="New Starter">View as: New Starter</option>
                <option value="Agent">View as: Agent</option>
                <option value="Ops">View as: Ops</option>
                <option value="Lead Agent">View as: Lead Agent</option>
                <option value="Manager">View as: Manager</option>
                {role === "Owner" && (
                  <option value="Admin">View as: Admin</option>
                )}
              </select>
            )}
            {effectiveRole && (
              <span style={{ fontFamily: F.sans, fontSize: 10, color: GOLD, letterSpacing: 2, textTransform: "uppercase", fontWeight: 700, padding: "4px 10px", border: "1px solid " + GOLD, borderRadius: 99 }}>{effectiveRole}</span>
            )}
            <UserButton afterSignOutUrl="/sign-in" />
          </div>
        </div>
        <div style={{ display: "flex", overflowX: "auto", padding: "0 16px" }}>
          {TABS.filter(t => {
            // Hidden until those features are ready — flip individual entries
            // to false to surface them again.
            const HIDDEN = { "Ask LUMÉ": false, "Playbook": false, "Training": true, "Affiliates": true };
            if (HIDDEN[t]) return false;
            // Ops sees a focused view: only Home + Logs
            if (effectiveRole === "Ops") return t === "Home" || t === "Logs";
            if (t === "Logs") return effectiveRole !== "New Starter";
            if (t === "Reports") return effectiveRole && ["Lead Agent","Manager","Admin","Owner"].includes(effectiveRole);
            if (t === "Records") return effectiveRole && ["Manager","Admin","Owner"].includes(effectiveRole);
            // Affiliates playbook — Manager and above (Cherie May 22:
            // bumped from Lead Agent+ to Manager+ while the workstream
            // is being re-scoped with a dedicated owner; Lead Agents
            // shouldn't see it for now either).
            if (t === "Affiliates") return effectiveRole && ["Manager","Admin","Owner"].includes(effectiveRole);
            // Team management — Admin + Owner only
            if (t === "Team") return effectiveRole && ["Admin","Owner"].includes(effectiveRole);
            return true;
          }).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ background: "transparent", border: "none", borderBottom: tab === t ? "2px solid " + BURG : "2px solid transparent", color: tab === t ? BURG : "rgba(10,10,9,0.38)", fontFamily: F.sans, fontSize: 12, fontWeight: tab === t ? 700 : 500, padding: "12px 16px", cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.15s", letterSpacing: 1 }}>{t}</button>
          ))}
        </div>
      </div>

      {/* ── MAIN CONTENT ───────────────────────────────────────────────── */}
      {tab === "Home"     && <HomeTab     displayName={displayName} setTab={setTab} role={effectiveRole} />}
      {tab === "Insights" && <InsightsTab role={effectiveRole} />}
      {tab === "Logs"     && <LogsTab role={effectiveRole} />}
      {tab === "Reports"  && <ReportsTab role={effectiveRole} />}
      {tab === "Records"  && <RecordsTab role={effectiveRole} />}
      {tab === "Playbook"   && <PlaybookTab   role={effectiveRole} />}
      {tab === "Team"       && <TeamTab       role={effectiveRole} />}
      {tab === "Ask LUMÉ"  && <AskTab      chatMsgs={chatMsgs} chatInput={chatInput} setChatInput={setChatInput} chatLoading={chatLoading} sendChat={sendChat} chatEndRef={chatEndRef} />}
      {tab === "Training" && <TrainingTab
        bcProgress={bcProgress} saveBcProgress={saveBcProgress} bcView={bcView} setBcView={setBcView}
        bcDay={bcDay} setBcDay={setBcDay} bcLesson={bcLesson} setBcLesson={setBcLesson}
        bcQIdx={bcQIdx} setBcQIdx={setBcQIdx} bcChosen={bcChosen} setBcChosen={setBcChosen}
        bcAnswers={bcAnswers} setBcAnswers={setBcAnswers}
        bcWriteInput={bcWriteInput} setBcWriteInput={setBcWriteInput}
        bcWriteFeedback={bcWriteFeedback} bcWriteLoading={bcWriteLoading}
        bcWriteDone={bcWriteDone} setBcWriteDone={setBcWriteDone}
        setBcWriteFeedback={setBcWriteFeedback} submitWritingExercise={submitWritingExercise}
        playerName={playerName}
        selMod={selMod} setSelMod={setSelMod} qIdx={qIdx} chosen={chosen} answers={answers}
        sessionScores={sessionScores} completed={completed} startMod={startMod}
        pickAnswer={pickAnswer} nextQ={nextQ} finishMod={finishMod}
        selScen={selScen} setSelScen={setSelScen} simMsgs={simMsgs} simInput={simInput}
        setSimInput={setSimInput} simLoading={simLoading} simFeedback={simFeedback}
        simDone={simDone} sendSim={sendSim} startScen={startScen} simEndRef={simEndRef}
        totalScore={totalScore} setTab={setTab}
      />}

      {/* ── LEADERBOARD MODAL ──────────────────────────────────────────── */}
      {showLB && (
        <div style={{ position: "fixed", inset: 0, background: CREAM, zIndex: 200, display: "flex", flexDirection: "column" }}>
          <div style={{ background: HEADER_GRAD, padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontFamily: F.serif, fontSize: 22, color: W, fontWeight: 600 }}>Leaderboard</div>
            <button onClick={() => setShowLB(false)} style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.4)", color: W, fontFamily: F.sans, fontSize: 13, padding: "6px 14px", borderRadius: 4, cursor: "pointer" }}>Close</button>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
            {leaderboard.length === 0 && (
              <div style={{ textAlign: "center", color: "#999", fontFamily: F.sans, marginTop: 40 }}>No scores yet. Complete a quiz to get on the board!</div>
            )}
            {leaderboard.map((e, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", background: e.name === playerName ? "rgba(164,0,17,0.08)" : W, border: e.name === playerName ? "2px solid " + RED : "1px solid #e0d9d0", borderRadius: 8, padding: "12px 16px", marginBottom: 10 }}>
                <div style={{ fontFamily: F.serif, fontSize: 22, fontWeight: 700, color: i < 3 ? GOLD : BURG, width: 36 }}>{"#" + (i + 1)}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: F.sans, fontWeight: 700, fontSize: 15, color: BURG }}>{e.name}</div>
                  <div style={{ fontFamily: F.sans, fontSize: 12, color: "#999" }}>{e.mods} {e.mods !== 1 ? "modules" : "module"} completed</div>
                </div>
                <div style={{ fontFamily: F.serif, fontSize: 22, fontWeight: 700, color: GOLD }}>{e.score}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── HOME TAB ────────────────────────────────────────────────────────────────
// ─── WELCOME / HOME DATA ──────────────────────────────────────────────────────

// Demo team — replace with client's team members for each deployment
const TEAM = [
  { name: "Maya Chen",     bMonth: 4,  bDay: 12, joinDate: new Date(2023, 0, 15),  location: "Sydney",    title: "CX Manager" },
  { name: "Jordan Park",   bMonth: 8,  bDay: 3,  joinDate: new Date(2023, 5, 1),   location: "Sydney",    title: "Senior CX Specialist" },
  { name: "Priya Sharma",  bMonth: 2,  bDay: 27, joinDate: new Date(2024, 1, 10),  location: "Remote",    title: "CX Specialist" },
  { name: "Aisha Williams",bMonth: 6,  bDay: 19, joinDate: new Date(2024, 6, 15),  location: "Remote",    title: "CX Specialist" },
  { name: "Tom Nguyen",    bMonth: 11, bDay: 8,  joinDate: new Date(2025, 0, 20),  location: "Melbourne", title: "CX Specialist" },
  { name: "Sam Lee",       bMonth: 3,  bDay: 22, joinDate: new Date(2023, 8, 1),   location: "Sydney",    title: "Operations Coordinator" },
];

const QUOTES = [
  { text: "The customer's perception is your reality.", source: "Kate Zabriskie" },
  { text: "Customer service shouldn't just be a department, it should be the entire company.", source: "Tony Hsieh" },
  { text: "Your most unhappy customers are your greatest source of learning.", source: "Bill Gates" },
  { text: "We see our customers as invited guests to a party, and we are the hosts.", source: "Jeff Bezos" },
  { text: "The goal as a company is to have customer service that is not just the best but legendary.", source: "Sam Walton" },
  { text: "Revolve your world around the customer and more customers will revolve around you.", source: "Heather Williams" },
  { text: "It takes months to find a customer — seconds to lose one.", source: "Vince Lombardi" },
  { text: "Make every interaction count, even the small ones.", source: "Shep Hyken" },
  { text: "There is only one boss. The customer.", source: "Sam Walton" },
  { text: "A customer talking about their experience with you is worth ten times that which you write or say about yourself.", source: "David J. Greer" },
  { text: "Do what you do so well that they will want to see it again and bring their friends.", source: "Walt Disney" },
  { text: "The single most important thing is to make people happy.", source: "Derek Sivers" },
  { text: "Customers don't expect you to be perfect. They do expect you to fix things when they go wrong.", source: "Donald Porter" },
  { text: "Quality is remembered long after the price is forgotten.", source: "Gucci family slogan" },
  { text: "The secret is to work less as individuals and more as a team.", source: "Vince Lombardi" },
  { text: "Loyal customers, they don't just come back, they don't simply recommend you, they insist that their friends do business with you.", source: "Chip Bell" },
  { text: "People will forget what you said, people will forget what you did, but people will never forget how you made them feel.", source: "Maya Angelou" },
  { text: "The purpose of a business is to create a customer who creates customers.", source: "Shiv Singh" },
  { text: "Excellence is not a destination; it is a continuous journey that never ends.", source: "Brian Tracy" },
  { text: "Be genuinely interested in everyone you meet and everyone you meet will be genuinely interested in you.", source: "Rasheed Ogunlaru" },
  { text: "A brand is no longer what we tell the consumer it is — it is what consumers tell each other it is.", source: "Scott Cook" },
];

const GREETING_LINES = [
  "Let's make today count.",
  "Inbox waiting. Let's go.",
  "Ready when you are.",
  "One reply at a time.",
  "Let's keep the streak going.",
  "Your team is ready. Are you?",
  "Every ticket is a chance to build loyalty.",
  "Make every interaction count.",
];

const GREETING_LINES_MONDAY = [
  "Fresh week, fresh wins.",
  "New week. Let's own it.",
  "Hope you had a great weekend.",
];

const GREETING_LINES_FRIDAY = [
  "Strong finish to a strong week.",
  "Almost there — finish well.",
  "Last push before the weekend.",
  "End the week on a high.",
];

const ANNOUNCEMENTS = [
  { title: "Scalp Serum tingling volume up this week — use SOP 01 for all queries", date: "2026-05-23" },
  { title: "Hair Edit swap deadline is the 12th — flag any requests coming in after", date: "2026-05-22" },
  { title: "Failed payments up 18% — proactive outreach campaign launching Monday", date: "2026-05-22" },
  { title: "Save rate hit 43% this week — great work team 🎉", date: "2026-05-21" },
];

function pickByDay(list, today) {
  const start = new Date(today.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((today - start) / 86400000);
  return list[((dayOfYear % list.length) + list.length) % list.length];
}

// Picks an appropriate greeting tagline based on day-of-week, so we don't
// hit people with "Hope your weekend was top-tier" on a Thursday. Mondays
// get Monday-themed lines, Fridays get TGIF lines, everything else rotates
// through the day-agnostic pool.
function pickGreetingForDay(today) {
  const day = today.getDay(); // 0 = Sun, 1 = Mon, ..., 5 = Fri, 6 = Sat
  if (day === 1) return pickByDay(GREETING_LINES_MONDAY, today);
  if (day === 5) return pickByDay(GREETING_LINES_FRIDAY, today);
  return pickByDay(GREETING_LINES, today);
}

function greetingPrefix(hour) {
  if (hour < 5)  return "Burning the midnight oil";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 21) return "Good evening";
  return "Late night";
}

function announcementStatus(dateStr, today) {
  const d = new Date(dateStr);
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (d < t) return "live";
  if (d.getTime() === t.getTime()) return "today";
  return "upcoming";
}

function formatDateShort(d) {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function eventsInWindow(team, today, days) {
  const events = [];
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  for (let i = 0; i <= days; i++) {
    const day = new Date(start.getTime() + i * 86400000);
    const m = day.getMonth() + 1;
    const d = day.getDate();
    for (const p of team) {
      if (p.bMonth === m && p.bDay === d) {
        events.push({ type: "birthday", person: p, date: day, daysAway: i });
      }
      if (p.joinDate.getMonth() + 1 === m && p.joinDate.getDate() === d) {
        const years = day.getFullYear() - p.joinDate.getFullYear();
        if (years > 0) {
          events.push({ type: "anniversary", person: p, date: day, daysAway: i, years });
        }
      }
    }
  }
  return events;
}

function nextUpcomingEvents(team, today, n) {
  // Look up to a year ahead
  const all = eventsInWindow(team, today, 365);
  return all.filter((e) => e.daysAway > 0).slice(0, n);
}

function firstNameOf(fullName) {
  const parts = (fullName || "").split(/\s+/).filter(Boolean);
  if (parts.length === 0) return fullName;
  // Skip abbreviated honorifics like "Ma." → use next token
  if (parts[0].endsWith(".") && parts.length > 1) return parts[1];
  return parts[0];
}

const BLUSH = "#F0EBE0";
const PEACH = "#EDE5D8";
const SOFT_BORDER = "#DDD8CE";
const INK = "#0A0A09";

// Dark palette — used by home page announcement banner
const DARK_BG = "#0A0A09";
const DARK_CARD = "#161614";
const DARK_CARD_HI = "#1F1F1D";
const DARK_BORDER = "#2A2A28";
const CREAM_TXT = "#F4F0E8";
const WARM_GRAY = "#B0AAA2";

function HomeTab({ displayName, setTab, role }) {
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const now = new Date();
        const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        const fromIso = dayStart.toISOString();
        const toIso = now.toISOString();
        const res = await fetch(`/api/insights/summary?from=${fromIso}&to=${toIso}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
        if (!cancelled) setStats(json);
      } catch (e) {
        if (!cancelled) setStatsError(e.message);
      } finally {
        if (!cancelled) setStatsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const today = new Date();
  const firstName = (displayName?.trim()?.split(/\s+/)?.[0]) || "team";
  const prefix = greetingPrefix(today.getHours());
  const tagline = pickGreetingForDay(today);
  const quote = pickByDay(QUOTES, today);

  const todayEvents = eventsInWindow(TEAM, today, 0);
  const upcoming = nextUpcomingEvents(TEAM, today, 3);

  const eyebrow = { fontFamily: F.sans, fontSize: 10, color: GOLD, textTransform: "uppercase", letterSpacing: 4, fontWeight: 600, marginBottom: 14 };
  const sectionLabel = { fontFamily: F.sans, fontSize: 10, color: BURG, textTransform: "uppercase", letterSpacing: 4, fontWeight: 600, marginBottom: 18, opacity: 0.55 };

  return (
    <div style={{ background: CREAM, minHeight: "100vh", color: INK }}>
      {/* Marquee announcements banner */}
      <style>{`
        @keyframes luma-marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .luma-marquee-track:hover { animation-play-state: paused; }
      `}</style>
      <div style={{ background: BURG, overflow: "hidden", padding: "12px 0", borderBottom: "1px solid " + DARK_BORDER }}>
        <div className="luma-marquee-track" style={{ display: "inline-flex", whiteSpace: "nowrap", animation: "luma-marquee 50s linear infinite" }}>
          {[...ANNOUNCEMENTS, ...ANNOUNCEMENTS, ...ANNOUNCEMENTS].map((a, i) => {
            const status = announcementStatus(a.date, today);
            const tagText = status === "live" ? "Live" : status === "today" ? "Today" : "Upcoming";
            const tagColor = status === "live" ? "#7FBE7F" : status === "today" ? "#FFB3B3" : GOLD;
            return (
              <div key={i} style={{ display: "inline-flex", alignItems: "center", gap: 14, padding: "0 32px", fontFamily: F.sans, fontSize: 13 }}>
                <span style={{ color: tagColor, fontWeight: 700, textTransform: "uppercase", letterSpacing: 3, fontSize: 10 }}>{tagText}</span>
                {a.url ? (
                  <a href={a.url} target="_blank" rel="noopener noreferrer" style={{ color: CREAM, fontWeight: 500, textDecoration: "underline", textDecorationColor: GOLD, textUnderlineOffset: 4 }}>{a.title}</a>
                ) : (
                  <span style={{ color: CREAM, fontWeight: 500 }}>{a.title}</span>
                )}
                <span style={{ color: "#C8BCAA", fontSize: 11, letterSpacing: 1 }}>{formatDateShort(new Date(a.date))}</span>
                <span style={{ color: GOLD, opacity: 0.5 }}>•</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Hero — editorial cream, generous whitespace. Greeting on the
          left, Dino launcher card on the right. Flex wraps on small
          viewports so the card drops below the greeting cleanly. */}
      <div style={{ padding: "96px 24px 64px", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 32, flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 auto", minWidth: 0 }}>
            <div style={{ ...eyebrow, marginBottom: 20 }}>LUMÉ CX Hub</div>
            <div style={{ fontFamily: F.serif, fontSize: 64, color: BURG, fontWeight: 600, lineHeight: 1.05, marginBottom: 18, letterSpacing: -1.5 }}>
              {prefix}, {firstName}.
            </div>
            <div style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 22, color: INK, opacity: 0.65, maxWidth: 600, lineHeight: 1.4 }}>
              {tagline}
            </div>
          </div>

          {/* Ask Luma quick-launch card */}
          <div
            onClick={() => setTab("Ask LUMÉ")}
            style={{
              flex: "0 0 auto",
              display: "inline-flex", alignItems: "center", gap: 14,
              background: BURG, border: "1.5px solid " + BURG,
              color: CREAM,
              padding: "16px 22px",
              borderRadius: 14,
              boxShadow: "0 4px 14px rgba(10,10,9,0.18)",
              transition: "all 0.2s",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 8px 22px rgba(10,10,9,0.28)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 14px rgba(10,10,9,0.18)";
            }}
          >
            <span style={{ fontSize: 26, lineHeight: 1 }}>✦</span>
            <span style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 2 }}>
              <span style={{ fontFamily: F.serif, fontSize: 20, fontWeight: 700, letterSpacing: 0.5, lineHeight: 1, color: CREAM }}>
                Ask LUMÉ
              </span>
              <span style={{ fontFamily: F.sans, fontSize: 10, color: GOLD, letterSpacing: 2, textTransform: "uppercase", fontWeight: 700 }}>
                AI Assistant →
              </span>
            </span>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px 96px" }}>

        {/* Hairline divider */}
        <div style={{ height: 1, background: SOFT_BORDER, marginBottom: 40 }} />

        {/* Stats — separate rounded tiles */}
        <div style={sectionLabel}>Today, so far</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 56 }}>
          <PremiumTile
            label="Tickets handled"
            value={statsLoading ? "..." : (stats?.volume != null ? stats.volume.toLocaleString() : "—")}
            hint={stats?.totalAcrossBrands ? `${stats.totalAcrossBrands.toLocaleString()} across brands` : "today"}
          />
          <PremiumTile
            label="CSAT"
            value={statsLoading ? "..." : (stats?.csat?.average != null ? stats.csat.average.toFixed(2) : "—")}
            hint={stats?.csat?.count ? `${stats.csat.count} responses today` : "no responses yet"}
          />
          <PremiumTile
            label="Avg resolution"
            value={statsLoading ? "..." : formatDuration(stats?.resolution?.avgSeconds)}
            hint={stats?.resolution?.count ? `${stats.resolution.count} closed` : "—"}
          />
          <PremiumTile
            label="Open"
            value={statsLoading ? "..." : (stats?.byStatus?.open != null ? stats.byStatus.open.toLocaleString() : "—")}
            hint="awaiting reply · team"
          />
        </div>

        {/* Quote of the day — large editorial block on white */}
        <div style={{ background: W, padding: "56px 56px", marginBottom: 56, position: "relative", border: "1px solid " + SOFT_BORDER, borderLeft: "2px solid " + GOLD, borderRadius: 18 }}>
          <div style={{ ...eyebrow, marginBottom: 24 }}>Quote of the day</div>
          <div style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 32, color: BURG, fontWeight: 400, lineHeight: 1.35, maxWidth: 820, marginBottom: 24, letterSpacing: -0.3 }}>
            &ldquo;{quote.text}&rdquo;
          </div>
          <div style={{ fontFamily: F.sans, fontSize: 11, color: GOLD, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase" }}>
            — {quote.source}
          </div>
        </div>

        {/* Mission card — Luma CX */}
        <div style={{ background: BURG, marginBottom: 56, position: "relative", overflow: "hidden", borderRadius: 18 }}>
          <div style={{ padding: "56px 56px", borderLeft: "2px solid " + GOLD }}>
            <div style={{ fontFamily: F.sans, fontSize: 10, color: GOLD, textTransform: "uppercase", letterSpacing: 4, fontWeight: 600, marginBottom: 20 }}>LUMÉ CX Promise</div>
            <div style={{ fontFamily: F.serif, fontSize: 42, fontWeight: 600, color: CREAM, marginBottom: 24, lineHeight: 1.1, letterSpacing: -1 }}>
              Every customer deserves to feel heard, helped, and valued.
            </div>
            <div style={{ fontFamily: F.sans, fontSize: 15, color: CREAM, opacity: 0.7, lineHeight: 1.7, maxWidth: 620, marginBottom: 32 }}>
              That's not a policy — it's who we are. Every serum we sell, every ticket we close, every save we make is in service of that promise.
            </div>
            <div style={{ display: "flex", gap: 48 }}>
              <div>
                <div style={{ fontFamily: F.serif, fontSize: 36, fontWeight: 700, color: GOLD, lineHeight: 1 }}>4.6</div>
                <div style={{ fontFamily: F.sans, fontSize: 10, color: CREAM, opacity: 0.6, letterSpacing: 3, textTransform: "uppercase", fontWeight: 600, marginTop: 6 }}>CSAT</div>
              </div>
              <div>
                <div style={{ fontFamily: F.serif, fontSize: 36, fontWeight: 700, color: GOLD, lineHeight: 1 }}>34m</div>
                <div style={{ fontFamily: F.sans, fontSize: 10, color: CREAM, opacity: 0.6, letterSpacing: 3, textTransform: "uppercase", fontWeight: 600, marginTop: 6 }}>Avg Resolution</div>
              </div>
              <div>
                <div style={{ fontFamily: F.serif, fontSize: 36, fontWeight: 700, color: GOLD, lineHeight: 1 }}>43%</div>
                <div style={{ fontFamily: F.sans, fontSize: 10, color: CREAM, opacity: 0.6, letterSpacing: 3, textTransform: "uppercase", fontWeight: 600, marginTop: 6 }}>Save Rate</div>
              </div>
            </div>
          </div>
        </div>

        {/* Today + Coming up — separate rounded cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 56 }}>
          <div style={{ background: W, padding: "36px 40px", borderRadius: 16, border: "1px solid " + SOFT_BORDER }}>
            <div style={{ ...eyebrow, marginBottom: 24, color: BURG, opacity: 0.55 }}>Today</div>
            {todayEvents.length === 0 ? (
              <div style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 16, color: INK, opacity: 0.5 }}>No celebrations today.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                {todayEvents.map((e, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <span style={{ fontSize: 22 }}>{e.type === "birthday" ? "🎂" : "🎉"}</span>
                    <div>
                      <div style={{ fontFamily: F.serif, fontSize: 18, color: BURG, fontWeight: 600 }}>{e.person.name}</div>
                      <div style={{ fontFamily: F.sans, fontSize: 10, color: GOLD, letterSpacing: 2.5, textTransform: "uppercase", fontWeight: 600, marginTop: 6 }}>
                        {e.type === "birthday" ? "Birthday" : `${e.years} year${e.years === 1 ? "" : "s"} at LUMÉ CX`} · {e.person.location}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ background: W, padding: "36px 40px", borderRadius: 16, border: "1px solid " + SOFT_BORDER }}>
            <div style={{ ...eyebrow, marginBottom: 24, color: BURG, opacity: 0.55 }}>Coming up</div>
            {upcoming.length === 0 ? (
              <div style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 16, color: INK, opacity: 0.5 }}>Nothing on the radar.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                {upcoming.map((e, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                      <span style={{ fontSize: 20 }}>{e.type === "birthday" ? "🎂" : "🎉"}</span>
                      <div>
                        <div style={{ fontFamily: F.serif, fontSize: 17, color: BURG, fontWeight: 600 }}>{firstNameOf(e.person.name)}</div>
                        <div style={{ fontFamily: F.sans, fontSize: 10, color: INK, opacity: 0.55, letterSpacing: 2, textTransform: "uppercase", fontWeight: 600, marginTop: 6 }}>
                          {e.type === "birthday" ? "Birthday" : `${e.years}-year anniversary`}
                        </div>
                      </div>
                    </div>
                    <div style={{ fontFamily: F.sans, fontSize: 10, color: BURG, fontWeight: 700, textAlign: "right", whiteSpace: "nowrap", letterSpacing: 2, textTransform: "uppercase", border: "1px solid " + SOFT_BORDER, padding: "6px 10px" }}>
                      {e.daysAway === 1 ? "Tomorrow" : `${formatDateShort(e.date)} · ${e.daysAway}d`}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick links — burgundy filled rounded pills */}
        <div style={sectionLabel}>Jump to</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          {["Insights", "Logs", "Reports", "Records"]
            .filter((t) => {
              if (role === "Ops") return t === "Logs";
              if (t === "Logs") return role !== "New Starter";
              if (t === "Reports") return role && ["Lead Agent","Manager","Admin","Owner"].includes(role);
              if (t === "Records") return role && ["Manager","Admin","Owner"].includes(role);
              return true;
            })
            .map((t) => (
            <button key={t} onClick={() => setTab(t)} style={{ background: BURG, border: "1px solid " + BURG, color: CREAM, fontFamily: F.sans, fontSize: 12, fontWeight: 700, padding: "14px 26px", letterSpacing: 2, textTransform: "uppercase", cursor: "pointer", transition: "all 0.2s", borderRadius: 99 }}
              onMouseEnter={(e) => { e.currentTarget.style.background = RED; e.currentTarget.style.borderColor = RED; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = BURG; e.currentTarget.style.borderColor = BURG; }}
            >
              {t} →
            </button>
          ))}
        </div>

      </div>
    </div>
  );
}

function PremiumTile({ label, value, hint }) {
  return (
    <div style={{ background: W, padding: "32px 30px", minHeight: 130, borderRadius: 16, border: "1px solid " + SOFT_BORDER }}>
      <div style={{ fontFamily: F.sans, fontSize: 10, color: INK, opacity: 0.55, textTransform: "uppercase", letterSpacing: 2.5, fontWeight: 600, marginBottom: 16 }}>
        {label}
      </div>
      <div style={{ fontFamily: F.serif, fontSize: 40, color: BURG, fontWeight: 500, lineHeight: 1, letterSpacing: -1 }}>
        {value}
      </div>
      {hint && (
        <div style={{ fontFamily: F.sans, fontSize: 11, color: INK, opacity: 0.55, marginTop: 10, letterSpacing: 0.5 }}>
          {hint}
        </div>
      )}
    </div>
  );
}

// ─── Training Tab (wrapper with internal sub-nav) ─────────────────
const TRAINING_SUBTABS = ["Bootcamp", "Simulate", "Quiz", "Compare", "Progress"];

function TrainingTab(props) {
  const [sub, setSub] = useState("Bootcamp");
  const eyebrowS = { fontFamily: F.sans, fontSize: 10, color: GOLD, textTransform: "uppercase", letterSpacing: 4, fontWeight: 600, marginBottom: 14 };

  return (
    <div style={{ background: CREAM, minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "56px 24px 24px" }}>
        <div style={eyebrowS}>LUMÉ CX — Training</div>
        <div style={{ fontFamily: F.serif, fontSize: 40, color: BURG, fontWeight: 600, lineHeight: 1.05, marginBottom: 24, letterSpacing: -1 }}>
          {sub}
        </div>
        {/* Sub-nav pills */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {TRAINING_SUBTABS.map((s) => {
            const active = s === sub;
            return (
              <button key={s} onClick={() => setSub(s)} style={{
                background: active ? BURG : "transparent",
                color: active ? CREAM : BURG,
                border: "1px solid " + (active ? BURG : SOFT_BORDER),
                fontFamily: F.sans, fontSize: 11, fontWeight: 700, padding: "10px 18px",
                letterSpacing: 2, textTransform: "uppercase", cursor: "pointer", borderRadius: 99,
                transition: "all 0.15s",
              }}>
                {s}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content (inherits cream bg from wrapper) */}
      {sub === "Bootcamp" && <BootcampTab
        bcProgress={props.bcProgress} saveBcProgress={props.saveBcProgress}
        bcView={props.bcView} setBcView={props.setBcView}
        bcDay={props.bcDay} setBcDay={props.setBcDay}
        bcLesson={props.bcLesson} setBcLesson={props.setBcLesson}
        bcQIdx={props.bcQIdx} setBcQIdx={props.setBcQIdx}
        bcChosen={props.bcChosen} setBcChosen={props.setBcChosen}
        bcAnswers={props.bcAnswers} setBcAnswers={props.setBcAnswers}
        bcWriteInput={props.bcWriteInput} setBcWriteInput={props.setBcWriteInput}
        bcWriteFeedback={props.bcWriteFeedback} bcWriteLoading={props.bcWriteLoading}
        bcWriteDone={props.bcWriteDone} setBcWriteDone={props.setBcWriteDone}
        setBcWriteFeedback={props.setBcWriteFeedback} submitWritingExercise={props.submitWritingExercise}
        playerName={props.playerName}
      />}
      {sub === "Simulate" && <SimTab
        selScen={props.selScen} setSelScen={props.setSelScen}
        simMsgs={props.simMsgs} simInput={props.simInput} setSimInput={props.setSimInput}
        simLoading={props.simLoading} simFeedback={props.simFeedback}
        simDone={props.simDone} sendSim={props.sendSim} startScen={props.startScen}
        simEndRef={props.simEndRef}
      />}
      {sub === "Quiz" && <QuizTab
        selMod={props.selMod} setSelMod={props.setSelMod}
        qIdx={props.qIdx} chosen={props.chosen} answers={props.answers}
        sessionScores={props.sessionScores} completed={props.completed}
        startMod={props.startMod} pickAnswer={props.pickAnswer}
        nextQ={props.nextQ} finishMod={props.finishMod}
      />}
      {sub === "Compare" && <CompareTab />}
      {sub === "Progress" && <ProgressTab
        totalScore={props.totalScore} completed={props.completed}
        sessionScores={props.sessionScores} setTab={props.setTab} setSelMod={props.setSelMod}
      />}
    </div>
  );
}

// ─── Records Tab ─────────────────────────────────────────────────
// Spreadsheet-style view of every log table with click-to-edit cells +
// CSV download. Manager+ only.

// "Cancellations" hidden May 13 — Skio is the source of truth (per Aina).
// Model + API + config preserved as orphans in case we revive it.
const RECORDS_SUBTABS = ["Order Issue", "Replacements", "Reaction/Concern", "Feedback"];

// RECORDS_CONFIG is built lazily inside RecordsTab so it can reference
// the dropdown constants declared in the Logs section (ISSUE_CATEGORIES,
// OPS_REGIONS, etc.). At module load time those are still in TDZ.
function buildRecordsConfig() {
  return {
  "Order Issue": {
    listUrl: "/api/logs/issues",
    patchUrl: (id) => `/api/logs/issues/${id}`,
    columns: [
      { key: "createdAt",      label: "Created",   type: "date",     editable: false, width: 130 },
      { key: "orderId",        label: "Order ID",  type: "text",     editable: false, width: 110 },
      { key: "ticketId",       label: "Ticket #",  type: "text",     editable: true,  width: 110 },
      { key: "customerName",   label: "Customer",  type: "text",     editable: true,  width: 150 },
      { key: "customerEmail",  label: "Email",     type: "text",     editable: true,  width: 200 },
      { key: "country",        label: "Country",   type: "text",     editable: true,  width: 80 },
      { key: "warehouse",      label: "Warehouse", type: "select",   editable: true,  width: 110, options: ["", ...ISSUE_WAREHOUSES] },
      { key: "category",       label: "Category",  type: "select",   editable: true,  width: 130, options: ISSUE_CATEGORIES.map(c => c.value), labels: ISSUE_CATEGORIES },
      { key: "severity",       label: "Severity",  type: "select",   editable: true,  width: 90,  options: ISSUE_SEVERITY },
      { key: "resolution",     label: "Resolution",type: "select",   editable: true,  width: 110, options: ISSUE_RESOLUTIONS.map(r => r.value), labels: ISSUE_RESOLUTIONS },
      { key: "itemsAffected",  label: "Items",     type: "csv",      editable: true,  width: 160 },
      { key: "description",    label: "Description",type: "textarea",editable: true,  width: 280 },
      { key: "resolutionNotes",label: "Notes",     type: "textarea", editable: true,  width: 200 },
    ],
  },
  Replacements: {
    listUrl: "/api/logs/replacements",
    patchUrl: (id) => `/api/logs/replacements/${id}`,
    // Updated May 13 per Aina's testing — new two-tier reason + Items Affected.
    // `type` and `status` removed (always default values now).
    // Legacy single `reason` shown but read-only for old-row backwards compat.
    // Legacy `itemsToShip` hidden — superseded by `itemsAffected`.
    columns: [
      { key: "createdAt",     label: "Created",       type: "date",     editable: false, width: 130 },
      { key: "orderId",       label: "Order ID",      type: "text",     editable: false, width: 110 },
      { key: "ticketId",      label: "Ticket #",      type: "text",     editable: true,  width: 110 },
      { key: "customerName",  label: "Customer",      type: "text",     editable: true,  width: 150 },
      { key: "country",       label: "Country",       type: "text",     editable: true,  width: 80 },
      { key: "warehouse",     label: "Warehouse",     type: "select",   editable: true,  width: 110, options: ["", ...ISSUE_WAREHOUSES] },
      { key: "reasonMains",   label: "Main reason",   type: "csv",      editable: true,  width: 180 },
      { key: "reasonSubs",    label: "Sub reason",    type: "csv",      editable: true,  width: 220 },
      { key: "itemsAffected", label: "Items",         type: "csv",      editable: true,  width: 200 },
      { key: "courier",       label: "Courier",       type: "text",     editable: true,  width: 100 },
      { key: "details",       label: "Details",       type: "textarea", editable: true,  width: 240 },
      { key: "solution",      label: "Solution",      type: "text",     editable: true,  width: 220 },
      // Legacy fallback for pre-May-13 rows — read-only display
      { key: "reason",        label: "Legacy reason", type: "text",     editable: false, width: 130 },
    ],
  },
  Cancellations: {
    listUrl: "/api/logs/cancellations",
    patchUrl: (id) => `/api/logs/cancellations/${id}`,
    columns: [
      { key: "createdAt",        label: "Created",  type: "date",   editable: false, width: 130 },
      { key: "orderId",          label: "Order ID", type: "text",   editable: false, width: 110 },
      { key: "ticketId",         label: "Ticket #", type: "text",   editable: true,  width: 110 },
      { key: "customerName",     label: "Customer", type: "text",   editable: true,  width: 150 },
      { key: "customerEmail",    label: "Email",    type: "text",   editable: true,  width: 200 },
      { key: "country",          label: "Country",  type: "text",   editable: true,  width: 80 },
      { key: "cancellationType", label: "Reason",   type: "select", editable: true,  width: 160, options: CANCELLATION_TYPES.map(c => c.value), labels: CANCELLATION_TYPES },
      { key: "scope",            label: "Scope",    type: "select", editable: true,  width: 130, options: CANCELLATION_SCOPES.map(s => s.value), labels: CANCELLATION_SCOPES },
      { key: "notes",            label: "Notes",    type: "textarea",editable: true, width: 280 },
    ],
  },
  Feedback: {
    listUrl: "/api/logs/feedback",
    patchUrl: (id) => `/api/logs/feedback/${id}`,
    columns: [
      { key: "createdAt",     label: "Created",  type: "date",     editable: false, width: 130 },
      { key: "orderId",       label: "Order ID", type: "text",     editable: true,  width: 110 },
      { key: "ticketId",      label: "Ticket #", type: "text",     editable: true,  width: 110 },
      { key: "customerName",  label: "Customer", type: "text",     editable: true,  width: 150 },
      { key: "country",       label: "Country",  type: "text",     editable: true,  width: 80 },
      { key: "theme",         label: "Theme",    type: "select",   editable: true,  width: 130, options: FEEDBACK_THEMES.map(t => t.value), labels: FEEDBACK_THEMES },
      { key: "relatedTeam",   label: "Team",     type: "select",   editable: true,  width: 130, options: ["", ...FEEDBACK_TEAMS] },
      { key: "details",       label: "Details",  type: "textarea", editable: true,  width: 320 },
      { key: "suggestion",    label: "Suggestion",type: "textarea",editable: true,  width: 240 },
    ],
  },
  "Reaction/Concern": {
    listUrl: "/api/logs/adverse-reactions",
    patchUrl: (id) => `/api/logs/adverse-reactions/${id}`,
    columns: [
      { key: "createdAt",            label: "Created",   type: "date",     editable: false, width: 130 },
      { key: "orderId",              label: "Order ID",  type: "text",     editable: false, width: 110 },
      { key: "customerName",         label: "Customer",  type: "text",     editable: true,  width: 150 },
      { key: "country",              label: "Country",   type: "text",     editable: true,  width: 80 },
      { key: "complaintMethod",      label: "Method",    type: "select",   editable: true,  width: 110, options: AR_METHODS.map(m => m.value), labels: AR_METHODS },
      { key: "severity",             label: "Severity",  type: "select",   editable: true,  width: 110, options: AR_SEVERITY.map(s => s.value), labels: AR_SEVERITY },
      { key: "isSerious",            label: "SAE",       type: "bool",     editable: true,  width: 60 },
      { key: "complaintDescription", label: "Verbatim",  type: "textarea", editable: true,  width: 320 },
      { key: "symptoms",             label: "Symptoms",  type: "csv",      editable: true,  width: 180 },
      { key: "productsAffected",     label: "Products",  type: "csv",      editable: true,  width: 180 },
      { key: "lotNumbers",           label: "Lots",      type: "csv",      editable: true,  width: 120 },
      { key: "escalatedTo",          label: "Escalated", type: "select",   editable: true,  width: 130, options: ["", ...AR_ESCALATION] },
      { key: "fdaMedwatchFiled",     label: "MEDWATCH",  type: "bool",     editable: true,  width: 90 },
      { key: "mrddNumber",           label: "MRDD #",    type: "text",     editable: true,  width: 100 },
      { key: "qcReviewer",           label: "QC reviewer",type: "text",    editable: true,  width: 130 },
      { key: "qcNotes",              label: "QC notes",  type: "textarea", editable: true,  width: 200 },
      { key: "status",               label: "Status",    type: "select",   editable: true,  width: 130, options: AR_STATUS.map(s => s.value), labels: AR_STATUS },
    ],
  },
  "Ops Requests": {
    listUrl: "/api/logs/order-requests",
    patchUrl: (id) => `/api/logs/order-requests/${id}`,
    columns: [
      { key: "createdAt",            label: "Created",   type: "date",   editable: false, width: 130 },
      { key: "region",               label: "Warehouse", type: "select", editable: true,  width: 100, options: OPS_REGIONS.map(r => r.value) },
      { key: "im8OrderRef",          label: "Order ref", type: "text",   editable: true,  width: 110 },
      { key: "ticketId",             label: "Ticket #",  type: "text",   editable: true,  width: 110 },
      { key: "recipientName",        label: "Recipient", type: "text",   editable: true,  width: 150 },
      { key: "shipToCity",           label: "City",      type: "text",   editable: true,  width: 110 },
      { key: "shipToCountry",        label: "Country",   type: "text",   editable: true,  width: 90 },
      { key: "itemsDescription",     label: "Items",     type: "textarea",editable: true, width: 240 },
      { key: "dispatchWarehouse",    label: "Warehouse", type: "text",   editable: true,  width: 150 },
      { key: "shipCarrier",          label: "Carrier",   type: "text",   editable: true,  width: 100 },
      { key: "awb",                  label: "AWB#",      type: "text",   editable: true,  width: 130 },
      { key: "referenceNumber",      label: "Reference#",type: "text",   editable: true,  width: 130 },
      { key: "d365SalesOrderNumber", label: "D365 SO#",  type: "text",   editable: true,  width: 130 },
      { key: "shipDate",             label: "Ship date", type: "date",   editable: true,  width: 110 },
      { key: "sent",                 label: "Sent",      type: "bool",   editable: true,  width: 60 },
      { key: "status",               label: "Status",    type: "select", editable: true,  width: 110, options: OPS_STATUSES.map(s => s.value), labels: OPS_STATUSES },
      { key: "notes",                label: "Notes",     type: "textarea",editable: true, width: 200 },
    ],
  },
  };
}

function RecordsTab({ role }) {
  const canView = role && ["Manager","Admin","Owner"].includes(role);
  const [sub, setSub] = useState("Order Issue");
  const RECORDS_CONFIG = useMemo(buildRecordsConfig, []);

  // Deep-link from email: #records:issues, #records:adverse-reactions etc.
  // Parses the second part and matches against RECORDS_SUBTABS case-/dash-
  // insensitively so "adverse-reactions" → "Adverse Reactions".
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash.replace(/^#/, "").trim();
    if (!hash || !hash.includes(":")) return;
    const subPart = hash.split(":").slice(1).join(":").replace(/-/g, " ");
    const matched = RECORDS_SUBTABS.find((s) => s.toLowerCase() === subPart.toLowerCase());
    if (matched) setSub(matched);
  }, []);
  if (!canView) {
    return (
      <div style={{ background: CREAM, minHeight: "100vh", padding: "80px 24px" }}>
        <div style={{ maxWidth: 600, margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontFamily: F.serif, fontSize: 32, color: BURG, fontWeight: 600, marginBottom: 14 }}>Records</div>
          <div style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 16, color: INK, opacity: 0.6 }}>
            Records are visible to Manager and above. This is the editable spreadsheet view of every log.
          </div>
        </div>
      </div>
    );
  }
  const config = RECORDS_CONFIG[sub];
  const RECORDS_TAGLINES = {
    "Order Issue":      "Every order issue logged across the team.",
    "Replacements":     "Every replacement request, intake through delivery.",
    "Reaction/Concern": "Every adverse reaction or skin concern on file.",
    "Feedback":         "Every customer feedback note and feature request.",
  };
  return (
    <div style={{ background: CREAM, minHeight: "100vh" }}>
      <div style={{ maxWidth: "100%", padding: "40px 24px 16px" }}>
        <div style={{ fontFamily: F.sans, fontSize: 10, color: GOLD, letterSpacing: 4, textTransform: "uppercase", fontWeight: 700, marginBottom: 8 }}>LUMÉ CX — Records</div>
        <div style={{ fontFamily: F.serif, fontSize: 36, color: BURG, fontWeight: 600, lineHeight: 1.05, marginBottom: 8 }}>{sub}</div>
        <div style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 14, color: INK, opacity: 0.6, marginBottom: 18, maxWidth: 760 }}>
          {RECORDS_TAGLINES[sub] ?? "Every log entry in one editable view."}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {RECORDS_SUBTABS.map((s) => {
            const active = s === sub;
            return (
              <button key={s} onClick={() => setSub(s)} style={{
                background: active ? BURG : "transparent",
                color: active ? CREAM : BURG,
                border: "1px solid " + (active ? BURG : SOFT_BORDER),
                fontFamily: F.sans, fontSize: 11, fontWeight: 700, padding: "8px 16px",
                letterSpacing: 1.5, textTransform: "uppercase", cursor: "pointer", borderRadius: 99,
              }}>{s}</button>
            );
          })}
        </div>
      </div>
      <RecordsGrid key={sub} subName={sub} config={config} />
    </div>
  );
}

function RecordsGrid({ subName, config }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState("createdAt");
  const [sortDir, setSortDir] = useState("desc");
  const [editing, setEditing] = useState(null); // { rowId, key, value }
  const [savingId, setSavingId] = useState(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${config.listUrl}?limit=500`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setRows(json.rows ?? []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, [config.listUrl]);

  function toggleSort(key) {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  }

  const filtered = rows.filter((r) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return Object.values(r).some((v) => String(v ?? "").toLowerCase().includes(q));
  });
  const sorted = [...filtered].sort((a, b) => {
    const av = a[sortKey], bv = b[sortKey];
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
    return sortDir === "asc" ? cmp : -cmp;
  });

  function startEdit(rowId, col, currentValue) {
    if (!col.editable) return;
    let initialValue;
    if (col.type === "csv") initialValue = (currentValue ?? []).join(", ");
    else if (col.type === "bool") initialValue = !!currentValue;
    else if (col.type === "date") initialValue = currentValue ? new Date(currentValue).toISOString().slice(0, 10) : "";
    else initialValue = currentValue ?? "";
    setEditing({ rowId, key: col.key, value: initialValue });
  }
  function cancelEdit() { setEditing(null); }

  async function commitEdit() {
    if (!editing) return;
    const { rowId, key, value } = editing;
    const col = config.columns.find((c) => c.key === key);
    let payloadValue;
    if (col.type === "csv") payloadValue = String(value).split(",").map((s) => s.trim()).filter(Boolean);
    else if (col.type === "bool") payloadValue = !!value;
    else if (col.type === "date") payloadValue = value || null;
    else payloadValue = value === "" ? null : value;

    setEditing(null);
    setSavingId(rowId);
    try {
      const res = await fetch(config.patchUrl(rowId), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: payloadValue }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setRows((cur) => cur.map((r) => r.id === rowId ? json.row : r));
    } catch (e) {
      setError(`Save failed: ${e.message}`);
    } finally {
      setSavingId(null);
    }
  }

  // Delete a row. Manager+ only on the API side; the Records tab is
  // already Manager+ gated so anyone seeing this button is authorised.
  // Confirm via native dialog — simple and reliable, no extra modal infra.
  async function deleteRow(rowId) {
    const confirmed = typeof window !== "undefined" &&
      window.confirm("Delete this row? This can't be undone.");
    if (!confirmed) return;
    setSavingId(rowId);
    try {
      const res = await fetch(config.patchUrl(rowId), { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || `HTTP ${res.status}`);
      }
      setRows((cur) => cur.filter((r) => r.id !== rowId));
      // If the deleted row was being edited, drop the edit state too.
      setEditing((cur) => (cur && cur.rowId === rowId ? null : cur));
    } catch (e) {
      setError(`Delete failed: ${e.message}`);
    } finally {
      setSavingId(null);
    }
  }

  function downloadCSV() {
    const cols = config.columns.map((c) => c.key);
    const escape = (v) => {
      if (v == null) return "";
      const s = Array.isArray(v) ? v.join("; ") : (typeof v === "object" ? JSON.stringify(v) : String(v));
      if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };
    const header = config.columns.map((c) => escape(c.label)).join(",");
    const body = sorted.map((r) => cols.map((k) => escape(r[k])).join(",")).join("\n");
    const blob = new Blob([header + "\n" + body], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${subName.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const cellBase = { padding: "6px 10px", fontFamily: F.sans, fontSize: 12, color: INK, borderBottom: "1px solid " + SOFT_BORDER, verticalAlign: "top" };
  const headerBase = { padding: "10px", fontFamily: F.sans, fontSize: 10, color: "#888", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, borderBottom: "1px solid " + SOFT_BORDER, background: CREAM, textAlign: "left", whiteSpace: "nowrap", cursor: "pointer", position: "sticky", top: 0, zIndex: 1 };

  return (
    <div style={{ padding: "0 24px 80px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 12 }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search across all columns…"
          style={{ flex: "1 1 280px", maxWidth: 400, padding: "8px 14px", borderRadius: 99, border: "1px solid " + SOFT_BORDER, background: W, fontFamily: F.sans, fontSize: 13, outline: "none" }}
        />
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontFamily: F.sans, fontSize: 11, color: INK, opacity: 0.55 }}>{filtered.length}{search ? ` of ${rows.length}` : ""}</span>
          <button onClick={downloadCSV} style={{ background: "transparent", color: BURG, border: "1px solid " + BURG, fontFamily: F.sans, fontSize: 11, fontWeight: 700, padding: "8px 14px", letterSpacing: 1.5, textTransform: "uppercase", cursor: "pointer", borderRadius: 99 }}>Download CSV</button>
          <button onClick={load} disabled={loading} style={{ background: "transparent", color: BURG, border: "1px solid " + SOFT_BORDER, fontFamily: F.sans, fontSize: 11, fontWeight: 600, padding: "8px 14px", letterSpacing: 1, cursor: loading ? "wait" : "pointer", borderRadius: 99 }}>{loading ? "..." : "Refresh"}</button>
        </div>
      </div>
      {error && <div style={{ background: "#fee", border: "1px solid " + RED, color: RED, padding: 8, borderRadius: 6, marginBottom: 10, fontFamily: F.sans, fontSize: 12 }}>{error}</div>}

      <div style={{ overflow: "auto", maxHeight: "calc(100vh - 280px)", background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 8 }}>
        <table style={{ borderCollapse: "collapse", width: "max-content", minWidth: "100%" }}>
          <thead>
            <tr>
              {config.columns.map((c) => (
                <th key={c.key} onClick={() => toggleSort(c.key)} style={{ ...headerBase, width: c.width }}>
                  {c.label} {sortKey === c.key && <span style={{ color: BURG }}>{sortDir === "asc" ? "▲" : "▼"}</span>}
                </th>
              ))}
              {/* Trailing action column — delete button per row */}
              <th style={{ ...headerBase, width: 56, cursor: "default", textAlign: "center" }}>Del</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r, i) => (
              <tr key={r.id} style={{ background: i % 2 === 0 ? W : "#fdfbf9", opacity: savingId === r.id ? 0.6 : 1 }}>
                {config.columns.map((c) => {
                  const val = r[c.key];
                  const isEditing = editing?.rowId === r.id && editing?.key === c.key;
                  return (
                    <td key={c.key} style={{ ...cellBase, width: c.width, cursor: c.editable ? "text" : "default" }}
                        onClick={() => !isEditing && startEdit(r.id, c, val)}>
                      {isEditing ? (
                        <EditCell col={c} value={editing.value} setValue={(v) => setEditing({ ...editing, value: v })} onCommit={commitEdit} onCancel={cancelEdit} />
                      ) : (
                        <CellDisplay col={c} value={val} />
                      )}
                    </td>
                  );
                })}
                {/* Delete action cell — stopPropagation so the row's click-to-edit
                    behaviour doesn't fire when the button is clicked. */}
                <td style={{ ...cellBase, width: 56, textAlign: "center", cursor: "default" }}
                    onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => deleteRow(r.id)}
                    disabled={savingId === r.id}
                    aria-label="Delete row"
                    title="Delete this row"
                    style={{
                      background: "transparent",
                      color: BURG,
                      border: "1px solid " + SOFT_BORDER,
                      fontFamily: F.sans, fontSize: 14, fontWeight: 700,
                      width: 28, height: 28, lineHeight: "24px", padding: 0,
                      borderRadius: 99,
                      cursor: savingId === r.id ? "wait" : "pointer",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = BURG; e.currentTarget.style.color = CREAM; e.currentTarget.style.borderColor = BURG; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = BURG; e.currentTarget.style.borderColor = SOFT_BORDER; }}
                  >×</button>
                </td>
              </tr>
            ))}
            {sorted.length === 0 && !loading && (
              <tr><td colSpan={config.columns.length + 1} style={{ ...cellBase, textAlign: "center", fontStyle: "italic", color: INK, opacity: 0.5, padding: 24 }}>{rows.length === 0 ? "No records yet." : "No matches."}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CellDisplay({ col, value }) {
  if (value == null || value === "") return <span style={{ color: INK, opacity: 0.3 }}>—</span>;
  if (col.type === "csv") return <span>{Array.isArray(value) ? value.join(", ") : String(value)}</span>;
  if (col.type === "bool") return <span style={{ color: value ? "#2a7a2a" : INK, fontWeight: value ? 700 : 400 }}>{value ? "✓" : "—"}</span>;
  if (col.type === "date") {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return <span>{String(value)}</span>;
    return <span>{d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</span>;
  }
  if (col.labels) {
    const found = col.labels.find((l) => l.value === value);
    if (found) return <span>{found.label}</span>;
  }
  return <span style={{ whiteSpace: "pre-wrap" }}>{String(value)}</span>;
}

function EditCell({ col, value, setValue, onCommit, onCancel }) {
  const inputBase = { width: "100%", padding: "4px 6px", border: "1px solid " + BURG, borderRadius: 4, fontFamily: F.sans, fontSize: 12, color: INK, outline: "none", boxSizing: "border-box" };
  const onKey = (e) => {
    if (e.key === "Escape") { e.preventDefault(); onCancel(); }
    if (e.key === "Enter" && !e.shiftKey && col.type !== "textarea") { e.preventDefault(); onCommit(); }
  };
  if (col.type === "select") {
    return (
      <select autoFocus value={value} onChange={(e) => setValue(e.target.value)} onBlur={onCommit} onKeyDown={onKey} style={inputBase}>
        {col.options.map((opt) => {
          const lab = col.labels?.find((l) => l.value === opt)?.label ?? (opt === "" ? "—" : opt);
          return <option key={opt} value={opt}>{lab}</option>;
        })}
      </select>
    );
  }
  if (col.type === "bool") {
    return (
      <input autoFocus type="checkbox" checked={!!value} onChange={(e) => setValue(e.target.checked)} onBlur={onCommit} onKeyDown={onKey} />
    );
  }
  if (col.type === "textarea") {
    return (
      <textarea autoFocus value={value ?? ""} onChange={(e) => setValue(e.target.value)} onBlur={onCommit} onKeyDown={onKey} rows={3} style={{ ...inputBase, resize: "vertical", minHeight: 60 }} />
    );
  }
  if (col.type === "date") {
    return (
      <input autoFocus type="date" value={value ?? ""} onChange={(e) => setValue(e.target.value)} onBlur={onCommit} onKeyDown={onKey} style={inputBase} />
    );
  }
  return (
    <input autoFocus type="text" value={value ?? ""} onChange={(e) => setValue(e.target.value)} onBlur={onCommit} onKeyDown={onKey} style={inputBase} />
  );
}

// ─── Reports Tab ─────────────────────────────────────────────────

// Sun-Sat is the team's reporting cadence. Default the report to the
// CURRENT week — the most recent Sunday through today. So Wednesday at
// noon shows Sun → Wed, Saturday shows Sun → Sat (full week), and
// Sunday morning shows just Sunday (the week starting today).
function currentWeekRange() {
  const today = new Date();
  const day = today.getDay(); // 0 = Sunday
  const lastSun = new Date(today);
  lastSun.setDate(today.getDate() - day);
  // Local-date YYYY-MM-DD. Using toISOString() here would shift to UTC,
  // showing "yesterday" for users east of UTC (AU sees the 8th when it's
  // really the 9th locally).
  const ymd = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };
  return { from: ymd(lastSun), to: ymd(today) };
}

function fmtWeekLabel(fromStr, toStr) {
  const f = new Date(fromStr);
  const t = new Date(toStr);
  const sameMonth = f.getMonth() === t.getMonth();
  const opts = { month: "short", day: "numeric" };
  if (sameMonth) {
    return `${f.toLocaleDateString("en-US", opts)} – ${t.getDate()}, ${t.getFullYear()}`;
  }
  return `${f.toLocaleDateString("en-US", opts)} – ${t.toLocaleDateString("en-US", opts)}, ${t.getFullYear()}`;
}

function ReportsTab({ role }) {
  const canView = role && ["Lead Agent","Manager","Admin","Owner"].includes(role);
  if (!canView) {
    return (
      <div style={{ background: CREAM, minHeight: "100vh", padding: "80px 24px" }}>
        <div style={{ maxWidth: 600, margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontFamily: F.serif, fontSize: 32, color: BURG, fontWeight: 600, marginBottom: 14 }}>Reports</div>
          <div style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 16, color: INK, opacity: 0.6 }}>
            Reports are visible to Lead Agent and above. Ask your lead if you need a copy of the latest summary.
          </div>
        </div>
      </div>
    );
  }
  return <WeeklySummaryView />;
}

const STAKEHOLDERS_KEY = "luma_report_stakeholders_v1";
const REPORT_RANGE_KEY = "luma_report_range_v1";

function readSavedRange() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(REPORT_RANGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.from && parsed?.to) return parsed;
  } catch {}
  return null;
}

function WeeklySummaryView() {
  // Persist whatever date range the user last picked across reloads, so
  // they don't keep landing on a default that doesn't match what they
  // were just looking at. New users (or cleared localStorage) start on
  // the current week (Sun → today).
  const init = readSavedRange() ?? currentWeekRange();
  const [from, setFrom] = useState(init.from);
  const [to, setTo] = useState(init.to);
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(REPORT_RANGE_KEY, JSON.stringify({ from, to }));
    }
  }, [from, to]);
  const [gorgias, setGorgias] = useState(null);
  const [shop, setShop] = useState(null);
  const [loop, setLoop] = useState(null);
  const [skio, setSkio] = useState(null);
  const [skioReasons, setSkioReasons] = useState(null);
  // trends state removed May 17 — the /api/insights/trends fetch was
  // routinely timing out at 280s for week-long ranges and producing
  // "Took too long" errors in the report. Section dropped from both
  // the Reports UI and the stakeholder email below.
  const [issues, setIssues] = useState([]);
  const [replacements, setReplacements] = useState([]);
  const [cancellations, setCancellations] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [adverse, setAdverse] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showSend, setShowSend] = useState(false);
  // Free-text notes attached to this report window (from/to).
  // Persisted server-side via /api/report-notes — one row per (from, to).
  const [noteRecord, setNoteRecord] = useState(null); // server state
  const [noteDraft, setNoteDraft] = useState("");     // textarea text
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteJustSaved, setNoteJustSaved] = useState(false);
  const [noteError, setNoteError] = useState(null);

  // Fetch the notes for the current window. Re-runs whenever from/to
  // changes so the textarea reflects whichever week the user picks.
  async function fetchNotes() {
    setNoteError(null);
    try {
      const res = await fetch(`/api/report-notes?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setNoteRecord(json.note);
      setNoteDraft(json.note?.body ?? "");
      setNoteJustSaved(false);
    } catch (e) {
      setNoteError(e.message);
    }
  }

  async function saveNotes() {
    setNoteSaving(true);
    setNoteError(null);
    setNoteJustSaved(false);
    try {
      const res = await fetch("/api/report-notes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from, to, body: noteDraft }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setNoteRecord(json.note);
      setNoteJustSaved(true);
      setTimeout(() => setNoteJustSaved(false), 1800);
    } catch (e) {
      setNoteError(e.message);
    } finally {
      setNoteSaving(false);
    }
  }

  useEffect(() => { fetchNotes(); }, [from, to]); // eslint-disable-line

  async function load() {
    setLoading(true);
    setErrors({});
    setGorgias(null); setShop(null); setLoop(null); setSkio(null);
    setSkioReasons(null);
    setIssues([]); setReplacements([]); setCancellations([]);
    setFeedback([]); setAdverse([]);
    // Anchor date ranges to HKT (UTC+8) — Prenetics's Gorgias account
    // timezone. This way the same date range in the Hub matches the same
    // date range in Gorgias's dashboard, regardless of where the viewer
    // is sitting. HKT doesn't observe DST so +08:00 is always correct.
    const fromIso = new Date(from + "T00:00:00+08:00").toISOString();
    const toIso   = new Date(to   + "T23:59:59+08:00").toISOString();
    // Each fetch updates state independently — fast sources render first
    // while slow ones (gorgias summary, trends, skio cancel reasons) fill
    // in as they arrive.
    // Per-fetch timeout via AbortController. Without this, one hanging
    // upstream (e.g. Gorgias under 429 backoff) blocks Promise.allSettled
    // forever and leaves the "Loading…" button permanently stuck — caught
    // on 2026-05-15 when Gorgias was rate-limited.
    //
    // Default 90s is generous for the fast endpoints (Shopify, Skio, Loop,
    // logs). Heavy endpoints get bumped via FETCH_TIMEOUT_OVERRIDES:
    //   - trends: Claude inference + Gorgias message-by-message fetches
    //     on a weekly window can legitimately take 2-4 minutes. The
    //     server-side maxDuration is 300s; we sit just under that.
    //   - gorgias summary: paginates the entire Gorgias ticket list for
    //     the window. On heavier weeks (5-10k tickets across all
    //     Prenetics brands) this needs 2-3 minutes.
    const FETCH_TIMEOUT_MS = 90_000;
    const FETCH_TIMEOUT_OVERRIDES = {
      trends:  280_000, // 4 min 40 sec — server maxDuration is 300s
      gorgias: 180_000, // 3 min — heavy Gorgias pagination on weekly windows
    };
    const fire = async (url, key, setter) => {
      const ac = new AbortController();
      const timeoutMs = FETCH_TIMEOUT_OVERRIDES[key] ?? FETCH_TIMEOUT_MS;
      const timer = setTimeout(() => ac.abort(), timeoutMs);
      try {
        const res = await fetch(url, { signal: ac.signal });
        // Read as text first so a non-JSON response (e.g. HTML 504 page
        // from the proxy when a route times out) gives us a clean error
        // instead of a cryptic "Unexpected token '<'" parse failure.
        const raw = await res.text();
        let json = null;
        try { json = raw ? JSON.parse(raw) : null; } catch { /* not JSON */ }
        if (!res.ok || !json) {
          if (res.status === 504 || res.status === 502 || res.status === 429 || (!json && raw.startsWith("<"))) {
            throw new Error(res.status === 429 ? "Rate-limited — try again in a minute." : "Timed out — try a shorter date range or refresh.");
          }
          throw new Error(json?.error || `HTTP ${res.status}`);
        }
        setter(json);
      } catch (e) {
        const msg = e.name === "AbortError"
          ? `Took too long (>${Math.round(timeoutMs / 1000)}s) — try a shorter date range or refresh.`
          : e.message;
        setErrors((cur) => ({ ...cur, [key]: msg }));
      } finally {
        clearTimeout(timer);
      }
    };
    const rows = (setter) => (j) => setter(j?.rows ?? []);
    await Promise.allSettled([
      fire(`/api/insights/summary?from=${fromIso}&to=${toIso}`,           "gorgias",       setGorgias),
      fire(`/api/insights/shopify?from=${fromIso}&to=${toIso}`,           "shop",          setShop),
      fire(`/api/insights/loop?from=${fromIso}&to=${toIso}`,              "loop",          setLoop),
      fire(`/api/insights/skio?from=${fromIso}&to=${toIso}`,              "skio",          setSkio),
      fire(`/api/insights/skio/cancel-reasons?from=${fromIso}&to=${toIso}`,"skioReasons",  setSkioReasons),
      // /api/insights/trends call removed May 17 — see trends-state
      // comment above. Endpoint left intact in case we want to bring
      // the section back once Gorgias caching improves.
      fire(`/api/logs/issues?from=${fromIso}&to=${toIso}&limit=500`,           "issues",       rows(setIssues)),
      fire(`/api/logs/replacements?from=${fromIso}&to=${toIso}&limit=500`,     "replacements", rows(setReplacements)),
      fire(`/api/logs/cancellations?from=${fromIso}&to=${toIso}&limit=500`,    "cancellations",rows(setCancellations)),
      fire(`/api/logs/feedback?from=${fromIso}&to=${toIso}&limit=500`,         "feedback",     rows(setFeedback)),
      fire(`/api/logs/adverse-reactions?from=${fromIso}&to=${toIso}&limit=500`,"adverse",      rows(setAdverse)),
    ]);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  // ── derived aggregates ──────────────────────────────────────────
  const feedbackSuggestions = feedback
    .filter((r) => r.suggestion && r.suggestion.trim().length > 0)
    .slice(0, 6);
  const reportData = {
    weekLabel: fmtWeekLabel(from, to),
    gorgias,
    shop,
    refunds: loop,
    skio,
    skioReasons,
    // trends/trendsSampleSize/trendsReadAll removed May 17 — see
    // trends-state comment above for the rationale.
    issuesByWarehouse: groupCount(issues, (r) => r.warehouse || "Unspecified"),
    issuesByCategory:  groupCount(issues, (r) => prettyEnum(r.category, ISSUE_CATEGORIES)),
    replacementsByReason:    groupCount(replacements, (r) => prettyEnum(r.reason, REPLACEMENT_REASONS)),
    replacementsByWarehouse: groupCount(replacements, (r) => r.warehouse || "Unspecified"),
    cancellationReasons: groupCount(cancellations, (r) => prettyEnum(r.cancellationType, CANCELLATION_TYPES)),
    feedbackByTheme:     groupCount(feedback, (r) => prettyEnum(r.theme, FEEDBACK_THEMES)),
    feedbackSamples:     feedback.slice(0, 6),
    feedbackSuggestions,
    adverseCount: adverse.length,
    adverseSerious: adverse.filter((r) => r.isSerious).length,
    issuesAll: issues,
    notes: noteRecord?.body ?? noteDraft ?? "",
    notesEditedByName: noteRecord?.editedByName ?? null,
    notesUpdatedAt: noteRecord?.updatedAt ?? null,
  };

  const sectionLabel = { fontFamily: F.sans, fontSize: 11, color: BURG, textTransform: "uppercase", letterSpacing: 4, fontWeight: 700, marginBottom: 14 };
  const sectionGap = { marginBottom: 32 };

  return (
    <div style={{ background: CREAM, minHeight: "100vh" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 24 }}>
          <div>
            <div style={{ fontFamily: F.sans, fontSize: 10, color: GOLD, letterSpacing: 4, textTransform: "uppercase", fontWeight: 700, marginBottom: 8 }}>LUMÉ CX Hub</div>
            <div style={{ fontFamily: F.serif, fontSize: 40, color: BURG, fontWeight: 600, lineHeight: 1.05, letterSpacing: -0.5 }}>Weekly Summary</div>
            <div style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 18, color: INK, opacity: 0.65, marginTop: 6 }}>{reportData.weekLabel}</div>
            <div style={{ fontFamily: F.sans, fontSize: 13, color: INK, opacity: 0.55, marginTop: 10, lineHeight: 1.5, maxWidth: 540 }}>Compiled from Gorgias, Shopify, and Skio. Use this to spot trends, brief stakeholders, and flag anything that needs attention before the week closes.</div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} style={{ padding: "6px 10px", border: "1px solid " + SOFT_BORDER, borderRadius: 6, fontFamily: F.sans, fontSize: 12 }} />
            <span style={{ fontFamily: F.sans, fontSize: 12, color: INK, opacity: 0.5 }}>to</span>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} style={{ padding: "6px 10px", border: "1px solid " + SOFT_BORDER, borderRadius: 6, fontFamily: F.sans, fontSize: 12 }} />
            <button onClick={load} disabled={loading} style={{ background: "transparent", color: BURG, border: "1px solid " + BURG, fontFamily: F.sans, fontSize: 11, fontWeight: 700, padding: "8px 16px", letterSpacing: 1.5, textTransform: "uppercase", cursor: loading ? "wait" : "pointer", borderRadius: 99, opacity: loading ? 0.5 : 1 }}>{loading ? "Loading..." : "Refresh"}</button>
            <button onClick={() => setShowSend(true)} style={{ background: BURG, color: CREAM, border: "1px solid " + BURG, fontFamily: F.sans, fontSize: 11, fontWeight: 700, padding: "8px 18px", letterSpacing: 1.5, textTransform: "uppercase", cursor: "pointer", borderRadius: 99 }}>Send to Stakeholders</button>
          </div>
        </div>

        {/* Key Metrics */}
        <div style={sectionGap}>
          <div style={sectionLabel}>Key metrics</div>
          <KeyMetricsBlock gorgias={gorgias} shop={shop} loop={loop} skio={skio} errors={errors} />
        </div>

        {/* Trustpilot — lifetime rating + distribution. Values
            entered by hand (no API integration). */}
        <div style={sectionGap}>
          <div style={sectionLabel}>Trustpilot</div>
          <TrustpilotReportSection />
        </div>

        {/* Refunds */}
        <div style={sectionGap}>
          <div style={sectionLabel}>Refunds</div>
          {errors.loop && <ErrorLine text={errors.loop} />}
          {loop && <RefundsSummaryBlock loop={loop} shop={shop} />}
          {!loop && !errors.loop && <SkeletonLine />}
        </div>

        {/* Subscriptions */}
        <div style={sectionGap}>
          <div style={sectionLabel}>Subscriptions (Skio)</div>
          {errors.skio && <ErrorLine text={errors.skio} />}
          {skio && <SkioSummaryBlock skio={skio} />}
          {!skio && !errors.skio && <SkeletonLine />}
          {!skioReasons && !errors.skioReasons && skio && (
            <div style={{ marginTop: 14, fontFamily: F.serif, fontStyle: "italic", fontSize: 13, color: INK, opacity: 0.4 }}>
              Loading cancellation reasons…
            </div>
          )}
          {(skioReasons?.topCancelReasons ?? []).length > 0 && (
            <div style={{ marginTop: 14, background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 10, padding: "16px 20px" }}>
              <div style={{ fontFamily: F.sans, fontSize: 11, color: BURG, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 10 }}>
                Cancellation reasons — customer-selected
                {skioReasons.totalCancelled ? <span style={{ opacity: 0.5, fontWeight: 500, marginLeft: 8 }}>· {skioReasons.totalCancelled.toLocaleString()} sessions</span> : null}
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: F.sans, fontSize: 13 }}>
                <tbody>
                  {skioReasons.topCancelReasons.map((r, i) => {
                    const pct = skioReasons.totalCancelled ? Math.round((r.count / skioReasons.totalCancelled) * 100) : 0;
                    return (
                      <tr key={i} style={{ borderBottom: i < skioReasons.topCancelReasons.length - 1 ? "1px solid " + SOFT_BORDER : "none" }}>
                        <td style={{ padding: "8px 0", color: INK }}>{r.reason}</td>
                        <td style={{ padding: "8px 0", textAlign: "right", color: BURG, fontWeight: 700, whiteSpace: "nowrap" }}>{r.count.toLocaleString()} <span style={{ color: INK, opacity: 0.4, fontSize: 11, fontWeight: 500 }}>({pct}%)</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Order Issues */}
        <div style={sectionGap}>
          <div style={sectionLabel}>Order issues by warehouse</div>
          {issues.length === 0 ? <EmptyLine text="No issues logged this week." />
            : <IssuesByWarehouseBlock issues={issues} byWarehouse={reportData.issuesByWarehouse} byCategory={reportData.issuesByCategory} />}
        </div>

        {/* Replacements */}
        <div style={sectionGap}>
          <div style={sectionLabel}>Replacements</div>
          {replacements.length === 0 ? <EmptyLine text="No replacements logged this week." />
            : (
              <CompactSummary
                count={replacements.length}
                noun="replacement"
                breakdowns={[
                  { label: "Reason", entries: reportData.replacementsByReason },
                  { label: "Warehouse", entries: reportData.replacementsByWarehouse },
                ]}
              />
            )}
        </div>

        {/* Adverse Reactions / Reaction-Concern */}
        <div style={sectionGap}>
          <div style={sectionLabel}>Reaction / Concern</div>
          {reportData.adverseCount === 0 ? (
            <EmptyLine text="No adverse reactions filed this week." />
          ) : (
            <div style={{ background: W, border: "1px solid " + (reportData.adverseSerious > 0 ? RED : SOFT_BORDER), borderLeft: "3px solid " + (reportData.adverseSerious > 0 ? RED : GOLD), borderRadius: 10, padding: "16px 20px", fontFamily: F.sans, fontSize: 14, color: INK }}>
              <strong style={{ color: BURG }}>{reportData.adverseCount}</strong> filed
              {reportData.adverseSerious > 0 && <> · <strong style={{ color: RED }}>{reportData.adverseSerious} serious (SAE)</strong></>}
              <div style={{ fontFamily: F.sans, fontSize: 12, color: INK, opacity: 0.6, marginTop: 6 }}>See Logs → Reaction/Concern for full records.</div>
            </div>
          )}
        </div>

        {/* Top Trends */}
        <div style={sectionGap}>
          <div style={sectionLabel}>Top Trends</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { rank: 1, theme: "Scalp Serum tingling queries", count: 89, note: "Customers are alarmed by the tingling sensation on first use. The product page disclaimer is not prominent enough — recommend adding an inline callout to the PDP." },
              { rank: 2, theme: "Repair Serum results timeline", count: 67, note: "Customers at weeks 2–4 expecting visible results. Education content needed at the 3-week mark — suggested send: 'Your hair journey — what to expect in week 3'." },
              { rank: 3, theme: "Hair Edit swap requests", count: 44, note: "Customers wanting to change which serums come in their next box. This is now possible via Skio — agents should offer the swap proactively on save plays." },
            ].map((t) => (
              <div key={t.rank} style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 10, padding: "14px 18px", display: "flex", gap: 14, alignItems: "flex-start" }}>
                <div style={{ fontFamily: F.serif, fontSize: 28, fontWeight: 700, color: GOLD, lineHeight: 1, minWidth: 32 }}>{t.rank}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: F.sans, fontWeight: 700, fontSize: 14, color: BURG, marginBottom: 4 }}>{t.theme} <span style={{ fontFamily: F.sans, fontSize: 12, color: INK, opacity: 0.45, fontWeight: 500 }}>· {t.count} mentions</span></div>
                  <div style={{ fontFamily: F.sans, fontSize: 13, color: INK, opacity: 0.7, lineHeight: 1.55 }}>{t.note}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Voice of Customer */}
        <div style={sectionGap}>
          <div style={sectionLabel}>Voice of Customer</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginBottom: 14 }}>
            {[
              { label: "Positive", count: 2, pct: 50, color: "#3B7A4F" },
              { label: "Constructive", count: 1, pct: 25, color: GOLD },
              { label: "Feature Request", count: 1, pct: 25, color: BURG },
            ].map((s) => (
              <div key={s.label} style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 10, padding: "14px 18px" }}>
                <div style={{ fontFamily: F.sans, fontSize: 11, fontWeight: 700, color: s.color, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 6 }}>{s.label}</div>
                <div style={{ fontFamily: F.serif, fontSize: 28, fontWeight: 700, color: BURG, lineHeight: 1 }}>{s.count}</div>
                <div style={{ fontFamily: F.sans, fontSize: 12, color: INK, opacity: 0.5, marginTop: 4 }}>{s.pct}% of logged feedback</div>
              </div>
            ))}
          </div>
          {feedback.length === 0
            ? <EmptyLine text="No feedback logged this week." />
            : <CustomerInsightsBlock byTheme={reportData.feedbackByTheme} samples={reportData.feedbackSamples} suggestions={reportData.feedbackSuggestions} total={feedback.length} />}
        </div>

        {/* Notes — free-text, per-window, persisted in Postgres
            (ReportNote model). Anything typed here gets included in
            the stakeholder email when "Send to Stakeholders" is hit. */}
        <div style={sectionGap}>
          <div style={sectionLabel}>Notes</div>
          <div style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 10, padding: "16px 20px" }}>
            <textarea
              value={noteDraft}
              onChange={(e) => { setNoteDraft(e.target.value); setNoteJustSaved(false); }}
              placeholder={"Anything worth flagging this week — e.g.\n• 2 x 1-star Trustpilot reviews about Scalp Serum\n• New batch of Hair Edit boxes arriving Thursday\n• Team catch-up Friday 10am"}
              rows={8}
              style={{
                width: "100%", boxSizing: "border-box",
                fontFamily: F.sans, fontSize: 14, color: INK, lineHeight: 1.55,
                background: CREAM, border: "1px solid " + SOFT_BORDER, borderRadius: 8,
                padding: "12px 14px", resize: "vertical", outline: "none",
              }}
              onFocus={(e) => (e.target.style.borderColor = BURG)}
              onBlur={(e) => (e.target.style.borderColor = SOFT_BORDER)}
            />
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 10, flexWrap: "wrap" }}>
              <button
                onClick={saveNotes}
                disabled={noteSaving || noteDraft === (noteRecord?.body ?? "")}
                style={{
                  background: BURG, color: CREAM, border: "1px solid " + BURG,
                  fontFamily: F.sans, fontSize: 11, fontWeight: 700, padding: "8px 18px",
                  letterSpacing: 1.5, textTransform: "uppercase",
                  cursor: noteSaving ? "wait" : "pointer", borderRadius: 99,
                  opacity: (noteSaving || noteDraft === (noteRecord?.body ?? "")) ? 0.5 : 1,
                }}
              >{noteSaving ? "Saving…" : noteJustSaved ? "Saved ✓" : "Save notes"}</button>
              {noteRecord?.editedByName && noteRecord?.updatedAt && (
                <span style={{ fontFamily: F.sans, fontSize: 11, color: INK, opacity: 0.55 }}>
                  Last edited by {noteRecord.editedByName} · {new Date(noteRecord.updatedAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                </span>
              )}
              {noteError && (
                <span style={{ fontFamily: F.sans, fontSize: 11, color: RED }}>
                  {noteError}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {showSend && (
        <SendToStakeholdersModal
          report={reportData}
          fromDate={from}
          toDate={to}
          onClose={() => setShowSend(false)}
        />
      )}
    </div>
  );
}

// ── small render helpers ──────────────────────────────────────────

function prettyEnum(value, mapList) {
  const found = mapList?.find((m) => m.value === value);
  if (found) return found.label;
  // Fallback: kebab-case → Title Case
  return String(value || "").replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function groupCount(rows, keyFn) {
  const m = new Map();
  for (const r of rows) {
    const k = keyFn(r);
    if (!k) continue;
    m.set(k, (m.get(k) || 0) + 1);
  }
  return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([key, count]) => ({ key, count }));
}

function ErrorLine({ text }) {
  return <div style={{ background: "#fee", border: "1px solid " + RED, color: RED, padding: 10, borderRadius: 8, fontFamily: F.sans, fontSize: 12 }}>{text}</div>;
}
function SkeletonLine() {
  return <div style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 10, padding: "16px 20px", fontFamily: F.serif, fontStyle: "italic", fontSize: 14, color: INK, opacity: 0.4 }}>Loading…</div>;
}
function EmptyLine({ text }) {
  return <div style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 14, color: INK, opacity: 0.5, padding: "8px 0" }}>{text}</div>;
}

// Static Trustpilot block used in the weekly report. Shows the lifetime
// rating + total + per-star percentage breakdown. All data is
// hand-entered — see TRUSTPILOT_STATS at the top of this file for how
// to refresh.
function TrustpilotReportSection() {
  const dist = TRUSTPILOT_STATS.distribution;
  const stars = [
    { n: 5, pct: dist.fiveStar, color: "#3B7A4F" },
    { n: 4, pct: dist.fourStar, color: "#3B7A4F" },
    { n: 3, pct: dist.threeStar, color: GOLD },
    { n: 2, pct: dist.twoStar, color: RED },
    { n: 1, pct: dist.oneStar, color: RED },
  ];

  return (
    <div style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 10, padding: "20px 24px" }}>
      {/* Headline */}
      <div style={{ display: "flex", alignItems: "baseline", gap: 14, flexWrap: "wrap", marginBottom: 14 }}>
        <div style={{ fontFamily: F.serif, fontSize: 32, color: BURG, fontWeight: 700, lineHeight: 1 }}>
          {TRUSTPILOT_STATS.trustScore.toFixed(1)}
        </div>
        <div style={{ fontFamily: F.sans, fontSize: 13, color: INK, opacity: 0.7 }}>
          out of 5 · {TRUSTPILOT_STATS.totalReviews.toLocaleString()} reviews
        </div>
        <a
          href={TRUSTPILOT_STATS.url}
          target="_blank"
          rel="noreferrer"
          style={{ marginLeft: "auto", fontFamily: F.sans, fontSize: 11, color: BURG, textDecoration: "underline", opacity: 0.8 }}
        >
          View on Trustpilot ↗
        </a>
      </div>

      {/* Distribution bars */}
      <div>
        {stars.map(({ n, pct, color }) => (
          <div key={n} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4, fontFamily: F.sans, fontSize: 12, color: INK }}>
            <span style={{ width: 56, color: color, fontWeight: 700 }}>{tpRenderStars(n)}</span>
            <div style={{ flex: 1, height: 10, background: CREAM, borderRadius: 99, overflow: "hidden" }}>
              <div style={{
                width: `${pct}%`,
                height: "100%",
                background: color,
                opacity: 0.85,
              }} />
            </div>
            <span style={{ width: 40, textAlign: "right", color: BURG, fontWeight: 700 }}>{pct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function RefundsSummaryBlock({ loop, shop }) {
  const ROWS = [
    { key: "Monthly",   label: "Monthly subs (≈30-day)" },
    { key: "Quarterly", label: "Quarterly subs (≈90-day)" },
    { key: "Refills",   label: "Other refills" },
    { key: "OTP",       label: "One-time" },
  ];
  const m = loop?.matrix ?? {};
  const directCount = shop?.refunded != null && loop?.count != null
    ? Math.max(0, shop.refunded - loop.count)
    : null;
  const directAmount = shop?.refundAmount != null && loop?.total != null
    ? Math.max(0, shop.refundAmount - loop.total)
    : null;
  const totalCount = shop?.refunded ?? loop?.count ?? 0;
  const totalAmount = shop?.refundAmount ?? loop?.total ?? 0;

  return (
    <div style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 10, padding: "20px 24px" }}>
      <div style={{ fontFamily: F.serif, fontSize: 28, color: BURG, fontWeight: 700 }}>
        {formatMoney(totalAmount)} <span style={{ fontSize: 16, color: INK, opacity: 0.55, fontWeight: 500 }}>· {totalCount.toLocaleString()} refunds</span>
      </div>
      <div style={{ fontFamily: F.sans, fontSize: 12, color: INK, opacity: 0.6, marginBottom: directCount != null && directCount > 0 && directAmount === 0 ? 6 : 16 }}>
        {loop?.count ?? 0} customer-initiated ({formatMoney(loop?.total)}){directCount != null ? ` · ${directCount.toLocaleString()} direct in Shopify (${formatMoney(directAmount)})` : ""}
      </div>
      {/* Same $0-direct-cases disclaimer as the Insights tab — see
          LoopRefundsCard for full context. */}
      {directCount != null && directCount > 0 && directAmount === 0 && (
        <div style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 11, color: INK, opacity: 0.55, marginBottom: 16, maxWidth: 720, lineHeight: 1.4 }}>
          Some Shopify "refund" events recorded with $0 — typically orders cancelled due to payment failure, store-credit refunds, or foreign-currency refunds (where Shopify doesn't return a USD-normalised amount). Counted as cases but not added to the dollar total.
        </div>
      )}
      <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: F.sans, fontSize: 12 }}>
        <thead>
          <tr style={{ background: CREAM }}>
            <th style={{ padding: "10px 12px", textAlign: "left", color: "#999", fontWeight: 600 }}>Category</th>
            <th style={{ padding: "10px 12px", textAlign: "right", color: "#999", fontWeight: 600 }}>Cases</th>
            <th style={{ padding: "10px 12px", textAlign: "right", color: "#999", fontWeight: 600 }}>Total $</th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map((r, i) => {
            const c = m[r.key] ?? { count: 0, amount: 0 };
            return (
              <tr key={r.key} style={{ background: i % 2 === 0 ? W : "#fdfbf9" }}>
                <td style={{ padding: "10px 12px", color: BURG, fontWeight: 600 }}>{r.label}</td>
                <td style={{ padding: "10px 12px", textAlign: "right", color: INK }}>{c.count}</td>
                <td style={{ padding: "10px 12px", textAlign: "right", color: BURG, fontWeight: 700 }}>{formatMoney(c.amount)}</td>
              </tr>
            );
          })}
          {directCount != null && (
            <tr style={{ background: "#fdfbf9" }}>
              <td style={{ padding: "10px 12px", color: BURG, fontWeight: 600, fontStyle: "italic" }}>Processed directly in Shopify</td>
              <td style={{ padding: "10px 12px", textAlign: "right", color: INK }}>{directCount}</td>
              <td style={{ padding: "10px 12px", textAlign: "right", color: BURG, fontWeight: 700 }}>{formatMoney(directAmount)}</td>
            </tr>
          )}
          {shop?.refunded != null && (
            <tr style={{ background: BURG, color: CREAM }}>
              <td style={{ padding: "10px 12px", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", fontSize: 11 }}>Total (all sources)</td>
              <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700 }}>{shop.refunded.toLocaleString()}</td>
              <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, color: GOLD }}>{formatMoney(totalAmount)}</td>
            </tr>
          )}
        </tbody>
      </table>
      {(loop?.topReasons ?? []).length > 0 && (
        <div style={{ marginTop: 16, background: CREAM, borderRadius: 8, padding: "12px 14px" }}>
          <div style={{ fontFamily: F.sans, fontSize: 11, color: BURG, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>Top 3 refund reasons (from Loop)</div>
          {loop.topReasons.map((rr, j) => (
            <div key={j} style={{ display: "flex", justifyContent: "space-between", fontFamily: F.sans, fontSize: 13, color: INK, padding: "2px 0" }}>
              <span>{rr.reason}</span>
              <span style={{ color: BURG, fontWeight: 700 }}>{rr.count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Loop Returns operations summary — submitted volume, processed %,
// state breakdown, labels generated, handling fees, and the keep-item
// (refund-before-inspection) share. Pulls from /api/insights/loop's new
// `operations` payload (added 2026-05-15). Numbers won't exactly match
// Loop dashboard's "Last week" view — it uses a different (undisclosed)
// window definition; we use the report's Sun→today window for internal
// consistency with the rest of the weekly summary.
function LoopOperationsBlock({ loop }) {
  const ops = loop?.operations;
  if (!ops || ops.submitted === 0) {
    return (
      <div style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 10, padding: "20px 24px", fontFamily: F.serif, fontStyle: "italic", fontSize: 14, color: INK, opacity: 0.6 }}>
        No Loop returns in this window.
      </div>
    );
  }

  const tile = (label, value, hint) => (
    <div style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 10, padding: "14px 18px" }}>
      <div style={{ fontFamily: F.sans, fontSize: 10, color: INK, opacity: 0.55, letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 700, marginBottom: 4 }}>{label}</div>
      <div style={{ fontFamily: F.serif, fontSize: 22, color: BURG, fontWeight: 700 }}>{value}</div>
      {hint && <div style={{ fontFamily: F.sans, fontSize: 11, color: INK, opacity: 0.55, marginTop: 4 }}>{hint}</div>}
    </div>
  );

  const pct = (n, d) => d > 0 ? `${Math.round((n / d) * 1000) / 10}%` : "—";
  const unprocessed = ops.submitted - ops.processed;
  const open = ops.byState?.open ?? 0;
  const cancelled = ops.byState?.cancelled ?? 0;

  return (
    <div style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 10, padding: "20px 24px" }}>
      {/* Headline */}
      <div style={{ fontFamily: F.serif, fontSize: 28, color: BURG, fontWeight: 700 }}>
        {ops.submitted.toLocaleString()} <span style={{ fontSize: 16, color: INK, opacity: 0.55, fontWeight: 500 }}>returns submitted</span>
      </div>
      <div style={{ fontFamily: F.sans, fontSize: 12, color: INK, opacity: 0.6, marginBottom: 16 }}>
        {ops.processed.toLocaleString()} fully processed ({pct(ops.processed, ops.submitted)}) ·
        {" "}{unprocessed.toLocaleString()} remaining
        {unprocessed > 0 && (open > 0 || cancelled > 0)
          ? ` (${open > 0 ? `${open} awaiting return shipment` : ""}${open > 0 && cancelled > 0 ? ", " : ""}${cancelled > 0 ? `${cancelled} cancelled / abandoned` : ""})`
          : ""}
      </div>

      {/* Tile row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10, marginBottom: 14 }}>
        {tile("Submitted", ops.submitted.toLocaleString(), "in window")}
        {tile("Processed", ops.processed.toLocaleString(), pct(ops.processed, ops.submitted) + " of submitted")}
        {tile("Awaiting ship-back", open.toLocaleString(), "state = open")}
        {tile("Cancelled / abandoned", cancelled.toLocaleString(), "did not complete")}
        {tile("Labels generated", ops.labelsGenerated.toLocaleString(), pct(ops.labelsGenerated, ops.submitted) + " of submitted")}
        {tile("Handling fees", formatMoney(ops.handlingFeesTotal), "across all returns · customer-paid vs IM8-paid split TBC with Loop")}
      </div>

      {/* Keep-item / return-required ROI line — Cherie's policy comparison.
          Keep-item = returns where no label was generated AND not cancelled
          (i.e. customer got refunded without shipping anything back). The
          three buckets (keep-item, labels generated, cancelled) sum to total
          submitted — the tile row above shows each one separately. */}
      {ops.keepItemCount > 0 && (
        <div style={{ background: CREAM, borderRadius: 8, padding: "10px 14px", fontFamily: F.sans, fontSize: 12, color: INK }}>
          <span style={{ color: BURG, fontWeight: 700 }}>{ops.keepItemCount.toLocaleString()}</span> of {ops.submitted.toLocaleString()} returns
          ({pct(ops.keepItemCount, ops.submitted)}) were processed under the <strong>keep-item</strong> policy —
          refunded without requiring return shipment. The remaining {ops.labelsGenerated.toLocaleString()} had labels generated for return
          {(ops.byState?.cancelled ?? 0) > 0 ? `, and ${ops.byState.cancelled} were cancelled / abandoned` : ""}.
        </div>
      )}

      <div style={{ marginTop: 10, fontFamily: F.serif, fontStyle: "italic", fontSize: 11, color: INK, opacity: 0.45 }}>
        Loop costs split (customer-covered vs IM8-covered) to be confirmed with Loop. Tracking for return-required policy ROI vs keep-item approach.
      </div>
    </div>
  );
}

function SkioSummaryBlock({ skio }) {
  const tile = (label, value, hint) => (
    <div style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 10, padding: "14px 18px" }}>
      <div style={{ fontFamily: F.sans, fontSize: 10, color: INK, opacity: 0.55, letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 700, marginBottom: 4 }}>{label}</div>
      <div style={{ fontFamily: F.serif, fontSize: 22, color: BURG, fontWeight: 700 }}>{value}</div>
      {hint && <div style={{ fontFamily: F.sans, fontSize: 11, color: INK, opacity: 0.55, marginTop: 4 }}>{hint}</div>}
    </div>
  );
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
      {tile("Active subs", skio?.active != null ? skio.active.toLocaleString() : "—", skio?.paused != null ? `${skio.paused.toLocaleString()} paused` : null)}
      {tile("Churn rate", skio?.churnRate != null ? `${(skio.churnRate * 100).toFixed(2)}%` : "—", skio?.activeAtStart ? `${skio.cancelled} of ${skio.activeAtStart.toLocaleString()} at start` : null)}
      {tile("Cancellations", skio?.cancelled?.toLocaleString() ?? "—", "in range")}
      {tile("New subs", skio?.created?.toLocaleString() ?? "—", skio?.netChange != null ? `${skio.netChange >= 0 ? "+" : ""}${skio.netChange.toLocaleString()} net` : null)}
      {tile("Failed payments", skio?.failedPayments?.toLocaleString() ?? "—", "in range")}
    </div>
  );
}

function CountBreakdown({ entries, total }) {
  return (
    <div style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 10, padding: "12px 16px" }}>
      {entries.map((e) => {
        const pct = total ? Math.round((e.count / total) * 100) : 0;
        return (
          <div key={e.key} style={{ padding: "6px 0", borderBottom: "1px solid " + SOFT_BORDER, fontFamily: F.sans, fontSize: 13, color: INK }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: BURG, fontWeight: 600 }}>{e.key}</span>
              <span style={{ color: BURG, fontWeight: 700 }}>{e.count} <span style={{ color: INK, opacity: 0.4, fontSize: 11, fontWeight: 500 }}>({pct}%)</span></span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CountCard({ title, entries, total }) {
  return (
    <div style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 10, padding: "14px 18px" }}>
      <div style={{ fontFamily: F.sans, fontSize: 11, color: BURG, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>{title}</div>
      {entries.slice(0, 8).map((e) => (
        <div key={e.key} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", fontFamily: F.sans, fontSize: 13, color: INK }}>
          <span>{e.key}</span>
          <span style={{ color: BURG, fontWeight: 700 }}>{e.count}</span>
        </div>
      ))}
    </div>
  );
}

function IssuesByWarehouseBlock({ issues, byWarehouse, byCategory }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <CompactSummary
        count={issues.length}
        noun="order issue"
        breakdowns={[
          { label: "Warehouse", entries: byWarehouse },
          { label: "Category",  entries: byCategory },
        ]}
        footer={
          <button onClick={() => setOpen((o) => !o)} style={{ background: "transparent", border: "1px solid " + SOFT_BORDER, fontFamily: F.sans, fontSize: 11, fontWeight: 700, color: BURG, padding: "6px 14px", letterSpacing: 1.5, textTransform: "uppercase", borderRadius: 99, cursor: "pointer", marginTop: 12 }}>
            {open ? "Hide" : "Show"} per-ticket detail
          </button>
        }
      />
      {open && (
        <div style={{ marginTop: 8, background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 10, padding: "12px 18px" }}>
          {issues.map((r, i) => (
            <div key={r.id} style={{ padding: "8px 0", borderBottom: i < issues.length - 1 ? "1px solid " + SOFT_BORDER : "none", fontFamily: F.sans, fontSize: 12, color: INK }}>
              <strong style={{ color: BURG }}>{r.orderId}</strong>
              <span style={{ color: INK, opacity: 0.6 }}> — {prettyEnum(r.category, ISSUE_CATEGORIES)}{r.warehouse ? " · " + r.warehouse : ""}</span>
              <div style={{ marginTop: 2 }}>{r.description}</div>
              {r.itemsAffected?.length > 0 && <div style={{ opacity: 0.55, fontSize: 11, marginTop: 2 }}>Items: {r.itemsAffected.join(", ")}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Compact summary block used by Order Issues / Replacements / etc.
// Renders headline count + each breakdown as a single line of pill chips.
// Reads cleanly whether there's 1 entry or 50.
function CompactSummary({ count, noun, breakdowns, footer }) {
  return (
    <div style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 10, padding: "16px 20px" }}>
      <div style={{ fontFamily: F.serif, fontSize: 22, color: BURG, fontWeight: 700, marginBottom: breakdowns.length ? 12 : 0 }}>
        {count.toLocaleString()} <span style={{ fontSize: 14, color: INK, opacity: 0.55, fontWeight: 500 }}>{noun}{count === 1 ? "" : "s"} this week</span>
      </div>
      {breakdowns.map(({ label, entries }, i) => (
        entries.length > 0 && (
          <div key={i} style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6, padding: "4px 0", fontFamily: F.sans, fontSize: 12 }}>
            <span style={{ color: INK, opacity: 0.55, letterSpacing: 1, textTransform: "uppercase", fontSize: 10, fontWeight: 700, marginRight: 4 }}>{label}</span>
            {entries.slice(0, 8).map((e) => (
              <span key={e.key} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: CREAM, color: BURG, padding: "4px 10px", borderRadius: 99, fontWeight: 600 }}>
                <span>{e.key}</span>
                <span style={{ color: BURG, opacity: 0.55, fontWeight: 500 }}>{e.count}</span>
              </span>
            ))}
            {entries.length > 8 && (
              <span style={{ color: INK, opacity: 0.5, fontSize: 11 }}>+{entries.length - 8} more</span>
            )}
          </div>
        )
      ))}
      {footer}
    </div>
  );
}

function KeyMetricsBlock({ gorgias, shop, loop, skio, errors }) {
  const tile = (label, value, hint, accent) => (
    <div style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 10, padding: "12px 16px" }}>
      <div style={{ fontFamily: F.sans, fontSize: 9, color: INK, opacity: 0.55, letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 700, marginBottom: 4 }}>{label}</div>
      <div style={{ fontFamily: F.serif, fontSize: 22, color: accent || BURG, fontWeight: 700, lineHeight: 1.1 }}>{value}</div>
      {hint && <div style={{ fontFamily: F.sans, fontSize: 10, color: INK, opacity: 0.5, marginTop: 4 }}>{hint}</div>}
    </div>
  );
  const num = (v) => v == null || !Number.isFinite(Number(v)) ? "—" : Number(v).toLocaleString();
  const pct = (v) => v == null || !Number.isFinite(Number(v)) ? "—" : `${(Number(v) * 100).toFixed(2)}%`;
  const dur = (s) => formatDuration(s);

  // Refunds + rate sourced from Shopify (system of record across Loop and
  // direct-Shopify refunds — Loop processes through Shopify's API so
  // Shopify's totals already include Loop-initiated refunds). Loop's own
  // count is the *subset* of refunds that originated via the Loop portal;
  // we surface the breakdown in the hint so it's obvious the headline
  // number is combined, not Loop-only.
  const totalRefunds = shop?.refunded;
  const directShopify = shop?.refunded != null && loop?.count != null
    ? Math.max(0, shop.refunded - loop.count)
    : null;

  // Compose the refunds-tile hint to ALWAYS surface both the $ total and
  // the Loop/direct split when both are available. Previously the hint
  // showed either $ or split — never both — which made "Refunds: 52"
  // ambiguous (Cherie May 18: easy to read as Loop-only).
  const refundHintParts = [];
  if (shop?.refundAmount != null) refundHintParts.push(formatMoney(shop.refundAmount));
  if (loop?.count != null && directShopify != null) {
    refundHintParts.push(`${num(loop.count)} customer-initiated + ${num(directShopify)} direct`);
  }
  const refundHint = refundHintParts.length ? refundHintParts.join(" · ") : null;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10 }}>
      {tile("Tickets", num(gorgias?.volume), gorgias?.totalAcrossBrands ? `${num(gorgias.totalAcrossBrands)} all brands` : null)}
      {tile("Open", num(gorgias?.byStatus?.open))}
      {tile("Closed", num(gorgias?.byStatus?.closed))}
      {tile("CSAT", gorgias?.csat?.average != null ? gorgias.csat.average.toFixed(2) : "—", gorgias?.csat?.count ? `${gorgias.csat.count} responses` : null)}
      {tile("Resolution", dur(gorgias?.resolution?.avgSeconds), gorgias?.resolution?.count ? `${gorgias.resolution.count} closed` : null)}
      {tile("Msgs / ticket", gorgias?.mpt?.average != null ? gorgias.mpt.average.toFixed(1) : "—")}
      {tile("Orders", num(shop?.orders))}
      {tile("Refunds", num(totalRefunds), refundHint)}
      {tile(
        "Refund rate ($)",
        pct(shop?.refundRateDollars ?? shop?.refundRate),
        shop?.refundRate != null ? `${(shop.refundRate * 100).toFixed(2)}% by count` : null
      )}
      {tile("Active subs", num(skio?.active), skio?.paused != null ? `${num(skio.paused)} paused` : null)}
      {tile("Cancellations", num(skio?.cancelled), "in range")}
      {tile("Churn rate", pct(skio?.churnRate))}
    </div>
  );
}

function TrendsBlock({ trends, sampleSize, totalTickets, readAll }) {
  if (!trends || trends.length === 0) {
    return <EmptyLine text="No trends found in this range." />;
  }
  return (
    <div style={{ background: "linear-gradient(160deg," + W + " 0%,#fbf6ef 100%)", border: "1px solid " + GOLD, borderRadius: 10, padding: "20px 24px" }}>
      <div style={{ fontFamily: F.sans, fontSize: 12, color: BURG, fontWeight: 700, marginBottom: 12 }}>
        🚨 3 trends to watch:
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {trends.map((t, i) => <TrendItem key={i} index={i + 1} trend={t} />)}
      </div>
      {sampleSize ? (
        <div style={{ fontFamily: F.sans, fontSize: 11, color: INK, opacity: 0.5, marginTop: 12 }}>
          {readAll
            ? `Read every customer message: ${sampleSize} of ${totalTickets ?? "?"} tickets — counts are exact.`
            : `Read ${sampleSize} customer messages of ${totalTickets ?? "?"} total — counts are estimated from the sample.`}
        </div>
      ) : null}
    </div>
  );
}

function CustomerInsightsBlock({ byTheme, samples, suggestions, total }) {
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 16, marginBottom: 16 }}>
        <CountCard title="Themes" entries={byTheme} total={total} />
        <div style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 10, padding: "14px 18px" }}>
          <div style={{ fontFamily: F.sans, fontSize: 11, color: BURG, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>Recent samples</div>
          {samples.map((r) => (
            <div key={r.id} style={{ padding: "6px 0", borderBottom: "1px solid " + SOFT_BORDER, fontFamily: F.sans, fontSize: 12, color: INK }}>
              <div style={{ color: BURG, fontWeight: 600 }}>{prettyEnum(r.theme, FEEDBACK_THEMES)}{r.relatedTeam ? " · " + r.relatedTeam : ""}</div>
              <div style={{ marginTop: 2 }}>{r.details}</div>
            </div>
          ))}
        </div>
      </div>
      {suggestions.length > 0 && (
        <div style={{ background: CREAM, borderRadius: 10, padding: "14px 18px" }}>
          <div style={{ fontFamily: F.sans, fontSize: 11, color: BURG, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>Ways to improve (agent suggestions)</div>
          {suggestions.map((s) => (
            <div key={s.id} style={{ padding: "5px 0", fontFamily: F.sans, fontSize: 13, color: INK, lineHeight: 1.5 }}>
              <span style={{ color: GOLD, fontWeight: 700, marginRight: 8 }}>→</span>
              <span>{s.suggestion}</span>
              <span style={{ color: INK, opacity: 0.5, fontSize: 11, marginLeft: 8 }}>— {prettyEnum(s.theme, FEEDBACK_THEMES)}{s.relatedTeam ? " / " + s.relatedTeam : ""}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FeedbackBlock({ byTheme, samples, total }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 16 }}>
      <CountCard title="By theme" entries={byTheme} total={total} />
      <div style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 10, padding: "14px 18px" }}>
        <div style={{ fontFamily: F.sans, fontSize: 11, color: BURG, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>Recent samples</div>
        {samples.map((r) => (
          <div key={r.id} style={{ padding: "6px 0", borderBottom: "1px solid " + SOFT_BORDER, fontFamily: F.sans, fontSize: 12, color: INK }}>
            <div style={{ color: BURG, fontWeight: 600 }}>{r.theme}{r.relatedTeam ? " · " + r.relatedTeam : ""}</div>
            <div style={{ marginTop: 2 }}>{r.details}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Send to Stakeholders modal ────────────────────────────────────

function buildPlainTextEmail(d) {
  const lines = [];
  const fmtNum = (v) => v == null || !Number.isFinite(Number(v)) ? "—" : Number(v).toLocaleString();
  const fmtPct = (v) => v == null || !Number.isFinite(Number(v)) ? "—" : `${(Number(v) * 100).toFixed(2)}%`;

  lines.push(`Hi team,`);
  lines.push(``);
  lines.push(`LUMÉ CX weekly summary —${d.weekLabel}.`);
  lines.push(``);

  // KEY METRICS
  lines.push(`KEY METRICS`);
  if (d.gorgias) {
    lines.push(`  Tickets: ${fmtNum(d.gorgias.volume)} (${fmtNum(d.gorgias.byStatus?.open)} open, ${fmtNum(d.gorgias.byStatus?.closed)} closed)`);
    if (d.gorgias.csat?.average != null) lines.push(`  CSAT: ${d.gorgias.csat.average.toFixed(2)} (${d.gorgias.csat.count} responses)`);
    if (d.gorgias.resolution?.avgSeconds != null) lines.push(`  Resolution time: ${formatDuration(d.gorgias.resolution.avgSeconds)}`);
    if (d.gorgias.mpt?.average != null) lines.push(`  Msgs / ticket: ${d.gorgias.mpt.average.toFixed(1)}`);
  }
  if (d.shop) lines.push(`  Orders: ${fmtNum(d.shop.orders)}`);
  if (d.refunds) {
    // $-rate first (gross-based, the standard ecommerce metric); count
    // rate as the secondary tag so volume planners can still see it.
    const dollarRate = d.shop?.refundRateDollars ?? null;
    const countRate = d.shop?.refundRate ?? (d.refunds.count && d.shop?.orders ? d.refunds.count / d.shop.orders : null);
    const rateBits = [];
    if (dollarRate != null) rateBits.push(`${fmtPct(dollarRate)} ($)`);
    if (countRate != null) rateBits.push(`${fmtPct(countRate)} by count`);
    const rateStr = rateBits.length ? ` · ${rateBits.join(" / ")}` : "";
    lines.push(`  Refunds: ${fmtNum(d.refunds.count)} (${formatMoney(d.refunds.total)})${rateStr}`);
  }
  if (d.skio) {
    lines.push(`  Active subs: ${fmtNum(d.skio.active)}${d.skio.paused != null ? ` (${fmtNum(d.skio.paused)} paused)` : ""}`);
    lines.push(`  Cancellations: ${fmtNum(d.skio.cancelled)} · Churn ${fmtPct(d.skio.churnRate)}`);
  }
  lines.push(``);

  if (d.refunds) {
    const totalRefunds = d.shop?.refunded ?? d.refunds.count ?? 0;
    const totalAmount = d.shop?.refundAmount ?? d.refunds.total ?? 0;
    const directCount = d.shop?.refunded != null && d.refunds?.count != null
      ? Math.max(0, d.shop.refunded - d.refunds.count) : null;
    const directAmount = d.shop?.refundAmount != null && d.refunds?.total != null
      ? Math.max(0, d.shop.refundAmount - d.refunds.total) : null;
    lines.push(`REFUNDS`);
    lines.push(`Total: ${formatMoney(totalAmount)} (${totalRefunds} cases${d.shop?.refundRate != null ? `, rate ${(d.shop.refundRate * 100).toFixed(2)}%` : ""})`);
    lines.push(`  · ${d.refunds.count ?? 0} customer-initiated (${formatMoney(d.refunds.total)})`);
    if (directCount != null) lines.push(`  · ${directCount} direct in Shopify (${formatMoney(directAmount)})`);
    const m = d.refunds.matrix ?? {};
    for (const k of ["Monthly","Quarterly","Refills","OTP"]) {
      const c = m[k];
      if (c?.count) lines.push(`  · ${k}: ${c.count} cases / ${formatMoney(c.amount)}`);
    }
    if ((d.refunds.topReasons ?? []).length) {
      lines.push(`Top 3 reasons:`);
      d.refunds.topReasons.forEach((rr) => lines.push(`  · ${rr.reason} — ${rr.count}`));
    }
    lines.push(``);
  }
  if (d.skio) {
    lines.push(`SUBSCRIPTIONS (Skio)`);
    if (d.skio.active != null)        lines.push(`Active: ${d.skio.active.toLocaleString()}${d.skio.paused != null ? ` (${d.skio.paused.toLocaleString()} paused)` : ""}`);
    if (d.skio.churnRate != null)     lines.push(`Churn: ${(d.skio.churnRate * 100).toFixed(2)}%`);
    if (d.skio.cancelled != null)     lines.push(`Cancellations: ${d.skio.cancelled.toLocaleString()}`);
    if (d.skio.created != null)       lines.push(`New subs: ${d.skio.created.toLocaleString()}`);
    if (d.skio.failedPayments != null)lines.push(`Failed payments: ${d.skio.failedPayments.toLocaleString()}`);
    if ((d.skioReasons?.topCancelReasons ?? []).length > 0) {
      lines.push(`Cancellation reasons — customer-selected${d.skioReasons.totalCancelled ? ` (${d.skioReasons.totalCancelled.toLocaleString()} sessions)` : ""}:`);
      d.skioReasons.topCancelReasons.slice(0, 10).forEach((e) => lines.push(`  · ${e.reason}: ${e.count}`));
    }
    lines.push(``);
  }
  if (d.issuesAll?.length) {
    lines.push(`ORDER ISSUES (${d.issuesAll.length} this week)`);
    d.issuesByWarehouse.forEach((e) => lines.push(`  · ${e.key}: ${e.count}`));
    lines.push(`Categories:`);
    d.issuesByCategory.slice(0, 5).forEach((e) => lines.push(`  · ${e.key}: ${e.count}`));
    lines.push(``);
  }
  if (d.replacementsByReason.length) {
    lines.push(`REPLACEMENTS`);
    lines.push(`By reason:`);
    d.replacementsByReason.slice(0, 5).forEach((e) => lines.push(`  · ${e.key}: ${e.count}`));
    if (d.replacementsByWarehouse.length) {
      lines.push(`By warehouse:`);
      d.replacementsByWarehouse.slice(0, 5).forEach((e) => lines.push(`  · ${e.key}: ${e.count}`));
    }
    lines.push(``);
  }
  if (d.adverseCount > 0) {
    lines.push(`ADVERSE REACTIONS`);
    lines.push(`${d.adverseCount} filed${d.adverseSerious > 0 ? ` (${d.adverseSerious} serious)` : ""}`);
    lines.push(``);
  }
  if ((d.trends ?? []).length) {
    lines.push(`TOP 3 TRENDS`);
    lines.push(`(3 trends to watch)`);
    lines.push(``);
    d.trends.forEach((t, i) => {
      const head = t.estTotal > 0
        ? `${i + 1}. ${t.title} — ~${t.estTotal.toLocaleString()} tickets${t.estPct > 0 ? ` (~${t.estPct}% of volume)` : ""}`
        : `${i + 1}. ${t.title}`;
      lines.push(head);
      (t.quotes ?? []).forEach((q, j) => {
        const tid = t.quoteTicketIds?.[j];
        const suffix = tid ? `  [#${tid}: https://prenetics.gorgias.com/app/ticket/${tid}]` : "";
        lines.push(`   "${q}"${suffix}`);
      });
      if (t.signal) lines.push(`   Signal: ${t.signal}`);
      if (t.action) lines.push(`   Action: ${t.action}`);
      lines.push(``);
    });
    if (d.trendsSampleSize) {
      lines.push(d.trendsReadAll
        ? `(read every customer message: ${d.trendsSampleSize} tickets; counts exact)`
        : `(read ${d.trendsSampleSize} customer messages; counts estimated from sample)`);
    }
    lines.push(``);
  }
  if (d.feedbackByTheme.length) {
    lines.push(`CUSTOMER INSIGHTS`);
    lines.push(`Themes:`);
    d.feedbackByTheme.slice(0, 5).forEach((e) => lines.push(`  · ${e.key}: ${e.count}`));
    if (d.feedbackSuggestions?.length) {
      lines.push(`Ways to improve (agent suggestions):`);
      d.feedbackSuggestions.forEach((s) => lines.push(`  → ${s.suggestion} (${prettyEnum(s.theme, FEEDBACK_THEMES)}${s.relatedTeam ? " / " + s.relatedTeam : ""})`));
    }
    lines.push(``);
  }
  if (d.notes && d.notes.trim().length > 0) {
    lines.push(`NOTES`);
    // Preserve the author's own formatting (line breaks, bullets, dashes).
    d.notes.split(/\r?\n/).forEach((ln) => lines.push(ln));
    lines.push(``);
  }
  lines.push(`— Sent from LUMÉ CX Hub`);
  return lines.join("\n");
}

function buildHtmlEmail(d) {
  const wrapStyle = "font-family:Arial,sans-serif;color:#3A2F2C;max-width:680px;line-height:1.5;";
  const h2 = `font-family:Georgia,serif;color:#50000B;margin:24px 0 6px;font-size:18px;letter-spacing:0.3px;`;
  const tag = `display:inline-block;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#C8973A;font-weight:700;`;
  const td = `padding:6px 10px;border-bottom:1px solid #EDE3D8;font-size:13px;`;
  const tdR = td + "text-align:right;";
  const out = [];
  const fmtNum = (v) => v == null || !Number.isFinite(Number(v)) ? "—" : Number(v).toLocaleString();
  const fmtPct = (v) => v == null || !Number.isFinite(Number(v)) ? "—" : `${(Number(v) * 100).toFixed(2)}%`;
  out.push(`<div style="${wrapStyle}">`);
  out.push(`<p>Hi team,</p>`);
  out.push(`<p style="font-style:italic;color:#5a4f4a;">LUMÉ CX weekly summary —<strong>${d.weekLabel}</strong>.</p>`);

  // Key metrics tile grid. Filter out tiles with no real value ("—") so
  // empty cells don't show as awkward gaps in the email — Cherie flagged
  // those as visual noise. Also collapses unfilled rows entirely.
  out.push(`<div style="${tag};margin-top:8px;">Key metrics</div>`);
  const allMetrics = [
    ["Tickets", fmtNum(d.gorgias?.volume)],
    ["Open", fmtNum(d.gorgias?.byStatus?.open)],
    ["Closed", fmtNum(d.gorgias?.byStatus?.closed)],
    ["CSAT", d.gorgias?.csat?.average != null ? d.gorgias.csat.average.toFixed(2) : "—"],
    ["Resolution", d.gorgias?.resolution?.avgSeconds != null ? formatDuration(d.gorgias.resolution.avgSeconds) : "—"],
    ["Msgs / ticket", d.gorgias?.mpt?.average != null ? d.gorgias.mpt.average.toFixed(1) : "—"],
    ["Orders", fmtNum(d.shop?.orders)],
    ["Refunds", fmtNum(d.refunds?.count)],
    ["Refund rate ($)", fmtPct(d.shop?.refundRateDollars ?? null)],
    ["Refund rate (#)", fmtPct(d.shop?.refundRate ?? (d.refunds?.count && d.shop?.orders ? d.refunds.count / d.shop.orders : null))],
    ["Active subs", fmtNum(d.skio?.active)],
    ["Cancellations", fmtNum(d.skio?.cancelled)],
    ["Churn rate", fmtPct(d.skio?.churnRate)],
  ];
  const metrics = allMetrics.filter(([_, v]) => v != null && v !== "—" && v !== "");
  out.push(`<table style="border-collapse:collapse;width:100%;margin-top:6px;">`);
  for (let i = 0; i < metrics.length; i += 4) {
    out.push(`<tr>`);
    const rowItems = metrics.slice(i, i + 4);
    rowItems.forEach((m) => {
      out.push(`<td style="${td};border-right:1px solid #EDE3D8;"><div style="font-size:9px;color:#999;text-transform:uppercase;letter-spacing:1px;font-weight:700;">${m[0]}</div><div style="font-family:Georgia,serif;color:#50000B;font-weight:700;font-size:18px;">${m[1]}</div></td>`);
    });
    out.push(`</tr>`);
  }
  out.push(`</table>`);

  if (d.refunds) {
    const totalRefunds = d.shop?.refunded ?? d.refunds.count ?? 0;
    const totalAmount = d.shop?.refundAmount ?? d.refunds.total ?? 0;
    const directCount = d.shop?.refunded != null && d.refunds?.count != null
      ? Math.max(0, d.shop.refunded - d.refunds.count) : null;
    const directAmount = d.shop?.refundAmount != null && d.refunds?.total != null
      ? Math.max(0, d.shop.refundAmount - d.refunds.total) : null;
    // Extra top margin pushes the heading down ~2 rows from Key Metrics
    // for breathing room. The h2 right below it gets margin:0 instead of
    // the default top spacing so the $ total hugs the heading.
    out.push(`<div style="${tag};margin-top:32px;">Refunds</div>`);
    {
      const rateBits = [];
      if (d.shop?.refundRateDollars != null) rateBits.push(`${(d.shop.refundRateDollars * 100).toFixed(2)}% ($)`);
      if (d.shop?.refundRate != null) rateBits.push(`${(d.shop.refundRate * 100).toFixed(2)}% by count`);
      const rateStr = rateBits.length ? ` · rate ${rateBits.join(" / ")}` : "";
      // Tight h2: 4px top margin (was 24) so the total hugs "Refunds".
      out.push(`<h2 style="font-family:Georgia,serif;color:#50000B;margin:4px 0 6px;font-size:18px;letter-spacing:0.3px;">${formatMoney(totalAmount)} <span style="color:#999;font-weight:400;font-size:13px;">· ${totalRefunds} cases${rateStr}</span></h2>`);
    }
    out.push(`<p style="margin:0 0 8px;font-size:12px;color:#5a4f4a;">${d.refunds.count ?? 0} customer-initiated (${formatMoney(d.refunds.total)})${directCount != null ? ` · ${directCount} direct in Shopify (${formatMoney(directAmount)})` : ""}</p>`);
    out.push(`<table style="border-collapse:collapse;width:100%;margin-top:8px;">`);
    out.push(`<tr style="background:#F5F0EB;"><td style="${td};color:#999;">Category</td><td style="${tdR};color:#999;">Cases</td><td style="${tdR};color:#999;">Total $</td></tr>`);
    const m = d.refunds.matrix ?? {};
    const ROWS = [["Monthly","Monthly subs"],["Quarterly","Quarterly subs"],["Refills","Other refills"],["OTP","One-time"]];
    ROWS.forEach(([k, label]) => {
      const c = m[k] ?? { count: 0, amount: 0 };
      out.push(`<tr><td style="${td};color:#50000B;font-weight:600;">${label}</td><td style="${tdR}">${c.count}</td><td style="${tdR};color:#50000B;font-weight:700;">${formatMoney(c.amount)}</td></tr>`);
    });
    if (directCount != null) {
      out.push(`<tr><td style="${td};color:#50000B;font-weight:600;font-style:italic;">Processed directly in Shopify</td><td style="${tdR}">${directCount}</td><td style="${tdR};color:#50000B;font-weight:700;">${formatMoney(directAmount)}</td></tr>`);
    }
    if (d.shop?.refunded != null) {
      out.push(`<tr style="background:#50000B;color:#F5F0EB;"><td style="${td};color:#F5F0EB;font-weight:700;text-transform:uppercase;font-size:10px;letter-spacing:1px;">Total (all sources)</td><td style="${tdR};color:#F5F0EB;font-weight:700;">${d.shop.refunded}</td><td style="${tdR};color:#C8973A;font-weight:700;">${formatMoney(totalAmount)}</td></tr>`);
    }
    out.push(`</table>`);
    if ((d.refunds.topReasons ?? []).length) {
      out.push(`<div style="${tag};margin-top:16px;">Top 3 refund reasons</div>`);
      out.push(`<ul style="margin:6px 0;padding-left:22px;">`);
      d.refunds.topReasons.forEach((rr) => out.push(`<li>${rr.reason} — <strong>${rr.count}</strong></li>`));
      out.push(`</ul>`);
    }
  }
  if (d.skio) {
    out.push(`<div style="${tag};margin-top:24px;">Subscriptions (Skio)</div>`);
    out.push(`<ul style="margin:6px 0;padding-left:22px;">`);
    if (d.skio.active != null)        out.push(`<li>Active: <strong>${d.skio.active.toLocaleString()}</strong>${d.skio.paused != null ? ` (${d.skio.paused.toLocaleString()} paused)` : ""}</li>`);
    if (d.skio.churnRate != null)     out.push(`<li>Churn: <strong>${(d.skio.churnRate * 100).toFixed(2)}%</strong></li>`);
    if (d.skio.cancelled != null)     out.push(`<li>Cancellations: <strong>${d.skio.cancelled.toLocaleString()}</strong></li>`);
    if (d.skio.created != null)       out.push(`<li>New subs: <strong>${d.skio.created.toLocaleString()}</strong></li>`);
    if (d.skio.failedPayments != null)out.push(`<li>Failed payments: <strong>${d.skio.failedPayments.toLocaleString()}</strong></li>`);
    out.push(`</ul>`);
    if ((d.skioReasons?.topCancelReasons ?? []).length > 0) {
      out.push(`<div style="${tag};margin-top:14px;">Cancellation reasons — customer-selected${d.skioReasons.totalCancelled ? ` <span style="color:#A89A8E;font-weight:400;text-transform:none;letter-spacing:0;">(${d.skioReasons.totalCancelled.toLocaleString()} sessions)</span>` : ""}</div>`);
      out.push(`<table style="border-collapse:collapse;width:100%;margin-top:6px;">`);
      const totalC = d.skioReasons.totalCancelled || d.skioReasons.topCancelReasons.reduce((s, r) => s + r.count, 0);
      d.skioReasons.topCancelReasons.slice(0, 10).forEach((r) => {
        const pct = totalC ? Math.round((r.count / totalC) * 100) : 0;
        out.push(`<tr><td style="${td}">${r.reason}</td><td style="${tdR};color:#50000B;font-weight:700;">${r.count.toLocaleString()} <span style="color:#A89A8E;font-weight:400;font-size:10px;">(${pct}%)</span></td></tr>`);
      });
      out.push(`</table>`);
    }
  }
  const block = (title, entries, n = 5) => {
    if (!entries.length) return;
    out.push(`<div style="${tag};margin-top:24px;">${title}</div>`);
    out.push(`<ul style="margin:6px 0;padding-left:22px;">`);
    entries.slice(0, n).forEach((e) => out.push(`<li>${e.key}: <strong>${e.count}</strong></li>`));
    out.push(`</ul>`);
  };
  // Drill-down link helper: wraps a count in an anchor that deep-links
  // into the matching Records sub-tab on the live hub. Stakeholders can
  // click the number to see the actual entries instead of just totals.
  // The hash fragment (#records:Issues etc.) is read on mount by the
  // App and RecordsTab components to land on the right sub-tab — the
  // hub itself is a single-page app, so all tabs share this base URL.
  const HUB = "https://im8-cs-hub-production.up.railway.app";
  const drill = (count, sub) =>
    `<a href="${HUB}/#records:${sub}" style="color:#50000B;font-weight:700;text-decoration:underline;">${count}</a>`;
  // "Cancellation reasons (agent-tagged)" block removed at Cherie's
  // request — duplicates info elsewhere and adds noise. Skio's
  // customer-selected cancel reasons remain (different signal).
  if (d.issuesAll?.length) {
    out.push(`<div style="${tag};margin-top:24px;">Order issues (${drill(d.issuesAll.length, "Issues")} this week)</div>`);
    block("By warehouse", d.issuesByWarehouse, 8);
    block("By category", d.issuesByCategory, 6);
  }
  // Add a count + drill-down link above each replacements block so the
  // header doubles as a way into the Records view.
  const replacementsTotal = (d.replacementsByReason ?? []).reduce((s, e) => s + (e.count || 0), 0);
  if (replacementsTotal > 0) {
    out.push(`<div style="${tag};margin-top:24px;">Replacements (${drill(replacementsTotal, "Replacements")} this week)</div>`);
    block("By reason", d.replacementsByReason);
    block("By warehouse", d.replacementsByWarehouse);
  }
  if (d.adverseCount > 0) {
    out.push(`<div style="${tag};margin-top:24px;">Adverse reactions</div>`);
    out.push(`<p style="margin:4px 0;">${drill(d.adverseCount, "Adverse-Reactions")} filed${d.adverseSerious > 0 ? ` · <strong style="color:#A40011;">${d.adverseSerious} serious (SAE)</strong>` : ""}</p>`);
  }
  // Trends section removed from the stakeholder email May 17 — see
  // trends-state comment in ReportsTab. d.trends no longer exists,
  // but `(d.trends ?? []).length` would safely return 0, so this is
  // intentionally a comment rather than a guarded no-op.
  if (d.feedbackByTheme.length) {
    // One unified "Customer Insights" header (no nested "Themes" subhead).
    // The count is hyperlinked to drill into Records → Feedback.
    const feedbackTotal = d.feedbackByTheme.reduce((s, e) => s + (e.count || 0), 0);
    out.push(`<div style="${tag};margin-top:24px;">Customer Insights (${drill(feedbackTotal, "Feedback")} this week)</div>`);
    out.push(`<ul style="margin:6px 0;padding-left:22px;">`);
    d.feedbackByTheme.slice(0, 6).forEach((e) => out.push(`<li>${e.key}: <strong>${e.count}</strong></li>`));
    out.push(`</ul>`);
    if (d.feedbackSuggestions?.length) {
      out.push(`<p style="margin:8px 0 4px;font-size:12px;color:#50000B;font-weight:700;">Ways to improve (agent suggestions):</p>`);
      out.push(`<ul style="margin:4px 0;padding-left:22px;">`);
      d.feedbackSuggestions.forEach((s) => out.push(`<li style="margin:3px 0;">${s.suggestion} <span style="color:#A89A8E;font-size:11px;">— ${prettyEnum(s.theme, FEEDBACK_THEMES)}${s.relatedTeam ? " / " + s.relatedTeam : ""}</span></li>`));
      out.push(`</ul>`);
    }
  }
  if (d.notes && d.notes.trim().length > 0) {
    out.push(`<div style="${h2};margin-top:28px;">Notes</div>`);
    // Escape any HTML in the user's text and preserve newlines as <br>s.
    const escaped = d.notes
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
    out.push(`<div style="font-size:14px;line-height:1.6;white-space:pre-wrap;background:#FAF6F1;border-left:3px solid #C8973A;padding:12px 16px;border-radius:6px;">${escaped}</div>`);
  }
  out.push(`<p style="margin-top:32px;font-size:11px;color:#A89A8E;letter-spacing:0.5px;">— Sent from LUMÉ CX Hub</p>`);
  out.push(`</div>`);
  return out.join("");
}

function SendToStakeholdersModal({ report, fromDate, toDate, onClose }) {
  const [recipients, setRecipients] = useState(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem(STAKEHOLDERS_KEY) ?? "";
  });
  const [subject, setSubject] = useState(`LUMÉ CX Weekly Summary — ${fmtWeekLabel(fromDate, toDate)}`);
  // Plain-text fallback for the clipboard's text/plain mime type. We
  // generate it fresh from the current report so it always matches the
  // HTML preview shown above. Not editable in the UI any more — the
  // iframe preview is the source of truth.
  const bodyText = useMemo(() => buildPlainTextEmail(report), [report]);
  const [copyState, setCopyState] = useState(null);

  function persistRecipients(v) {
    setRecipients(v);
    if (typeof window !== "undefined") localStorage.setItem(STAKEHOLDERS_KEY, v);
  }

  // Two-step send flow:
  //   1. copyReport — puts rich HTML + plain text on the clipboard
  //   2. openGmail  — opens Gmail compose with To + Subject prefilled
  // Browsers don't allow one tab to inject content into another tab's
  // compose body, so the user pastes (Cmd+V) once Gmail loads. Splitting
  // the action makes the paste step obvious instead of invisible.
  async function copyReport() {
    try {
      const html = buildHtmlEmail(report);
      if (navigator.clipboard && window.ClipboardItem) {
        const blob = new Blob([html], { type: "text/html" });
        const textBlob = new Blob([bodyText], { type: "text/plain" });
        await navigator.clipboard.write([
          new ClipboardItem({ "text/html": blob, "text/plain": textBlob }),
        ]);
      } else {
        await navigator.clipboard.writeText(bodyText);
      }
      setCopyState("copied");
      setTimeout(() => setCopyState((s) => (s === "copied" ? null : s)), 4000);
    } catch (e) {
      setCopyState("error");
    }
  }

  function openGmail() {
    const to = recipients.split(/[,\n]/).map((s) => s.trim()).filter(Boolean).join(",");
    const params = new URLSearchParams({
      view: "cm", fs: "1",
      to,
      su: subject,
      // Body left blank — user pastes the HTML they copied above.
    });
    const url = `https://mail.google.com/mail/?${params.toString()}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }


  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(20,10,15,0.55)", zIndex: 200, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "60px 20px", overflowY: "auto" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: W, borderRadius: 14, maxWidth: 720, width: "100%", padding: "28px 32px", boxShadow: "0 20px 60px rgba(0,0,0,0.3)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 18 }}>
          <div style={{ fontFamily: F.serif, fontSize: 22, color: BURG, fontWeight: 700 }}>Send to Stakeholders</div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: INK, opacity: 0.5, fontSize: 22, cursor: "pointer" }}>×</button>
        </div>

        <div style={{ marginBottom: 12 }}>
          <div style={{ fontFamily: F.sans, fontSize: 10, color: INK, opacity: 0.7, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 4 }}>Recipients (comma or newline separated)</div>
          <textarea value={recipients} onChange={(e) => persistRecipients(e.target.value)} rows={2} placeholder="sam@prenetics.com, head-of-cx@prenetics.com" style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid " + SOFT_BORDER, background: W, fontFamily: F.sans, fontSize: 13, color: INK, outline: "none", boxSizing: "border-box", resize: "vertical" }} />
          <div style={{ fontFamily: F.sans, fontSize: 11, color: INK, opacity: 0.5, marginTop: 3 }}>Saved locally — edit once, reused next week.</div>
        </div>

        <div style={{ marginBottom: 12 }}>
          <div style={{ fontFamily: F.sans, fontSize: 10, color: INK, opacity: 0.7, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 4 }}>Subject</div>
          <input value={subject} onChange={(e) => setSubject(e.target.value)} style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid " + SOFT_BORDER, background: W, fontFamily: F.sans, fontSize: 13, color: INK, outline: "none", boxSizing: "border-box" }} />
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontFamily: F.sans, fontSize: 10, color: INK, opacity: 0.7, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 4 }}>Preview (this is what your stakeholders will see)</div>
          {/* Render the actual HTML report in a sandboxed iframe so you
              can verify formatting before clicking Email. The iframe is
              isolated from the parent page's CSS so it renders the same
              way Gmail will. */}
          <iframe
            title="Report preview"
            srcDoc={`<!DOCTYPE html><html><head><meta charset="utf-8"><base target="_blank"></head><body style="margin:0;padding:0;">${buildHtmlEmail(report)}</body></html>`}
            style={{ width: "100%", height: 420, border: "1px solid " + SOFT_BORDER, borderRadius: 8, background: "#FFF" }}
          />
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
          <button onClick={copyReport} style={{ background: BURG, color: CREAM, border: "1px solid " + BURG, fontFamily: F.sans, fontSize: 11, fontWeight: 700, padding: "10px 22px", letterSpacing: 1.5, textTransform: "uppercase", cursor: "pointer", borderRadius: 99 }}>
            {copyState === "copied" ? "Copied ✓" : "1. Copy report"}
          </button>
          <button onClick={openGmail} style={{ background: BURG, color: CREAM, border: "1px solid " + BURG, fontFamily: F.sans, fontSize: 11, fontWeight: 700, padding: "10px 22px", letterSpacing: 1.5, textTransform: "uppercase", cursor: "pointer", borderRadius: 99 }}>
            2. Email
          </button>
        </div>
        <div style={{ fontFamily: F.sans, fontSize: 12, color: INK, marginTop: 10, opacity: 0.7, lineHeight: 1.5 }}>
          Click <strong>Copy report</strong>, then click <strong>Email</strong>. Gmail will open in a new tab — click in the body and paste with <strong>Cmd + V</strong> (Mac) or <strong>Ctrl + V</strong> (Windows).
        </div>
        {copyState === "error" && <div style={{ fontFamily: F.sans, fontSize: 12, color: RED, marginTop: 8 }}>Could not access clipboard — try again or copy manually.</div>}

      </div>
    </div>
  );
}

// ─── Logs Tab (replaces team spreadsheets) ───────────────────────
// May 13, 2026 — "Cancellations" hidden per Aina's testing feedback
// (data is already in Skio, no need to log separately). The model,
// API route, and CancellationLogPanel component are preserved as
// orphans in case we ever need to revive the tab.
const LOGS_SUBTABS = ["Order Issue", "Replacements", "Reaction/Concern", "Feedback"];

// Ops Request "Warehouse" dropdown. Per Aina (May 15) — switched from
// regional labels (US/UK/HK/ME) to the canonical warehouse names so
// the value here matches the Issue tab's Warehouse field, the
// warehouseFromCountry helper, and every other warehouse surface
// in the hub. "Other" is dropped — every order ships from one of the
// five named warehouses, no escape hatch needed.
//
// Historical Ops Request records may carry legacy values (US, UK, HK,
// ME) — those still render in their select since the option list isn't
// authoritative for display, just for new selections.
const OPS_REGIONS = [
  { value: "Stord US", label: "Stord US" },
  { value: "Stord EU", label: "Stord EU" },
  { value: "GPS US",   label: "GPS US" },
  { value: "GPS UK",   label: "GPS UK" },
  { value: "HK",       label: "HK" },
];
const OPS_STATUSES = [
  { value: "pending",     label: "Pending — awaiting Ops" },
  { value: "in-progress", label: "In progress" },
  { value: "shipped",     label: "Shipped" },
  { value: "delivered",   label: "Delivered" },
  { value: "cancelled",   label: "Cancelled" },
];

const AR_METHODS = [
  { value: "email",      label: "Email" },
  { value: "phone",      label: "Phone" },
  { value: "live-chat",  label: "Live chat" },
  { value: "instagram",  label: "Instagram DM" },
  { value: "facebook",   label: "Facebook" },
  { value: "tiktok",     label: "TikTok" },
  { value: "other",      label: "Other" },
];
const AR_SEVERITY = [
  { value: "low",      label: "Low — minor / transient" },
  { value: "moderate", label: "Moderate — affecting daily activity" },
  { value: "high",     label: "High — significant impact" },
  { value: "serious",  label: "SERIOUS — hospitalization / life-threatening" },
];
const AR_STATUS = [
  { value: "open",         label: "Open" },
  { value: "under-review", label: "Under review (QC)" },
  { value: "closed",       label: "Closed" },
];
const AR_ESCALATION = ["Head of CX", "VP Ops", "Legal", "QC Manager", "Medical Affairs", "Other"];
const AR_COMMON_SYMPTOMS = [
  "Rash", "GI / digestive", "Headache", "Nausea", "Dizziness", "Allergic reaction",
  "Brain fog", "Heart palpitations", "Breathing", "Other",
];

// Combined list — the new May 2026 taxonomy (from REPLACEMENT_MAIN_REASONS)
// PLUS legacy single-reason values still on old rows. This is what Reports
// and Records use to render the human label for `r.reason`. The Replacement
// form itself uses the new multi-select; this is purely for backwards-compat
// label rendering on historical data + first-main display.
const REPLACEMENT_REASONS = [
  // Current taxonomy
  ...REPLACEMENT_MAIN_REASONS.map((m) => ({ value: m.value, label: m.label })),
  // Legacy values — only appear on old rows
  { value: "wrong-item",      label: "Wrong item received" },
  { value: "order-change",    label: "Order change" },
  { value: "customer-damage", label: "Accidental customer damage" },
  { value: "other",           label: "Other" },
];
const REPLACEMENT_TYPES = [
  { value: "replacement", label: "Replacement" },
  { value: "gift",        label: "Free gift (no refund)" },
];
const REPLACEMENT_STATUSES = [
  { value: "pending",     label: "Pending" },
  { value: "in-progress", label: "In progress" },
  { value: "shipped",     label: "Shipped" },
  { value: "delivered",   label: "Delivered" },
  { value: "cancelled",   label: "Cancelled" },
];

const CANCELLATION_TYPES = [
  { value: "too-expensive",         label: "Too expensive / budget" },
  { value: "wrong-serums",          label: "Wrong serums for hair type" },
  { value: "not-using-fast-enough", label: "Not using fast enough / too much product" },
  { value: "no-results-seen",       label: "No results seen" },
  { value: "switching-brand",       label: "Switching to another brand" },
  { value: "personal-life-change",  label: "Personal / life change" },
  { value: "adverse-reaction",      label: "Adverse reaction" },
  { value: "duplicate-order",       label: "Duplicate order" },
  { value: "address-change",        label: "Address / moving" },
  { value: "other",                 label: "Other" },
];
const CANCELLATION_SCOPES = [
  { value: "subscription", label: "Subscription only" },
  { value: "order",        label: "Order only" },
  { value: "both",         label: "Order + Subscription" },
];

const FEEDBACK_THEMES = [
  { value: "product",       label: "Product" },
  { value: "packaging",     label: "Packaging" },
  { value: "subscription",  label: "Subscription" },
  { value: "shipping",      label: "Shipping" },
  { value: "pricing",       label: "Pricing" },
  { value: "marketing",     label: "Marketing" },
  { value: "loyalty",       label: "Loyalty / referral" },
  { value: "tech",          label: "Tech / website" },
  { value: "service",       label: "CX service" },
  { value: "other",         label: "Other" },
];
const FEEDBACK_TEAMS = ["Product", "Marketing", "Ops/Logistics", "Tech", "CX", "Other"];

const ISSUE_CATEGORIES = [
  { value: "missing-item",     label: "Missing item" },
  { value: "damaged-item",     label: "Damaged item" },
  { value: "wrong-item",       label: "Wrong serum / wrong box" },
  { value: "leaked-bottle",    label: "Leaked bottle" },
  { value: "broken-pump",      label: "Broken pump mechanism" },
  { value: "crushed-packaging", label: "Crushed / damaged packaging" },
  { value: "tampered-package", label: "Tampered packaging" },
  { value: "other",            label: "Other" },
];
const ISSUE_RESOLUTIONS = [
  { value: "pending",     label: "Pending" },
  { value: "replacement", label: "Replacement" },
  { value: "refund",      label: "Refund" },
  { value: "gift",        label: "Free gift" },
  { value: "no-action",   label: "No action" },
];
const ISSUE_WAREHOUSES = ["AU — Sydney", "US — Los Angeles", "UK — London"];
const ISSUE_SEVERITY = ["low", "normal", "high"];

// Best-guess warehouse from shipping country. Used by LOOKUP to pre-fill
// the Warehouse field so agents stop typing the wrong one. Agent can
// always override — this is a starting point, not a hard rule.
function warehouseFromCountry(country) {
  const c = String(country || "").toUpperCase().trim();
  if (!c) return "";
  if (["US", "USA", "UNITED STATES", "UNITED STATES OF AMERICA"].includes(c)) return "Stord US";
  if (["CA", "CAN", "CANADA"].includes(c)) return "Stord US";
  if (["GB", "UK", "UNITED KINGDOM"].includes(c)) return "GPS UK";
  if (["IE", "IRL", "IRELAND", "IM", "ISLE OF MAN"].includes(c)) return "GPS UK";
  if (["HK", "HONG KONG"].includes(c)) return "HK";
  // APAC ships from HK warehouse
  const APAC = ["SG", "SINGAPORE", "JP", "JAPAN", "TW", "TAIWAN", "KR", "SOUTH KOREA",
                "AU", "AUS", "AUSTRALIA", "NZ", "NEW ZEALAND", "MY", "MALAYSIA",
                "ID", "INDONESIA", "PH", "PHILIPPINES", "TH", "THAILAND", "VN", "VIETNAM"];
  if (APAC.includes(c)) return "HK";
  // Default for EU + ROW = Stord EU
  return "Stord EU";
}

// Reusable multi-select chips component (used by Issues Items Affected
// and Replacement Main/Sub Reason fields). Click to toggle; selected
// items show as filled burgundy chips, unselected as outline.
// Per-group dropdown picker. Replaces the chip-wall display of
// grouped SKU options that Cherie called "overwhelming" on 2026-05-15.
// One header + dropdown per PRODUCT_CATALOGUE group; picking from
// any dropdown appends to the selected list shown as pills above.
// Click a pill's × to remove. Items already selected appear as
// "(added)" + disabled in their dropdown so they can't be picked twice.
function MultiSelectGroupedDropdowns({ groupedOptions, selected, onChange, placeholder }) {
  const sel = new Set(selected || []);

  function addItem(value) {
    if (!value || sel.has(value)) return;
    onChange([...(selected || []), value]);
  }
  function removeItem(value) {
    onChange((selected || []).filter((v) => v !== value));
  }

  const headerStyle = { fontFamily: F.sans, fontSize: 9, fontWeight: 700, color: GOLD, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 4 };
  const selectStyle = { width: "100%", padding: "8px 12px", border: "1px solid " + SOFT_BORDER, borderRadius: 6, fontFamily: F.sans, fontSize: 12, color: INK, background: W, outline: "none", boxSizing: "border-box", cursor: "pointer" };

  return (
    <div style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 8, padding: 12 }}>
      {/* Selected items appear as removable pills at the top */}
      {selected && selected.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12, paddingBottom: 10, borderBottom: "1px dashed " + SOFT_BORDER }}>
          {selected.map((v) => (
            <span key={v} onClick={() => removeItem(v)} style={{ background: BURG, color: CREAM, fontFamily: F.sans, fontSize: 11, fontWeight: 600, padding: "5px 12px", borderRadius: 99, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}>
              {v}
              <span style={{ opacity: 0.7, fontSize: 10 }}>×</span>
            </span>
          ))}
        </div>
      )}

      {/* One dropdown per catalogue group */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 10 }}>
        {groupedOptions.map((group) => (
          <div key={group.group}>
            <div style={headerStyle}>{group.group}</div>
            <select
              value=""
              onChange={(e) => { addItem(e.target.value); }}
              style={selectStyle}
            >
              <option value="">{placeholder || "Select an item…"}</option>
              {group.items.map((item) => (
                <option key={item} value={item} disabled={sel.has(item)}>
                  {sel.has(item) ? `${item}  ✓` : item}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
}

function MultiSelectChips({ options, selected, onChange, placeholder, search = false, groupedOptions = null }) {
  const [query, setQuery] = useState("");
  const sel = new Set(selected || []);

  const matchesQuery = (label) => !query.trim() || label.toLowerCase().includes(query.trim().toLowerCase());

  function toggle(value) {
    const next = sel.has(value) ? selected.filter((v) => v !== value) : [...selected, value];
    onChange(next);
  }

  return (
    <div style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 8, padding: 10 }}>
      {search && (
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder || "Search…"}
          style={{ width: "100%", padding: "6px 10px", border: "1px solid " + SOFT_BORDER, borderRadius: 6, fontFamily: F.sans, fontSize: 12, marginBottom: 8, outline: "none", background: CREAM }}
        />
      )}

      {selected.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8, paddingBottom: 8, borderBottom: "1px dashed " + SOFT_BORDER }}>
          {selected.map((v) => {
            const labelLookup = options?.find?.((o) => (typeof o === "string" ? o : o.value) === v);
            const label = typeof labelLookup === "string" ? labelLookup : (labelLookup?.label ?? v);
            return (
              <span key={v} onClick={() => toggle(v)} style={{ background: BURG, color: CREAM, fontFamily: F.sans, fontSize: 11, fontWeight: 600, padding: "5px 12px", borderRadius: 99, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}>
                {label}
                <span style={{ opacity: 0.7, fontSize: 10 }}>×</span>
              </span>
            );
          })}
        </div>
      )}

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, maxHeight: search ? 220 : "none", overflowY: search ? "auto" : "visible" }}>
        {groupedOptions ? (
          groupedOptions.map((group) => {
            const filteredItems = group.items.filter(matchesQuery);
            if (filteredItems.length === 0) return null;
            return (
              <div key={group.group} style={{ width: "100%" }}>
                <div style={{ fontFamily: F.sans, fontSize: 9, fontWeight: 700, color: GOLD, letterSpacing: 1.5, textTransform: "uppercase", margin: "8px 0 4px" }}>{group.group}</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {filteredItems.map((opt) => {
                    const isSel = sel.has(opt);
                    return (
                      <button key={opt} type="button" onClick={() => toggle(opt)} style={{
                        background: isSel ? BURG : "transparent",
                        color: isSel ? CREAM : INK,
                        border: "1px solid " + (isSel ? BURG : SOFT_BORDER),
                        fontFamily: F.sans, fontSize: 11, fontWeight: 500, padding: "5px 11px",
                        borderRadius: 99, cursor: "pointer",
                      }}>{opt}</button>
                    );
                  })}
                </div>
              </div>
            );
          })
        ) : (
          options.filter((opt) => matchesQuery(typeof opt === "string" ? opt : opt.label)).map((opt) => {
            const value = typeof opt === "string" ? opt : opt.value;
            const label = typeof opt === "string" ? opt : opt.label;
            const isSel = sel.has(value);
            return (
              <button key={value} type="button" onClick={() => toggle(value)} style={{
                background: isSel ? BURG : "transparent",
                color: isSel ? CREAM : INK,
                border: "1px solid " + (isSel ? BURG : SOFT_BORDER),
                fontFamily: F.sans, fontSize: 11, fontWeight: 500, padding: "5px 11px",
                borderRadius: 99, cursor: "pointer",
              }}>{label}</button>
            );
          })
        )}
      </div>
    </div>
  );
}

function LogsTab({ role }) {
  const isOpsRole = role === "Ops";
  const visibleSubtabs = LOGS_SUBTABS;
  const [sub, setSub] = useState("Order Issue");
  const eyebrowS = { fontFamily: F.sans, fontSize: 10, color: GOLD, textTransform: "uppercase", letterSpacing: 4, fontWeight: 600, marginBottom: 14 };
  const SUBTAB_TAGLINES = {
    "Order Issue":       "Log damaged, missing, or incorrect items. Enter the LUMÉ order number and note what went wrong.",
    "Replacements":      "Capture replacement dispatches. Order number auto-fills customer details — pick the reason and items affected.",
    "Reaction/Concern":  "Any customer reporting an unexpected skin or scalp reaction. Log verbatim and escalate immediately to Head of CX.",
    "Feedback":          "Positive shoutouts, feature requests, and constructive notes. Order ID optional for social/chat feedback.",
  };
  const tagline = SUBTAB_TAGLINES[sub] ?? "Log entries here — they feed the weekly report automatically.";
  return (
    <div style={{ background: CREAM, minHeight: "100vh" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "56px 24px 24px" }}>
        <div style={eyebrowS}>LUMÉ CX — Logs</div>
        <div style={{ fontFamily: F.serif, fontSize: 48, color: BURG, fontWeight: 600, lineHeight: 1.05, marginBottom: 14, letterSpacing: -1 }}>
          {sub}
        </div>
        <div style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 16, color: INK, opacity: 0.6, marginBottom: 20, maxWidth: 700 }}>
          {tagline}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
            {visibleSubtabs.map((s) => {
              const active = s === sub;
              return (
                <button key={s} onClick={() => setSub(s)} style={{
                  background: active ? BURG : "transparent",
                  color: active ? CREAM : BURG,
                  border: "1px solid " + (active ? BURG : SOFT_BORDER),
                  fontFamily: F.sans, fontSize: 11, fontWeight: 700, padding: "10px 18px",
                  letterSpacing: 2, textTransform: "uppercase", cursor: "pointer", borderRadius: 99,
                }}>{s}</button>
              );
            })}
          </div>
      </div>
      {sub === "Order Issue" && <IssueLogPanel role={role} />}
      {sub === "Replacements" && <ReplacementLogPanel role={role} />}
      {sub === "Reaction/Concern" && <AdverseReactionLogPanel role={role} />}
      {sub === "Feedback" && <FeedbackLogPanel role={role} />}
    </div>
  );
}

// ─── Shared helpers for the "Recent" tables in each Log panel ────────
// Michelle (May 13): stacked cards were noisy. Compact table + last 7
// days only gives the team a scannable list of what just landed.

function filterLast7Days(rows) {
  const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  return (rows || []).filter((r) => {
    if (!r?.createdAt) return false;
    const t = new Date(r.createdAt).getTime();
    return Number.isFinite(t) && t > cutoff;
  });
}

function shortDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "—";
  return d.toLocaleString("en-US", { month: "short", day: "numeric" });
}

function truncate(text, n) {
  if (!text) return "—";
  const s = String(text);
  return s.length > n ? s.slice(0, n).trimEnd() + "…" : s;
}

// Reusable compact table for the "Recent" sections under each panel.
// `columns` = [{ key, label, width?, render? }]
function RecentLogTable({ rows, columns, emptyMessage }) {
  if (!rows || rows.length === 0) {
    return (
      <div style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 13, color: INK, opacity: 0.55, padding: "14px 0" }}>
        {emptyMessage}
      </div>
    );
  }
  return (
    <div style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 10, overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: F.sans }}>
        <thead>
          <tr style={{ background: CREAM }}>
            {columns.map((c) => (
              <th key={c.key} style={{
                padding: "10px 12px",
                textAlign: "left",
                fontSize: 9,
                fontWeight: 700,
                color: BURG,
                letterSpacing: 1.5,
                textTransform: "uppercase",
                borderBottom: "1px solid " + SOFT_BORDER,
                width: c.width,
                whiteSpace: "nowrap",
              }}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.id || i} style={{ borderTop: i === 0 ? "none" : "1px solid " + SOFT_BORDER }}>
              {columns.map((c) => (
                <td key={c.key} style={{
                  padding: "10px 12px",
                  fontSize: 12,
                  color: INK,
                  lineHeight: 1.45,
                  verticalAlign: "top",
                }}>
                  {c.render ? c.render(r) : (r[c.key] ?? "—")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function IssueLogPanel({ role }) {
  const [orderId, setOrderId] = useState("");
  const [ticketId, setTicketId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [country, setCountry] = useState("");
  const [warehouse, setWarehouse] = useState("");
  // Aina May 22 — category / severity / resolution now mandatory; start
  // each as empty so the agent has to actively pick one rather than
  // defaulting through. Validation in submit() blocks blank values.
  const [category, setCategory] = useState("");
  const [severity, setSeverity] = useState("");
  // Items Affected: now a multi-select from PRODUCT_CATALOGUE (Aina's request).
  // The old single textarea was producing inconsistent free-text entries.
  // Mandatory as of May 22.
  const [itemsAffected, setItemsAffected] = useState([]);
  const [description, setDescription] = useState("");
  const [photoUrlsText, setPhotoUrlsText] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [resolution, setResolution] = useState("");
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupHint, setLookupHint] = useState(null);
  const [lookupError, setLookupError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [recent, setRecent] = useState([]);
  const [scope, setScope] = useState("own");
  const [loading, setLoading] = useState(false);

  async function loadRecent() {
    setLoading(true);
    try {
      const res = await fetch("/api/logs/issues?limit=20");
      const json = await res.json();
      if (res.ok) {
        setRecent(json.rows ?? []);
        setScope(json.scope ?? "own");
      }
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { loadRecent(); }, []);

  async function lookupOrder() {
    const id = orderId.trim();
    if (!id) return;
    setLookupLoading(true);
    setLookupError(null);
    setLookupHint(null);
    try {
      const res = await fetch(`/api/orders/lookup?id=${encodeURIComponent(id)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      if (json.customerName) setCustomerName(json.customerName);
      if (json.customerEmail) setCustomerEmail(json.customerEmail);
      if (json.country) setCountry(json.country);
      // Warehouse: prefer Shopify's actual fulfillment location (resolved
      // server-side from order.fulfillments[].location_id). Fall back to
      // country-based mapping only if the order isn't fulfilled yet.
      const wh = json.warehouse || warehouseFromCountry(json.country);
      if (wh) setWarehouse(wh);
      const items = (json.lineItems ?? [])
        .map((li) => `${li.title}${li.variantTitle ? " — " + li.variantTitle : ""} x${li.quantity}`)
        .join("\n");
      setLookupHint({ items, fulfillment: json.fulfillmentStatus, financial: json.financialStatus });
    } catch (e) {
      setLookupError(e.message);
    } finally {
      setLookupLoading(false);
    }
  }

  async function submit() {
    setFormError(null);
    if (!orderId.trim()) { setFormError("Order ID required"); return; }
    if (!ticketId.trim()) { setFormError("Gorgias ticket ID required"); return; }
    // Aina May 22 — mandatory fields tightened.
    if (!category) { setFormError("Category required"); return; }
    if (!severity) { setFormError("Severity required"); return; }
    if (!resolution) { setFormError("Resolution required"); return; }
    if (itemsAffected.length === 0) { setFormError("At least one Item Affected required"); return; }
    if (!description.trim()) { setFormError("Description required"); return; }
    setSubmitting(true);
    try {
      // itemsAffected is now an array from the multi-select dropdown
      // (was previously a free-text comma-separated input).
      const photoUrls = photoUrlsText.split(/[\n,]/).map((s) => s.trim()).filter(Boolean);
      const res = await fetch("/api/logs/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: orderId.trim(),
          ticketId: ticketId.trim(),
          customerName: customerName.trim() || undefined,
          customerEmail: customerEmail.trim() || undefined,
          country: country.trim() || undefined,
          warehouse: warehouse || undefined,
          category, severity,
          itemsAffected,
          description: description.trim(),
          photoUrls,
          videoUrl: videoUrl.trim() || undefined,
          resolution,
          resolutionNotes: resolutionNotes.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setOrderId(""); setTicketId(""); setCustomerName(""); setCustomerEmail(""); setCountry("");
      setWarehouse(""); setCategory("missing-item"); setSeverity("normal");
      setItemsAffected([]); setDescription(""); setPhotoUrlsText(""); setVideoUrl("");
      setResolution("pending"); setResolutionNotes("");
      setLookupHint(null);
      loadRecent();
    } catch (e) {
      setFormError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  const inputBase = {
    width: "100%", padding: "10px 14px", borderRadius: 8,
    border: "1px solid " + SOFT_BORDER, background: W,
    fontFamily: F.sans, fontSize: 13, color: INK, outline: "none", boxSizing: "border-box",
  };
  const labelStyle = { fontFamily: F.sans, fontSize: 10, color: INK, opacity: 0.7, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 4, display: "block" };

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "16px 24px 96px" }}>
      <div style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 14, padding: "24px 28px", marginBottom: 24 }}>
        <div style={{ fontFamily: F.serif, fontSize: 22, color: BURG, fontWeight: 600, marginBottom: 18 }}>Log a new issue</div>

        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14, marginBottom: 14 }}>
          <div>
            <label style={labelStyle}>Order ID <span style={{ color: RED, fontWeight: 700 }}>*</span></label>
            <div style={{ display: "flex", gap: 8 }}>
              <input value={orderId} onChange={(e) => setOrderId(e.target.value)} placeholder="#LME-10500" style={{ ...inputBase, flex: 1 }} />
              <button onClick={lookupOrder} disabled={!orderId.trim() || lookupLoading} style={{
                background: BURG, color: CREAM, border: "1px solid " + BURG, fontFamily: F.sans, fontSize: 11, fontWeight: 700,
                padding: "0 18px", letterSpacing: 1.5, textTransform: "uppercase", cursor: orderId.trim() && !lookupLoading ? "pointer" : "not-allowed",
                borderRadius: 8, opacity: orderId.trim() && !lookupLoading ? 1 : 0.5,
              }}>{lookupLoading ? "..." : "Lookup"}</button>
            </div>
            {lookupError && <div style={{ fontFamily: F.sans, fontSize: 11, color: RED, marginTop: 4 }}>{lookupError}</div>}
          </div>
          <div>
            <label style={labelStyle}>Gorgias ticket # <span style={{ color: RED, fontWeight: 700 }}>*</span></label>
            <input value={ticketId} onChange={(e) => setTicketId(e.target.value)} placeholder="required for traceability" style={inputBase} />
          </div>
        </div>

        {lookupHint && (
          <div style={{ background: CREAM, border: "1px solid " + SOFT_BORDER, borderRadius: 8, padding: "12px 14px", marginBottom: 14, fontFamily: F.sans, fontSize: 12, color: INK }}>
            <div style={{ fontWeight: 700, marginBottom: 4, color: BURG }}>Order line items</div>
            <pre style={{ margin: 0, fontFamily: F.sans, fontSize: 12, whiteSpace: "pre-wrap" }}>{lookupHint.items || "(none)"}</pre>
            <div style={{ marginTop: 6, opacity: 0.6, fontSize: 11 }}>
              Fulfillment: {lookupHint.fulfillment ?? "—"} · Financial: {lookupHint.financial ?? "—"}
            </div>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
          <div>
            <label style={labelStyle}>Customer name</label>
            <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} style={inputBase} />
          </div>
          <div>
            <label style={labelStyle}>Email</label>
            <input value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} style={inputBase} />
          </div>
          <div>
            <label style={labelStyle}>Country</label>
            <input value={country} onChange={(e) => setCountry(e.target.value)} style={inputBase} />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
          <div>
            <label style={labelStyle}>Category <span style={{ color: RED, fontWeight: 700 }}>*</span></label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} style={inputBase}>
              <option value="">Select a category…</option>
              {ISSUE_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Severity <span style={{ color: RED, fontWeight: 700 }}>*</span></label>
            <select value={severity} onChange={(e) => setSeverity(e.target.value)} style={inputBase}>
              <option value="">Select severity…</option>
              {ISSUE_SEVERITY.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Warehouse</label>
            <select value={warehouse} onChange={(e) => setWarehouse(e.target.value)} style={inputBase}>
              <option value="">—</option>
              {ISSUE_WAREHOUSES.map((w) => <option key={w} value={w}>{w}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Resolution <span style={{ color: RED, fontWeight: 700 }}>*</span></label>
            <select value={resolution} onChange={(e) => setResolution(e.target.value)} style={inputBase}>
              <option value="">Select resolution…</option>
              {ISSUE_RESOLUTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Items affected (multi-select) <span style={{ color: RED, fontWeight: 700 }}>*</span></label>
          {/* Simplified SKU list per Aina May 18 — Issues doesn't need
              x1/x2/x3 quantity info; that lives on the Replacement form. */}
          <MultiSelectGroupedDropdowns
            groupedOptions={PRODUCT_CATALOGUE_SIMPLE}
            selected={itemsAffected}
            onChange={setItemsAffected}
            placeholder="Select an item…"
          />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Description <span style={{ color: RED, fontWeight: 700 }}>*</span></label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="What did the customer report?" style={{ ...inputBase, fontFamily: F.sans, resize: "vertical" }} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14, marginBottom: 14 }}>
          <div>
            <label style={labelStyle}>Photo URLs (one per line or comma separated)</label>
            <textarea value={photoUrlsText} onChange={(e) => setPhotoUrlsText(e.target.value)} rows={2} placeholder="https://drive.google.com/..." style={{ ...inputBase, fontFamily: F.sans, resize: "vertical" }} />
          </div>
          <div>
            <label style={labelStyle}>Video URL</label>
            <input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="optional" style={inputBase} />
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Resolution notes</label>
          <input value={resolutionNotes} onChange={(e) => setResolutionNotes(e.target.value)} placeholder="optional — what was done" style={inputBase} />
        </div>

        {formError && <div style={{ background: "#fee", border: "1px solid " + RED, color: RED, padding: 8, borderRadius: 6, marginBottom: 12, fontFamily: F.sans, fontSize: 12 }}>{formError}</div>}

        <button onClick={submit} disabled={submitting} style={{
          background: BURG, color: CREAM, border: "1px solid " + BURG,
          fontFamily: F.sans, fontSize: 12, fontWeight: 700, padding: "12px 28px",
          letterSpacing: 2, textTransform: "uppercase", cursor: submitting ? "wait" : "pointer", borderRadius: 99,
          opacity: submitting ? 0.6 : 1,
        }}>{submitting ? "Saving..." : "Save Issue"}</button>
      </div>

      {(() => {
        const recent7 = filterLast7Days(recent);
        return (
          <>
            <div style={{ fontFamily: F.sans, fontSize: 11, color: BURG, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>
              {scope === "all" ? "Recent — all agents · last 7 days" : "Your recent entries · last 7 days"} ({loading ? "..." : recent7.length})
            </div>
            <RecentLogTable
              rows={recent7}
              emptyMessage="No issues logged in the last 7 days."
              columns={[
                { key: "createdAt",   label: "Date",        width: 70,  render: (r) => shortDate(r.createdAt) },
                { key: "orderId",     label: "Order",       width: 110 },
                { key: "category",    label: "Category",    width: 130, render: (r) => prettyEnum(r.category, ISSUE_CATEGORIES) },
                { key: "warehouse",   label: "Warehouse",   width: 90,  render: (r) => r.warehouse || "—" },
                { key: "resolution",  label: "Resolution",  width: 110, render: (r) => prettyEnum(r.resolution, ISSUE_RESOLUTIONS) },
                { key: "description", label: "Description",             render: (r) => truncate(r.description, 80) },
              ]}
            />
          </>
        );
      })()}
    </div>
  );
}

// ─── Replacement log ──────────────────────────────────────────────

function ReplacementLogPanel({ role }) {
  const [orderId, setOrderId] = useState("");
  const [ticketId, setTicketId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [country, setCountry] = useState("");
  const [warehouse, setWarehouse] = useState("");
  // Two-tier multi-select per Aina's feedback (May 13).
  // `reasonMains` holds main-reason `value` strings.
  // `reasonSubs` holds the sub-reason label strings (free-form).
  const [reasonMains, setReasonMains] = useState([]);
  const [reasonSubs, setReasonSubs] = useState([]);
  // Items affected — separate field. Shared SKU list with Issues tab.
  const [itemsAffected, setItemsAffected] = useState([]);
  const [originalOrder, setOriginalOrder] = useState("");
  const [details, setDetails] = useState("");
  const [courier, setCourier] = useState("");
  // Solution = free-text (renamed from "Status" per Aina's feedback)
  const [solution, setSolution] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupHint, setLookupHint] = useState(null);
  const [lookupError, setLookupError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [recent, setRecent] = useState([]);
  const [scopeShown, setScopeShown] = useState("own");
  const [loading, setLoading] = useState(false);

  async function loadRecent() {
    setLoading(true);
    try {
      const res = await fetch("/api/logs/replacements?limit=20");
      const json = await res.json();
      if (res.ok) {
        setRecent(json.rows ?? []);
        setScopeShown(json.scope ?? "own");
      }
    } finally { setLoading(false); }
  }
  useEffect(() => { loadRecent(); }, []);

  async function lookupOrder() {
    if (!orderId.trim()) return;
    setLookupLoading(true);
    setLookupError(null);
    setLookupHint(null);
    try {
      const res = await fetch(`/api/orders/lookup?id=${encodeURIComponent(orderId.trim())}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      if (json.customerName) setCustomerName(json.customerName);
      if (json.customerEmail) setCustomerEmail(json.customerEmail);
      if (json.country) setCountry(json.country);
      // Warehouse: prefer Shopify's actual fulfillment location, fall back
      // to country-based mapping if the order isn't fulfilled yet.
      const wh = json.warehouse || warehouseFromCountry(json.country);
      if (wh) setWarehouse(wh);
      const items = (json.lineItems ?? [])
        .map((li) => `${li.title}${li.variantTitle ? " — " + li.variantTitle : ""} x${li.quantity}`)
        .join("\n");
      setLookupHint({ items });
    } catch (e) { setLookupError(e.message); }
    finally { setLookupLoading(false); }
  }

  async function submit() {
    setFormError(null);
    if (!orderId.trim()) { setFormError("Order ID required"); return; }
    if (!ticketId.trim()) { setFormError("Gorgias ticket ID required"); return; }
    if (reasonMains.length === 0) { setFormError("At least one Main Reason required"); return; }
    // Aina May 22: Items Affected now mandatory — replacements need a
    // shippable SKU list, not an empty array.
    if (itemsAffected.length === 0) { setFormError("At least one Item Affected required"); return; }
    // Aina May 18: Original order reference is now mandatory — too many
    // replacement rows landing without it for the warehouse team to
    // reconcile against the source order.
    if (!originalOrder.trim()) { setFormError("Original order reference required"); return; }
    if (!solution.trim()) { setFormError("Solution required"); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/logs/replacements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: orderId.trim(),
          ticketId: ticketId.trim(),
          customerName: customerName.trim() || undefined,
          customerEmail: customerEmail.trim() || undefined,
          country: country.trim() || undefined,
          warehouse: warehouse || undefined,
          reasonMains,
          reasonSubs,
          itemsAffected,
          originalOrder: originalOrder.trim(),
          details: details.trim() || undefined,
          courier: courier.trim() || undefined,
          solution: solution.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setOrderId(""); setTicketId(""); setCustomerName(""); setCustomerEmail(""); setCountry("");
      setWarehouse(""); setReasonMains([]); setReasonSubs([]); setItemsAffected([]);
      setOriginalOrder(""); setDetails(""); setCourier("");
      setSolution(""); setLookupHint(null);
      loadRecent();
    } catch (e) { setFormError(e.message); }
    finally { setSubmitting(false); }
  }

  const inputBase = { width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid " + SOFT_BORDER, background: W, fontFamily: F.sans, fontSize: 13, color: INK, outline: "none", boxSizing: "border-box" };
  const labelStyle = { fontFamily: F.sans, fontSize: 10, color: INK, opacity: 0.7, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 4, display: "block" };

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "16px 24px 96px" }}>
      <div style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 14, padding: "24px 28px", marginBottom: 24 }}>
        <div style={{ fontFamily: F.serif, fontSize: 22, color: BURG, fontWeight: 600, marginBottom: 18 }}>Log a replacement / gift</div>

        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14, marginBottom: 14 }}>
          <div>
            <label style={labelStyle}>Order ID <span style={{ color: RED, fontWeight: 700 }}>*</span></label>
            <div style={{ display: "flex", gap: 8 }}>
              <input value={orderId} onChange={(e) => setOrderId(e.target.value)} placeholder="#LME-10500" style={{ ...inputBase, flex: 1 }} />
              <button onClick={lookupOrder} disabled={!orderId.trim() || lookupLoading} style={{ background: BURG, color: CREAM, border: "1px solid " + BURG, fontFamily: F.sans, fontSize: 11, fontWeight: 700, padding: "0 18px", letterSpacing: 1.5, textTransform: "uppercase", cursor: orderId.trim() && !lookupLoading ? "pointer" : "not-allowed", borderRadius: 8, opacity: orderId.trim() && !lookupLoading ? 1 : 0.5 }}>{lookupLoading ? "..." : "Lookup"}</button>
            </div>
            {lookupError && <div style={{ fontFamily: F.sans, fontSize: 11, color: RED, marginTop: 4 }}>{lookupError}</div>}
          </div>
          <div>
            <label style={labelStyle}>Gorgias ticket # <span style={{ color: RED, fontWeight: 700 }}>*</span></label>
            <input value={ticketId} onChange={(e) => setTicketId(e.target.value)} placeholder="required for traceability" style={inputBase} />
          </div>
        </div>

        {lookupHint && (
          <div style={{ background: CREAM, border: "1px solid " + SOFT_BORDER, borderRadius: 8, padding: "12px 14px", marginBottom: 14, fontFamily: F.sans, fontSize: 12, color: INK }}>
            <div style={{ fontWeight: 700, marginBottom: 4, color: BURG }}>Original order line items</div>
            <pre style={{ margin: 0, fontFamily: F.sans, fontSize: 12, whiteSpace: "pre-wrap" }}>{lookupHint.items || "(none)"}</pre>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
          <div><label style={labelStyle}>Customer name</label><input value={customerName} onChange={(e) => setCustomerName(e.target.value)} style={inputBase} /></div>
          <div><label style={labelStyle}>Email</label><input value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} style={inputBase} /></div>
          <div><label style={labelStyle}>Country</label><input value={country} onChange={(e) => setCountry(e.target.value)} style={inputBase} /></div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Warehouse <span style={{ fontFamily: F.serif, fontStyle: "italic", textTransform: "none", letterSpacing: 0, fontWeight: 400, opacity: 0.7 }}>(auto-filled from country — override if wrong)</span></label>
          <select value={warehouse} onChange={(e) => setWarehouse(e.target.value)} style={inputBase}>
            <option value="">—</option>
            {ISSUE_WAREHOUSES.map((w) => <option key={w} value={w}>{w}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Main reason <span style={{ color: RED, fontWeight: 700 }}>*</span> <span style={{ fontFamily: F.serif, fontStyle: "italic", textTransform: "none", letterSpacing: 0, fontWeight: 400, opacity: 0.7 }}>(multi-select — pick all that apply)</span></label>
          <MultiSelectChips
            options={REPLACEMENT_MAIN_REASONS.map((m) => ({ value: m.value, label: m.label }))}
            selected={reasonMains}
            onChange={(next) => {
              setReasonMains(next);
              // Drop any subs whose main is no longer selected
              const validSubs = getSubsForMains(next).map((s) => s.value);
              setReasonSubs((cur) => cur.filter((s) => validSubs.includes(s)));
            }}
          />
        </div>

        {reasonMains.length > 0 && getSubsForMains(reasonMains).length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Sub reason / replacement sent <span style={{ fontFamily: F.serif, fontStyle: "italic", textTransform: "none", letterSpacing: 0, fontWeight: 400, opacity: 0.7 }}>(multi-select)</span></label>
            <MultiSelectChips
              options={getSubsForMains(reasonMains)}
              selected={reasonSubs}
              onChange={setReasonSubs}
              search={getSubsForMains(reasonMains).length > 20}
              placeholder="Search sub reasons…"
            />
          </div>
        )}

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Items affected (multi-select) <span style={{ color: RED, fontWeight: 700 }}>*</span></label>
          <MultiSelectGroupedDropdowns
            groupedOptions={PRODUCT_CATALOGUE}
            selected={itemsAffected}
            onChange={setItemsAffected}
            placeholder="Select an item…"
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14, marginBottom: 14 }}>
          <div>
            <label style={labelStyle}>Original order reference <span style={{ color: RED, fontWeight: 700 }}>*</span></label>
            {/* Aina May 18: was free-text, now a grouped select drawn
                from PRODUCT_CATALOGUE_SIMPLE. Same SKU list the Issues
                tab uses, with <optgroup> per product line. Made
                mandatory same day. */}
            <select
              value={originalOrder}
              onChange={(e) => setOriginalOrder(e.target.value)}
              style={inputBase}
            >
              <option value="">Select original order…</option>
              {PRODUCT_CATALOGUE_SIMPLE.map((g) => (
                <optgroup key={g.group} label={g.group}>
                  {g.items.map((item) => (
                    <option key={item} value={item}>{item}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Courier (if known)</label>
            <input value={courier} onChange={(e) => setCourier(e.target.value)} placeholder="optional" style={inputBase} />
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Details</label>
          <textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={2} placeholder="What did the customer report? What needs replacing and why?" style={{ ...inputBase, fontFamily: F.sans, resize: "vertical" }} />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Solution <span style={{ color: RED, fontWeight: 700 }}>*</span> <span style={{ fontFamily: F.serif, fontStyle: "italic", textTransform: "none", letterSpacing: 0, fontWeight: 400, opacity: 0.7 }}>(new order ID, "XX added to next order", "Ops did manual replacement", etc.)</span></label>
          <input value={solution} onChange={(e) => setSolution(e.target.value)} placeholder="What was actioned?" style={inputBase} />
        </div>

        {formError && <div style={{ background: "#fee", border: "1px solid " + RED, color: RED, padding: 8, borderRadius: 6, marginBottom: 12, fontFamily: F.sans, fontSize: 12 }}>{formError}</div>}

        <button onClick={submit} disabled={submitting} style={{ background: BURG, color: CREAM, border: "1px solid " + BURG, fontFamily: F.sans, fontSize: 12, fontWeight: 700, padding: "12px 28px", letterSpacing: 2, textTransform: "uppercase", cursor: submitting ? "wait" : "pointer", borderRadius: 99, opacity: submitting ? 0.6 : 1 }}>{submitting ? "Saving..." : "Save Replacement"}</button>
      </div>

      {(() => {
        const recent7 = filterLast7Days(recent);
        return (
          <>
            <div style={{ fontFamily: F.sans, fontSize: 11, color: BURG, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>
              {scopeShown === "all" ? "Recent — all agents · last 7 days" : "Your recent entries · last 7 days"} ({loading ? "..." : recent7.length})
            </div>
            <RecentLogTable
              rows={recent7}
              emptyMessage="No replacements logged in the last 7 days."
              columns={[
                { key: "createdAt", label: "Date",      width: 70,  render: (r) => shortDate(r.createdAt) },
                { key: "orderId",   label: "Order",     width: 110 },
                { key: "reason",    label: "Reason",                render: (r) => {
                  const mains = r.reasonMains?.length > 0
                    ? r.reasonMains.map((m) => prettyEnum(m, REPLACEMENT_REASONS)).join(", ")
                    : prettyEnum(r.reason, REPLACEMENT_REASONS);
                  return truncate(mains, 60);
                } },
                { key: "warehouse", label: "Warehouse", width: 90,  render: (r) => r.warehouse || "—" },
                { key: "items",     label: "Items",                 render: (r) => {
                  const items = (r.itemsAffected?.length > 0 ? r.itemsAffected : r.itemsToShip) || [];
                  return items.length > 0 ? truncate(items.join(", "), 80) : "—";
                } },
                { key: "solution",  label: "Solution",              render: (r) => truncate(r.solution || r.details, 80) },
              ]}
            />
          </>
        );
      })()}
    </div>
  );
}

// ─── Cancellation log ─────────────────────────────────────────────

function CancellationLogPanel({ role }) {
  const [orderId, setOrderId] = useState("");
  const [ticketId, setTicketId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [country, setCountry] = useState("");
  const [cancellationType, setCancellationType] = useState("change-of-mind");
  const [scope, setScope] = useState("subscription");
  const [notes, setNotes] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [recent, setRecent] = useState([]);
  const [scopeShown, setScopeShown] = useState("own");
  const [loading, setLoading] = useState(false);

  async function loadRecent() {
    setLoading(true);
    try {
      const res = await fetch("/api/logs/cancellations?limit=20");
      const json = await res.json();
      if (res.ok) {
        setRecent(json.rows ?? []);
        setScopeShown(json.scope ?? "own");
      }
    } finally { setLoading(false); }
  }
  useEffect(() => { loadRecent(); }, []);

  async function lookupOrder() {
    if (!orderId.trim()) return;
    setLookupLoading(true);
    setLookupError(null);
    try {
      const res = await fetch(`/api/orders/lookup?id=${encodeURIComponent(orderId.trim())}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      if (json.customerName) setCustomerName(json.customerName);
      if (json.customerEmail) setCustomerEmail(json.customerEmail);
      if (json.country) setCountry(json.country);
    } catch (e) { setLookupError(e.message); }
    finally { setLookupLoading(false); }
  }

  async function submit() {
    setFormError(null);
    if (!orderId.trim()) { setFormError("Order ID required"); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/logs/cancellations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: orderId.trim(),
          ticketId: ticketId.trim() || undefined,
          customerName: customerName.trim() || undefined,
          customerEmail: customerEmail.trim() || undefined,
          country: country.trim() || undefined,
          cancellationType, scope,
          notes: notes.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setOrderId(""); setTicketId(""); setCustomerName(""); setCustomerEmail(""); setCountry("");
      setCancellationType("change-of-mind"); setScope("subscription"); setNotes("");
      loadRecent();
    } catch (e) { setFormError(e.message); }
    finally { setSubmitting(false); }
  }

  const inputBase = { width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid " + SOFT_BORDER, background: W, fontFamily: F.sans, fontSize: 13, color: INK, outline: "none", boxSizing: "border-box" };
  const labelStyle = { fontFamily: F.sans, fontSize: 10, color: INK, opacity: 0.7, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 4, display: "block" };

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "16px 24px 96px" }}>
      <div style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 14, padding: "24px 28px", marginBottom: 24 }}>
        <div style={{ fontFamily: F.serif, fontSize: 22, color: BURG, fontWeight: 600, marginBottom: 18 }}>Log a cancellation</div>

        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14, marginBottom: 14 }}>
          <div>
            <label style={labelStyle}>Order ID</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input value={orderId} onChange={(e) => setOrderId(e.target.value)} placeholder="#LME-10500" style={{ ...inputBase, flex: 1 }} />
              <button onClick={lookupOrder} disabled={!orderId.trim() || lookupLoading} style={{ background: BURG, color: CREAM, border: "1px solid " + BURG, fontFamily: F.sans, fontSize: 11, fontWeight: 700, padding: "0 18px", letterSpacing: 1.5, textTransform: "uppercase", cursor: orderId.trim() && !lookupLoading ? "pointer" : "not-allowed", borderRadius: 8, opacity: orderId.trim() && !lookupLoading ? 1 : 0.5 }}>{lookupLoading ? "..." : "Lookup"}</button>
            </div>
            {lookupError && <div style={{ fontFamily: F.sans, fontSize: 11, color: RED, marginTop: 4 }}>{lookupError}</div>}
          </div>
          <div>
            <label style={labelStyle}>Gorgias ticket #</label>
            <input value={ticketId} onChange={(e) => setTicketId(e.target.value)} placeholder="optional" style={inputBase} />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
          <div><label style={labelStyle}>Customer name</label><input value={customerName} onChange={(e) => setCustomerName(e.target.value)} style={inputBase} /></div>
          <div><label style={labelStyle}>Email</label><input value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} style={inputBase} /></div>
          <div><label style={labelStyle}>Country</label><input value={country} onChange={(e) => setCountry(e.target.value)} style={inputBase} /></div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
          <div>
            <label style={labelStyle}>Reason</label>
            <select value={cancellationType} onChange={(e) => setCancellationType(e.target.value)} style={inputBase}>
              {CANCELLATION_TYPES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>What was cancelled</label>
            <select value={scope} onChange={(e) => setScope(e.target.value)} style={inputBase}>
              {CANCELLATION_SCOPES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Notes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Anything worth capturing — context, save attempt, etc." style={{ ...inputBase, fontFamily: F.sans, resize: "vertical" }} />
        </div>

        {formError && <div style={{ background: "#fee", border: "1px solid " + RED, color: RED, padding: 8, borderRadius: 6, marginBottom: 12, fontFamily: F.sans, fontSize: 12 }}>{formError}</div>}

        <button onClick={submit} disabled={submitting} style={{ background: BURG, color: CREAM, border: "1px solid " + BURG, fontFamily: F.sans, fontSize: 12, fontWeight: 700, padding: "12px 28px", letterSpacing: 2, textTransform: "uppercase", cursor: submitting ? "wait" : "pointer", borderRadius: 99, opacity: submitting ? 0.6 : 1 }}>{submitting ? "Saving..." : "Save Cancellation"}</button>
      </div>

      <div style={{ fontFamily: F.sans, fontSize: 11, color: BURG, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>
        {scopeShown === "all" ? "Recent — all agents" : "Your recent entries"} ({loading ? "..." : recent.length})
      </div>
      {recent.length === 0 && !loading && (
        <div style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 14, color: INK, opacity: 0.5, padding: "16px 0" }}>No cancellations logged yet.</div>
      )}
      {recent.map((r) => (
        <div key={r.id} style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 10, padding: "14px 18px", marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8 }}>
            <div style={{ fontFamily: F.serif, fontSize: 15, color: BURG, fontWeight: 600 }}>{r.orderId}</div>
            <div style={{ fontFamily: F.sans, fontSize: 10, color: INK, opacity: 0.5, letterSpacing: 1 }}>{new Date(r.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</div>
          </div>
          <div style={{ fontFamily: F.sans, fontSize: 11, color: BURG, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginTop: 4 }}>
            {r.cancellationType} · {r.scope}
          </div>
          {r.notes && <div style={{ fontFamily: F.sans, fontSize: 13, color: INK, marginTop: 6, lineHeight: 1.5 }}>{r.notes}</div>}
        </div>
      ))}
    </div>
  );
}

// ─── Cancel — No Refund log ───────────────────────────────────────
// Added 2026-05-15 per Aina's feedback. For cases where we cancelled
// an order but did NOT issue a cash refund — typically because we
// shipped a replacement order instead. All four fields mandatory.

function CancelNoRefundLogPanel({ role }) {
  const [cancelledOrderId, setCancelledOrderId] = useState("");
  const [ticketId, setTicketId] = useState("");
  const [replacementOrderId, setReplacementOrderId] = useState("");
  const [reasonNotRefunded, setReasonNotRefunded] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [recent, setRecent] = useState([]);
  const [scopeShown, setScopeShown] = useState("own");
  const [loading, setLoading] = useState(false);

  async function loadRecent() {
    setLoading(true);
    try {
      const res = await fetch("/api/logs/cancel-no-refund?limit=20");
      const json = await res.json();
      if (res.ok) {
        setRecent(json.rows ?? []);
        setScopeShown(json.scope ?? "own");
      }
    } finally { setLoading(false); }
  }
  useEffect(() => { loadRecent(); }, []);

  async function submit() {
    setFormError(null);
    if (!cancelledOrderId.trim())   { setFormError("Cancelled order # required"); return; }
    if (!ticketId.trim())           { setFormError("Gorgias ticket # required"); return; }
    if (!replacementOrderId.trim()) { setFormError("Replacement order # required"); return; }
    if (!reasonNotRefunded.trim())  { setFormError("Reason for not refunding required"); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/logs/cancel-no-refund", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cancelledOrderId:   cancelledOrderId.trim(),
          ticketId:           ticketId.trim(),
          replacementOrderId: replacementOrderId.trim(),
          reasonNotRefunded:  reasonNotRefunded.trim(),
          notes: notes.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setCancelledOrderId(""); setTicketId(""); setReplacementOrderId("");
      setReasonNotRefunded(""); setNotes("");
      loadRecent();
    } catch (e) { setFormError(e.message); }
    finally { setSubmitting(false); }
  }

  const inputBase = { width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid " + SOFT_BORDER, background: W, fontFamily: F.sans, fontSize: 13, color: INK, outline: "none", boxSizing: "border-box" };
  const labelStyle = { fontFamily: F.sans, fontSize: 10, color: INK, opacity: 0.7, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 4, display: "block" };
  const reqMark = <span style={{ color: RED, fontWeight: 700 }}>*</span>;

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "16px 24px 96px" }}>
      <div style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 14, padding: "24px 28px", marginBottom: 24 }}>
        <div style={{ fontFamily: F.serif, fontSize: 22, color: BURG, fontWeight: 600, marginBottom: 6 }}>Log a cancel — no refund</div>
        <div style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 13, color: INK, opacity: 0.6, marginBottom: 18 }}>
          For orders we cancelled where the customer didn't receive a cash refund — typically because we sent a replacement order instead.
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
          <div>
            <label style={labelStyle}>Cancelled order # {reqMark}</label>
            <input value={cancelledOrderId} onChange={(e) => setCancelledOrderId(e.target.value)} placeholder="#LME-10500" style={inputBase} />
          </div>
          <div>
            <label style={labelStyle}>Gorgias ticket # {reqMark}</label>
            <input value={ticketId} onChange={(e) => setTicketId(e.target.value)} placeholder="e.g. 12345" style={inputBase} />
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Replacement order # {reqMark}</label>
          <input value={replacementOrderId} onChange={(e) => setReplacementOrderId(e.target.value)} placeholder="#LME-10501" style={inputBase} />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Reason for not refunding {reqMark}</label>
          <textarea value={reasonNotRefunded} onChange={(e) => setReasonNotRefunded(e.target.value)} rows={2} placeholder="e.g. Replacement shipped at no extra cost / store credit issued / customer accepted exchange" style={{ ...inputBase, fontFamily: F.sans, resize: "vertical" }} />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Notes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Anything else worth capturing (optional)" style={{ ...inputBase, fontFamily: F.sans, resize: "vertical" }} />
        </div>

        {formError && <div style={{ background: "#fee", border: "1px solid " + RED, color: RED, padding: 8, borderRadius: 6, marginBottom: 12, fontFamily: F.sans, fontSize: 12 }}>{formError}</div>}

        <button onClick={submit} disabled={submitting} style={{ background: BURG, color: CREAM, border: "1px solid " + BURG, fontFamily: F.sans, fontSize: 12, fontWeight: 700, padding: "12px 28px", letterSpacing: 2, textTransform: "uppercase", cursor: submitting ? "wait" : "pointer", borderRadius: 99, opacity: submitting ? 0.6 : 1 }}>{submitting ? "Saving..." : "Save Entry"}</button>
      </div>

      <div style={{ fontFamily: F.sans, fontSize: 11, color: BURG, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>
        {scopeShown === "all" ? "Recent — all agents" : "Your recent entries"} ({loading ? "..." : recent.length})
      </div>
      {recent.length === 0 && !loading && (
        <div style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 13, color: INK, opacity: 0.55 }}>None logged yet.</div>
      )}
      {recent.length > 0 && (
        <div style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 10, overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: F.sans, fontSize: 12 }}>
            <thead>
              <tr style={{ background: CREAM }}>
                <th style={{ padding: "10px 12px", textAlign: "left", color: "#999", fontWeight: 600, fontSize: 10, letterSpacing: 1, textTransform: "uppercase" }}>Date</th>
                <th style={{ padding: "10px 12px", textAlign: "left", color: "#999", fontWeight: 600, fontSize: 10, letterSpacing: 1, textTransform: "uppercase" }}>Cancelled</th>
                <th style={{ padding: "10px 12px", textAlign: "left", color: "#999", fontWeight: 600, fontSize: 10, letterSpacing: 1, textTransform: "uppercase" }}>Replacement</th>
                <th style={{ padding: "10px 12px", textAlign: "left", color: "#999", fontWeight: 600, fontSize: 10, letterSpacing: 1, textTransform: "uppercase" }}>Ticket</th>
                <th style={{ padding: "10px 12px", textAlign: "left", color: "#999", fontWeight: 600, fontSize: 10, letterSpacing: 1, textTransform: "uppercase" }}>Reason</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((r, i) => (
                <tr key={r.id} style={{ borderTop: i > 0 ? "1px solid " + SOFT_BORDER : "none" }}>
                  <td style={{ padding: "10px 12px", color: INK, opacity: 0.7, whiteSpace: "nowrap" }}>{new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</td>
                  <td style={{ padding: "10px 12px", color: BURG, fontWeight: 600, whiteSpace: "nowrap" }}>{r.cancelledOrderId}</td>
                  <td style={{ padding: "10px 12px", color: BURG, whiteSpace: "nowrap" }}>{r.replacementOrderId}</td>
                  <td style={{ padding: "10px 12px", color: INK, opacity: 0.7, whiteSpace: "nowrap" }}>{r.ticketId}</td>
                  <td style={{ padding: "10px 12px", color: INK }}>{r.reasonNotRefunded}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Feedback log ─────────────────────────────────────────────────

function FeedbackLogPanel({ role }) {
  const [orderId, setOrderId] = useState("");
  const [ticketId, setTicketId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [country, setCountry] = useState("");
  // Aina May 22 — theme and relatedTeam now mandatory; both start empty
  // so the agent picks a value rather than defaulting through.
  const [theme, setTheme] = useState("");
  const [relatedTeam, setRelatedTeam] = useState("");
  const [details, setDetails] = useState("");
  const [suggestion, setSuggestion] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [recent, setRecent] = useState([]);
  const [scopeShown, setScopeShown] = useState("own");
  const [loading, setLoading] = useState(false);

  async function loadRecent() {
    setLoading(true);
    try {
      const res = await fetch("/api/logs/feedback?limit=20");
      const json = await res.json();
      if (res.ok) {
        setRecent(json.rows ?? []);
        setScopeShown(json.scope ?? "own");
      }
    } finally { setLoading(false); }
  }
  useEffect(() => { loadRecent(); }, []);

  async function lookupOrder() {
    if (!orderId.trim()) return;
    setLookupLoading(true);
    setLookupError(null);
    try {
      const res = await fetch(`/api/orders/lookup?id=${encodeURIComponent(orderId.trim())}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      if (json.customerName) setCustomerName(json.customerName);
      if (json.customerEmail) setCustomerEmail(json.customerEmail);
      if (json.country) setCountry(json.country);
    } catch (e) { setLookupError(e.message); }
    finally { setLookupLoading(false); }
  }

  async function submit() {
    setFormError(null);
    if (!ticketId.trim()) { setFormError("Gorgias ticket # required"); return; }
    // Aina May 22 — Theme + Related Team + customer-verbatim now mandatory.
    if (!theme) { setFormError("Theme required"); return; }
    if (!relatedTeam) { setFormError("Related team required"); return; }
    if (!details.trim()) { setFormError("What did the customer say? required"); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/logs/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: orderId.trim() || undefined,
          ticketId: ticketId.trim() || undefined,
          customerName: customerName.trim() || undefined,
          customerEmail: customerEmail.trim() || undefined,
          country: country.trim() || undefined,
          theme,
          relatedTeam: relatedTeam || undefined,
          details: details.trim(),
          suggestion: suggestion.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setOrderId(""); setTicketId(""); setCustomerName(""); setCustomerEmail(""); setCountry("");
      setTheme(""); setRelatedTeam(""); setDetails(""); setSuggestion("");
      loadRecent();
    } catch (e) { setFormError(e.message); }
    finally { setSubmitting(false); }
  }

  const inputBase = { width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid " + SOFT_BORDER, background: W, fontFamily: F.sans, fontSize: 13, color: INK, outline: "none", boxSizing: "border-box" };
  const labelStyle = { fontFamily: F.sans, fontSize: 10, color: INK, opacity: 0.7, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 4, display: "block" };

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "16px 24px 96px" }}>
      <div style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 14, padding: "24px 28px", marginBottom: 24 }}>
        <div style={{ fontFamily: F.serif, fontSize: 22, color: BURG, fontWeight: 600, marginBottom: 18 }}>Log customer feedback</div>

        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 14, marginBottom: 14 }}>
          <div>
            <label style={labelStyle}>Order ID (optional — IG DM has no order)</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input value={orderId} onChange={(e) => setOrderId(e.target.value)} placeholder="#LME-10500" style={{ ...inputBase, flex: 1 }} />
              <button onClick={lookupOrder} disabled={!orderId.trim() || lookupLoading} style={{ background: BURG, color: CREAM, border: "1px solid " + BURG, fontFamily: F.sans, fontSize: 11, fontWeight: 700, padding: "0 18px", letterSpacing: 1.5, textTransform: "uppercase", cursor: orderId.trim() && !lookupLoading ? "pointer" : "not-allowed", borderRadius: 8, opacity: orderId.trim() && !lookupLoading ? 1 : 0.5 }}>{lookupLoading ? "..." : "Lookup"}</button>
            </div>
            {lookupError && <div style={{ fontFamily: F.sans, fontSize: 11, color: RED, marginTop: 4 }}>{lookupError}</div>}
          </div>
          <div>
            <label style={labelStyle}>Gorgias ticket # <span style={{ color: RED, fontWeight: 700 }}>*</span></label>
            <input value={ticketId} onChange={(e) => setTicketId(e.target.value)} placeholder="e.g. 12345" style={inputBase} />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
          <div><label style={labelStyle}>Customer name</label><input value={customerName} onChange={(e) => setCustomerName(e.target.value)} style={inputBase} /></div>
          <div><label style={labelStyle}>Email</label><input value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} style={inputBase} /></div>
          <div><label style={labelStyle}>Country</label><input value={country} onChange={(e) => setCountry(e.target.value)} style={inputBase} /></div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
          <div>
            <label style={labelStyle}>Theme <span style={{ color: RED, fontWeight: 700 }}>*</span></label>
            <select value={theme} onChange={(e) => setTheme(e.target.value)} style={inputBase}>
              <option value="">Select a theme…</option>
              {FEEDBACK_THEMES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Related team <span style={{ color: RED, fontWeight: 700 }}>*</span></label>
            <select value={relatedTeam} onChange={(e) => setRelatedTeam(e.target.value)} style={inputBase}>
              <option value="">Select a team…</option>
              {FEEDBACK_TEAMS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>What did the customer say? <span style={{ color: RED, fontWeight: 700 }}>*</span></label>
          <textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={3} placeholder="Capture the feedback as faithfully as you can." style={{ ...inputBase, fontFamily: F.sans, resize: "vertical" }} />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Suggested action / follow-up (optional)</label>
          <textarea value={suggestion} onChange={(e) => setSuggestion(e.target.value)} rows={2} placeholder="What should the team do with this?" style={{ ...inputBase, fontFamily: F.sans, resize: "vertical" }} />
        </div>

        {formError && <div style={{ background: "#fee", border: "1px solid " + RED, color: RED, padding: 8, borderRadius: 6, marginBottom: 12, fontFamily: F.sans, fontSize: 12 }}>{formError}</div>}

        <button onClick={submit} disabled={submitting} style={{ background: BURG, color: CREAM, border: "1px solid " + BURG, fontFamily: F.sans, fontSize: 12, fontWeight: 700, padding: "12px 28px", letterSpacing: 2, textTransform: "uppercase", cursor: submitting ? "wait" : "pointer", borderRadius: 99, opacity: submitting ? 0.6 : 1 }}>{submitting ? "Saving..." : "Save Feedback"}</button>
      </div>

      {(() => {
        const recent7 = filterLast7Days(recent);
        return (
          <>
            <div style={{ fontFamily: F.sans, fontSize: 11, color: BURG, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>
              {scopeShown === "all" ? "Recent — all agents · last 7 days" : "Your recent entries · last 7 days"} ({loading ? "..." : recent7.length})
            </div>
            <RecentLogTable
              rows={recent7}
              emptyMessage="No feedback logged in the last 7 days."
              columns={[
                { key: "createdAt",    label: "Date",  width: 70,  render: (r) => shortDate(r.createdAt) },
                { key: "orderId",      label: "Order", width: 110, render: (r) => r.orderId || "—" },
                { key: "theme",        label: "Theme", width: 110, render: (r) => prettyEnum(r.theme, FEEDBACK_THEMES) },
                { key: "relatedTeam",  label: "Team",  width: 90,  render: (r) => r.relatedTeam || "—" },
                { key: "details",      label: "Details",           render: (r) => truncate(r.details, 100) },
                { key: "suggestion",   label: "Suggestion",        render: (r) => truncate(r.suggestion, 80) },
              ]}
            />
          </>
        );
      })()}
    </div>
  );
}

// ─── Ops Order Request log ───────────────────────────────────────

function OrderRequestLogPanel({ role }) {
  const isOpsRole = role === "Ops";
  const canEdit = isOpsRole || (role && ["Lead Agent","Manager","Admin","Owner"].includes(role));
  const [region, setRegion] = useState("US");
  const [im8OrderRef, setIm8OrderRef] = useState("");
  const [ticketId, setTicketId] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [d365SalesOrderNumber, setD365SalesOrderNumber] = useState("");
  const [d365SKUsText, setD365SKUsText] = useState("");
  const [dispatchWarehouse, setDispatchWarehouse] = useState("");
  const [shipCarrier, setShipCarrier] = useState("");
  const [awb, setAwb] = useState("");
  const [shipDate, setShipDate] = useState("");
  const [sent, setSent] = useState(false);
  const [recipientName, setRecipientName] = useState("");
  const [shipToAddress1, setShipToAddress1] = useState("");
  const [shipToAddress2, setShipToAddress2] = useState("");
  const [shipToCity, setShipToCity] = useState("");
  const [shipToState, setShipToState] = useState("");
  const [shipToZip, setShipToZip] = useState("");
  const [shipToCountry, setShipToCountry] = useState("");
  const [shipToPhone, setShipToPhone] = useState("");
  const [shipToEmail, setShipToEmail] = useState("");
  const [itemsDescription, setItemsDescription] = useState("");
  const [status, setStatus] = useState("pending");
  const [notes, setNotes] = useState("");
  const [requestedBy, setRequestedBy] = useState("");

  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [recent, setRecent] = useState([]);
  const [scopeShown, setScopeShown] = useState("own");
  const [filterRegion, setFilterRegion] = useState("");
  const [filterPending, setFilterPending] = useState(isOpsRole);
  const [loading, setLoading] = useState(false);

  async function loadRecent() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "30" });
      if (filterRegion) params.set("region", filterRegion);
      if (filterPending) params.set("sent", "0");
      const res = await fetch(`/api/logs/order-requests?${params}`);
      const json = await res.json();
      if (res.ok) {
        setRecent(json.rows ?? []);
        setScopeShown(json.scope ?? "own");
      }
    } finally { setLoading(false); }
  }
  useEffect(() => { loadRecent(); }, [filterRegion, filterPending]);

  async function lookupOrder() {
    if (!im8OrderRef.trim()) return;
    setLookupLoading(true);
    setLookupError(null);
    try {
      const res = await fetch(`/api/orders/lookup?id=${encodeURIComponent(im8OrderRef.trim())}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      const ship = json.shipping ?? {};
      if (ship.name || json.customerName) setRecipientName(ship.name || json.customerName || "");
      if (ship.email || json.customerEmail) setShipToEmail(ship.email || json.customerEmail || "");
      if (ship.phone || json.customerPhone) setShipToPhone(ship.phone || json.customerPhone || "");
      if (ship.address1) setShipToAddress1(ship.address1);
      if (ship.address2) setShipToAddress2(ship.address2);
      if (ship.city) setShipToCity(ship.city);
      if (ship.state) setShipToState(ship.state);
      if (ship.zip) setShipToZip(ship.zip);
      if (ship.country || json.country) setShipToCountry(ship.country || json.country || "");
      if (json.lineItems?.length) {
        setItemsDescription(json.lineItems.map((li) => `${li.quantity}x ${li.title}${li.variantTitle ? " — " + li.variantTitle : ""}`).join("\n"));
      }
    } catch (e) { setLookupError(e.message); }
    finally { setLookupLoading(false); }
  }

  async function submit() {
    setFormError(null);
    if (!im8OrderRef.trim()) { setFormError("Order ref required"); return; }
    if (!ticketId.trim()) { setFormError("Gorgias ticket # required"); return; }
    if (!recipientName.trim()) { setFormError("Recipient name required"); return; }
    if (!itemsDescription.trim()) { setFormError("Items description required"); return; }
    setSubmitting(true);
    try {
      const d365SKUs = d365SKUsText.split(/[\n,]/).map((s) => s.trim()).filter(Boolean);
      const res = await fetch("/api/logs/order-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          region,
          requestedBy: requestedBy.trim() || undefined,
          ticketId: ticketId.trim() || undefined,
          im8OrderRef: im8OrderRef.trim(),
          referenceNumber: referenceNumber.trim() || undefined,
          d365SalesOrderNumber: d365SalesOrderNumber.trim() || undefined,
          d365SKUs,
          dispatchWarehouse: dispatchWarehouse.trim() || undefined,
          shipCarrier: shipCarrier.trim() || undefined,
          awb: awb.trim() || undefined,
          shipDate: shipDate || undefined,
          sent,
          recipientName: recipientName.trim(),
          shipToAddress1: shipToAddress1.trim() || undefined,
          shipToAddress2: shipToAddress2.trim() || undefined,
          shipToCity: shipToCity.trim() || undefined,
          shipToState: shipToState.trim() || undefined,
          shipToZip: shipToZip.trim() || undefined,
          shipToCountry: shipToCountry.trim() || undefined,
          shipToPhone: shipToPhone.trim() || undefined,
          shipToEmail: shipToEmail.trim() || undefined,
          itemsDescription: itemsDescription.trim(),
          status,
          notes: notes.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setIm8OrderRef(""); setTicketId(""); setReferenceNumber(""); setD365SalesOrderNumber("");
      setD365SKUsText(""); setDispatchWarehouse(""); setShipCarrier(""); setAwb("");
      setShipDate(""); setSent(false); setRecipientName("");
      setShipToAddress1(""); setShipToAddress2(""); setShipToCity(""); setShipToState("");
      setShipToZip(""); setShipToCountry(""); setShipToPhone(""); setShipToEmail("");
      setItemsDescription(""); setStatus("pending"); setNotes(""); setRequestedBy("");
      loadRecent();
    } catch (e) { setFormError(e.message); }
    finally { setSubmitting(false); }
  }

  const inputBase = { width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid " + SOFT_BORDER, background: W, fontFamily: F.sans, fontSize: 13, color: INK, outline: "none", boxSizing: "border-box" };
  const labelStyle = { fontFamily: F.sans, fontSize: 10, color: INK, opacity: 0.7, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 4, display: "block" };

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "16px 24px 96px" }}>
      {!isOpsRole && (
      <div style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 14, padding: "24px 28px", marginBottom: 24 }}>
        <div style={{ fontFamily: F.serif, fontSize: 22, color: BURG, fontWeight: 600, marginBottom: 18 }}>Request Ops to ship a replacement</div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr 1fr", gap: 14, marginBottom: 14 }}>
          <div>
            <label style={labelStyle}>Warehouse</label>
            <select value={region} onChange={(e) => setRegion(e.target.value)} style={inputBase}>
              {OPS_REGIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Order ref (auto-fills recipient)</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input value={im8OrderRef} onChange={(e) => setIm8OrderRef(e.target.value)} placeholder="#LME-10500" style={{ ...inputBase, flex: 1 }} />
              <button onClick={lookupOrder} disabled={!im8OrderRef.trim() || lookupLoading} style={{ background: BURG, color: CREAM, border: "1px solid " + BURG, fontFamily: F.sans, fontSize: 11, fontWeight: 700, padding: "0 18px", letterSpacing: 1.5, textTransform: "uppercase", cursor: im8OrderRef.trim() && !lookupLoading ? "pointer" : "not-allowed", borderRadius: 8, opacity: im8OrderRef.trim() && !lookupLoading ? 1 : 0.5 }}>{lookupLoading ? "..." : "Lookup"}</button>
            </div>
            {lookupError && <div style={{ fontFamily: F.sans, fontSize: 11, color: RED, marginTop: 4 }}>{lookupError}</div>}
          </div>
          <div>
            <label style={labelStyle}>Gorgias ticket # <span style={{ color: RED, fontWeight: 700 }}>*</span></label>
            <input value={ticketId} onChange={(e) => setTicketId(e.target.value)} placeholder="e.g. 12345" style={inputBase} />
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Items to ship</label>
          <textarea value={itemsDescription} onChange={(e) => setItemsDescription(e.target.value)} rows={3} placeholder="1x Smooth Serum&#10;1x Repair Serum" style={{ ...inputBase, fontFamily: F.sans, resize: "vertical" }} />
        </div>

        <div style={{ fontFamily: F.sans, fontSize: 10, color: BURG, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8, marginTop: 6 }}>Recipient</div>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr", gap: 14, marginBottom: 14 }}>
          <div><label style={labelStyle}>Name</label><input value={recipientName} onChange={(e) => setRecipientName(e.target.value)} style={inputBase} /></div>
          <div><label style={labelStyle}>Email</label><input value={shipToEmail} onChange={(e) => setShipToEmail(e.target.value)} style={inputBase} /></div>
          <div><label style={labelStyle}>Phone</label><input value={shipToPhone} onChange={(e) => setShipToPhone(e.target.value)} style={inputBase} /></div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
          <div><label style={labelStyle}>Address line 1</label><input value={shipToAddress1} onChange={(e) => setShipToAddress1(e.target.value)} style={inputBase} /></div>
          <div><label style={labelStyle}>Address line 2</label><input value={shipToAddress2} onChange={(e) => setShipToAddress2(e.target.value)} style={inputBase} /></div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
          <div><label style={labelStyle}>City</label><input value={shipToCity} onChange={(e) => setShipToCity(e.target.value)} style={inputBase} /></div>
          <div><label style={labelStyle}>State</label><input value={shipToState} onChange={(e) => setShipToState(e.target.value)} style={inputBase} /></div>
          <div><label style={labelStyle}>ZIP</label><input value={shipToZip} onChange={(e) => setShipToZip(e.target.value)} style={inputBase} /></div>
          <div><label style={labelStyle}>Country</label><input value={shipToCountry} onChange={(e) => setShipToCountry(e.target.value)} style={inputBase} /></div>
        </div>

        <div style={{ fontFamily: F.sans, fontSize: 10, color: BURG, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8, marginTop: 12 }}>Ops detail (filled by Ops once shipped)</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
          <div><label style={labelStyle}>Dispatch warehouse</label><input value={dispatchWarehouse} onChange={(e) => setDispatchWarehouse(e.target.value)} placeholder="USOPS-WH05 (Stord)" style={inputBase} /></div>
          <div><label style={labelStyle}>Ship carrier</label><input value={shipCarrier} onChange={(e) => setShipCarrier(e.target.value)} placeholder="FedEx / asendia / etc." style={inputBase} /></div>
          <div><label style={labelStyle}>Tracking AWB#</label><input value={awb} onChange={(e) => setAwb(e.target.value)} style={inputBase} /></div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
          <div><label style={labelStyle}>Reference #</label><input value={referenceNumber} onChange={(e) => setReferenceNumber(e.target.value)} placeholder="ST-20260102-02" style={inputBase} /></div>
          <div><label style={labelStyle}>D365 SO #</label><input value={d365SalesOrderNumber} onChange={(e) => setD365SalesOrderNumber(e.target.value)} placeholder="U001-SO-478288" style={inputBase} /></div>
          <div><label style={labelStyle}>Ship date</label><input type="date" value={shipDate} onChange={(e) => setShipDate(e.target.value)} style={inputBase} /></div>
          <div>
            <label style={labelStyle}>Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} style={inputBase}>
              {OPS_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>D365 SKUs (one per line)</label>
          <textarea value={d365SKUsText} onChange={(e) => setD365SKUsText(e.target.value)} rows={2} placeholder="Smooth Serum x1&#10;Repair Serum x1" style={{ ...inputBase, fontFamily: F.sans, resize: "vertical" }} />
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: F.sans, fontSize: 12, color: INK, cursor: "pointer" }}>
            <input type="checkbox" checked={sent} onChange={(e) => setSent(e.target.checked)} />
            <span>Marked as sent</span>
          </label>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Notes (optional)</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Anything Ops needs to know" style={{ ...inputBase, fontFamily: F.sans, resize: "vertical" }} />
        </div>

        {formError && <div style={{ background: "#fee", border: "1px solid " + RED, color: RED, padding: 8, borderRadius: 6, marginBottom: 12, fontFamily: F.sans, fontSize: 12 }}>{formError}</div>}

        <button onClick={submit} disabled={submitting} style={{ background: BURG, color: CREAM, border: "1px solid " + BURG, fontFamily: F.sans, fontSize: 12, fontWeight: 700, padding: "12px 28px", letterSpacing: 2, textTransform: "uppercase", cursor: submitting ? "wait" : "pointer", borderRadius: 99, opacity: submitting ? 0.6 : 1 }}>{submitting ? "Saving..." : "Submit Ops Request"}</button>
      </div>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 12 }}>
        <div style={{ fontFamily: F.sans, fontSize: 11, color: BURG, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>
          {isOpsRole ? "Pending fulfillment queue" : (scopeShown === "all" ? "Recent — all agents" : "Your recent entries")} ({loading ? "..." : recent.length})
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <select value={filterRegion} onChange={(e) => setFilterRegion(e.target.value)} style={{ ...inputBase, width: 160, padding: "6px 10px" }}>
            <option value="">All regions</option>
            {OPS_REGIONS.map((r) => <option key={r.value} value={r.value}>{r.value}</option>)}
          </select>
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: F.sans, fontSize: 12, color: INK, cursor: "pointer" }}>
            <input type="checkbox" checked={filterPending} onChange={(e) => setFilterPending(e.target.checked)} />
            <span>Not yet sent</span>
          </label>
        </div>
      </div>
      {recent.length === 0 && !loading && (
        <div style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 14, color: INK, opacity: 0.5, padding: "16px 0" }}>No requests yet for this filter.</div>
      )}
      {recent.map((r) => (
        <OrderRequestCard key={r.id} row={r} canEdit={canEdit} onSaved={loadRecent} />
      ))}
    </div>
  );
}

function OrderRequestCard({ row, canEdit, onSaved }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(row);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  function startEdit() {
    setDraft({
      ...row,
      shipDate: row.shipDate ? new Date(row.shipDate).toISOString().slice(0, 10) : "",
      d365SKUsText: (row.d365SKUs || []).join("\n"),
    });
    setError(null);
    setEditing(true);
  }
  function cancel() { setEditing(false); setError(null); }
  function set(key, val) { setDraft((d) => ({ ...d, [key]: val })); }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const payload = {
        dispatchWarehouse: draft.dispatchWarehouse ?? null,
        shipCarrier: draft.shipCarrier ?? null,
        awb: draft.awb ?? null,
        referenceNumber: draft.referenceNumber ?? null,
        d365SalesOrderNumber: draft.d365SalesOrderNumber ?? null,
        d365SKUs: (draft.d365SKUsText ?? "").split(/[\n,]/).map((s) => s.trim()).filter(Boolean),
        shipDate: draft.shipDate || null,
        sent: !!draft.sent,
        status: draft.status,
        notes: draft.notes ?? null,
        recipientName: draft.recipientName,
        shipToAddress1: draft.shipToAddress1 ?? null,
        shipToAddress2: draft.shipToAddress2 ?? null,
        shipToCity: draft.shipToCity ?? null,
        shipToState: draft.shipToState ?? null,
        shipToZip: draft.shipToZip ?? null,
        shipToCountry: draft.shipToCountry ?? null,
        shipToPhone: draft.shipToPhone ?? null,
        shipToEmail: draft.shipToEmail ?? null,
        itemsDescription: draft.itemsDescription,
      };
      const res = await fetch(`/api/logs/order-requests/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setEditing(false);
      onSaved?.();
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  }

  const inputBase = { width: "100%", padding: "8px 10px", borderRadius: 6, border: "1px solid " + SOFT_BORDER, background: W, fontFamily: F.sans, fontSize: 12, color: INK, outline: "none", boxSizing: "border-box" };
  const labelStyle = { fontFamily: F.sans, fontSize: 9, color: INK, opacity: 0.7, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 3, display: "block" };

  return (
    <div style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 10, padding: "14px 18px", marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 8 }}>
        <div style={{ fontFamily: F.serif, fontSize: 15, color: BURG, fontWeight: 600 }}>
          {row.im8OrderRef}
          <span style={{ fontFamily: F.sans, fontSize: 10, color: GOLD, fontWeight: 800, letterSpacing: 2, padding: "2px 8px", border: "1px solid " + GOLD, borderRadius: 99, marginLeft: 8 }}>{row.region}</span>
          {row.sent && <span style={{ fontFamily: F.sans, fontSize: 10, color: "#2a7a2a", fontWeight: 800, letterSpacing: 1.5, padding: "2px 8px", border: "1px solid #2a7a2a", borderRadius: 99, marginLeft: 6 }}>SENT</span>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontFamily: F.sans, fontSize: 10, color: INK, opacity: 0.5, letterSpacing: 1 }}>{new Date(row.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</div>
          {canEdit && !editing && (
            <button onClick={startEdit} style={{ background: "transparent", color: BURG, border: "1px solid " + SOFT_BORDER, fontFamily: F.sans, fontSize: 10, fontWeight: 700, padding: "4px 10px", letterSpacing: 1.5, textTransform: "uppercase", cursor: "pointer", borderRadius: 99 }}>Edit</button>
          )}
        </div>
      </div>

      {!editing ? (
        <>
          <div style={{ fontFamily: F.sans, fontSize: 11, color: BURG, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginTop: 4 }}>
            {row.status}{row.dispatchWarehouse ? " · " + row.dispatchWarehouse : ""}{row.shipCarrier ? " · " + row.shipCarrier : ""}{row.awb ? " · " + row.awb : ""}
          </div>
          <div style={{ fontFamily: F.sans, fontSize: 12, color: INK, opacity: 0.8, marginTop: 4 }}>→ {row.recipientName}{row.shipToCity ? ", " + row.shipToCity : ""}{row.shipToCountry ? ", " + row.shipToCountry : ""}</div>
          <div style={{ fontFamily: F.sans, fontSize: 13, color: INK, marginTop: 6, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{row.itemsDescription}</div>
        </>
      ) : (
        <div style={{ marginTop: 12, padding: "12px 14px", background: CREAM, borderRadius: 8 }}>
          <div style={{ fontFamily: F.sans, fontSize: 10, color: BURG, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>Ops fulfillment detail</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
            <div><label style={labelStyle}>Dispatch warehouse</label><input value={draft.dispatchWarehouse ?? ""} onChange={(e) => set("dispatchWarehouse", e.target.value)} placeholder="USOPS-WH05 (Stord)" style={inputBase} /></div>
            <div><label style={labelStyle}>Ship carrier</label><input value={draft.shipCarrier ?? ""} onChange={(e) => set("shipCarrier", e.target.value)} placeholder="FedEx" style={inputBase} /></div>
            <div><label style={labelStyle}>Tracking AWB#</label><input value={draft.awb ?? ""} onChange={(e) => set("awb", e.target.value)} style={inputBase} /></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
            <div><label style={labelStyle}>Reference #</label><input value={draft.referenceNumber ?? ""} onChange={(e) => set("referenceNumber", e.target.value)} placeholder="ST-20260102-02" style={inputBase} /></div>
            <div><label style={labelStyle}>D365 SO #</label><input value={draft.d365SalesOrderNumber ?? ""} onChange={(e) => set("d365SalesOrderNumber", e.target.value)} placeholder="U001-SO-478288" style={inputBase} /></div>
            <div><label style={labelStyle}>Ship date</label><input type="date" value={draft.shipDate ?? ""} onChange={(e) => set("shipDate", e.target.value)} style={inputBase} /></div>
            <div>
              <label style={labelStyle}>Status</label>
              <select value={draft.status} onChange={(e) => set("status", e.target.value)} style={inputBase}>
                {OPS_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginBottom: 10 }}>
            <label style={labelStyle}>D365 SKUs (one per line)</label>
            <textarea value={draft.d365SKUsText ?? ""} onChange={(e) => set("d365SKUsText", e.target.value)} rows={2} style={{ ...inputBase, fontFamily: F.sans, resize: "vertical" }} />
          </div>

          <div style={{ fontFamily: F.sans, fontSize: 10, color: BURG, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginTop: 14, marginBottom: 8 }}>Recipient</div>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1fr", gap: 10, marginBottom: 10 }}>
            <div><label style={labelStyle}>Name</label><input value={draft.recipientName ?? ""} onChange={(e) => set("recipientName", e.target.value)} style={inputBase} /></div>
            <div><label style={labelStyle}>Email</label><input value={draft.shipToEmail ?? ""} onChange={(e) => set("shipToEmail", e.target.value)} style={inputBase} /></div>
            <div><label style={labelStyle}>Phone</label><input value={draft.shipToPhone ?? ""} onChange={(e) => set("shipToPhone", e.target.value)} style={inputBase} /></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
            <div><label style={labelStyle}>Address 1</label><input value={draft.shipToAddress1 ?? ""} onChange={(e) => set("shipToAddress1", e.target.value)} style={inputBase} /></div>
            <div><label style={labelStyle}>Address 2</label><input value={draft.shipToAddress2 ?? ""} onChange={(e) => set("shipToAddress2", e.target.value)} style={inputBase} /></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
            <div><label style={labelStyle}>City</label><input value={draft.shipToCity ?? ""} onChange={(e) => set("shipToCity", e.target.value)} style={inputBase} /></div>
            <div><label style={labelStyle}>State</label><input value={draft.shipToState ?? ""} onChange={(e) => set("shipToState", e.target.value)} style={inputBase} /></div>
            <div><label style={labelStyle}>ZIP</label><input value={draft.shipToZip ?? ""} onChange={(e) => set("shipToZip", e.target.value)} style={inputBase} /></div>
            <div><label style={labelStyle}>Country</label><input value={draft.shipToCountry ?? ""} onChange={(e) => set("shipToCountry", e.target.value)} style={inputBase} /></div>
          </div>

          <div style={{ marginBottom: 10 }}>
            <label style={labelStyle}>Items</label>
            <textarea value={draft.itemsDescription ?? ""} onChange={(e) => set("itemsDescription", e.target.value)} rows={2} style={{ ...inputBase, fontFamily: F.sans, resize: "vertical" }} />
          </div>
          <div style={{ marginBottom: 10 }}>
            <label style={labelStyle}>Notes</label>
            <textarea value={draft.notes ?? ""} onChange={(e) => set("notes", e.target.value)} rows={2} style={{ ...inputBase, fontFamily: F.sans, resize: "vertical" }} />
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: F.sans, fontSize: 12, color: INK, cursor: "pointer" }}>
              <input type="checkbox" checked={!!draft.sent} onChange={(e) => set("sent", e.target.checked)} />
              <span>Mark as sent</span>
            </label>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={cancel} disabled={saving} style={{ background: "transparent", color: INK, border: "1px solid " + SOFT_BORDER, fontFamily: F.sans, fontSize: 11, fontWeight: 600, padding: "8px 16px", letterSpacing: 1, textTransform: "uppercase", cursor: saving ? "wait" : "pointer", borderRadius: 99 }}>Cancel</button>
              <button onClick={save} disabled={saving} style={{ background: BURG, color: CREAM, border: "1px solid " + BURG, fontFamily: F.sans, fontSize: 11, fontWeight: 700, padding: "8px 18px", letterSpacing: 1.5, textTransform: "uppercase", cursor: saving ? "wait" : "pointer", borderRadius: 99, opacity: saving ? 0.6 : 1 }}>{saving ? "Saving..." : "Save"}</button>
            </div>
          </div>
          {error && <div style={{ fontFamily: F.sans, fontSize: 12, color: RED, marginTop: 8 }}>{error}</div>}
        </div>
      )}
    </div>
  );
}

// ─── Adverse Reaction log ────────────────────────────────────────

function AdverseReactionLogPanel({ role }) {
  const canSeeList = role && ["Lead Agent", "Manager", "Admin", "Owner"].includes(role);

  const [orderId, setOrderId] = useState("");
  const [ticketId, setTicketId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [country, setCountry] = useState("");
  const [patientSameAsCustomer, setPatientSameAsCustomer] = useState(true);
  const [patientName, setPatientName] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [complaintMethod, setComplaintMethod] = useState("email");
  const [complaintDescription, setComplaintDescription] = useState("");
  const [productsText, setProductsText] = useState("");
  const [lotsText, setLotsText] = useState("");
  const [symptoms, setSymptoms] = useState([]);
  // Aina May 22 — severity now mandatory; start blank so the agent picks.
  const [severity, setSeverity] = useState("");
  const [isSerious, setIsSerious] = useState(false);
  const [escalatedTo, setEscalatedTo] = useState("");
  const [fdaMedwatchFiled, setFdaMedwatchFiled] = useState(false);
  const [mrddNumber, setMrddNumber] = useState("");
  const [returnRequested, setReturnRequested] = useState(false);
  const [rmaNumber, setRmaNumber] = useState("");
  const [followUpAt, setFollowUpAt] = useState("");
  const [followUpMethod, setFollowUpMethod] = useState("");
  const [followUpNotes, setFollowUpNotes] = useState("");
  const [status, setStatus] = useState("open");

  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupHint, setLookupHint] = useState(null);
  const [lookupError, setLookupError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(false);

  async function loadRecent() {
    if (!canSeeList) return;
    setLoading(true);
    try {
      const res = await fetch("/api/logs/adverse-reactions?limit=20");
      const json = await res.json();
      if (res.ok) setRecent(json.rows ?? []);
    } finally { setLoading(false); }
  }
  useEffect(() => { loadRecent(); }, []);

  async function lookupOrder() {
    if (!orderId.trim()) return;
    setLookupLoading(true);
    setLookupError(null);
    setLookupHint(null);
    try {
      const res = await fetch(`/api/orders/lookup?id=${encodeURIComponent(orderId.trim())}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      if (json.customerName) setCustomerName(json.customerName);
      if (json.customerEmail) setCustomerEmail(json.customerEmail);
      // Per Aina's testing — phone wasn't auto-populating on LOOKUP.
      // API already returns customerPhone; we were just dropping it here.
      if (json.customerPhone) setCustomerPhone(json.customerPhone);
      if (json.country) setCountry(json.country);
      if (json.lineItems?.length) {
        setProductsText(json.lineItems.map((li) => `${li.title}${li.variantTitle ? " — " + li.variantTitle : ""}`).join("\n"));
      }
      setLookupHint({ items: json.lineItems?.map((li) => `${li.title}${li.variantTitle ? " — " + li.variantTitle : ""} x${li.quantity}`).join("\n") });
    } catch (e) { setLookupError(e.message); }
    finally { setLookupLoading(false); }
  }

  function toggleSymptom(s) {
    setSymptoms((cur) => cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]);
  }

  async function submit() {
    setFormError(null);
    if (!orderId.trim()) { setFormError("Order ID required"); return; }
    if (!ticketId.trim()) { setFormError("Gorgias ticket # required"); return; }
    if (!complaintDescription.trim()) { setFormError("Verbatim complaint description required"); return; }
    // Aina May 22 — products affected / symptoms / severity now mandatory.
    const productsAffected = productsText.split(/[\n,]/).map((s) => s.trim()).filter(Boolean);
    if (productsAffected.length === 0) { setFormError("At least one Product Affected required"); return; }
    if (symptoms.length === 0) { setFormError("Select at least one symptom"); return; }
    if (!severity) { setFormError("Severity required"); return; }
    setSubmitting(true);
    try {
      const lotNumbers = lotsText.split(/[\n,]/).map((s) => s.trim()).filter(Boolean);
      const res = await fetch("/api/logs/adverse-reactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: orderId.trim(),
          ticketId: ticketId.trim() || undefined,
          customerName: customerName.trim() || undefined,
          customerEmail: customerEmail.trim() || undefined,
          customerPhone: customerPhone.trim() || undefined,
          country: country.trim() || undefined,
          patientSameAsCustomer,
          patientName: patientName.trim() || undefined,
          patientAge: patientAge.trim() || undefined,
          complaintMethod,
          complaintDescription: complaintDescription.trim(),
          productsAffected, lotNumbers, symptoms,
          severity, isSerious,
          escalatedTo: escalatedTo || undefined,
          fdaMedwatchFiled, mrddNumber: mrddNumber.trim() || undefined,
          returnRequested, rmaNumber: rmaNumber.trim() || undefined,
          followUpAt: followUpAt || undefined,
          followUpMethod: followUpMethod.trim() || undefined,
          followUpNotes: followUpNotes.trim() || undefined,
          status,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setOrderId(""); setTicketId(""); setCustomerName(""); setCustomerEmail(""); setCustomerPhone(""); setCountry("");
      setPatientSameAsCustomer(true); setPatientName(""); setPatientAge("");
      setComplaintMethod("email"); setComplaintDescription("");
      setProductsText(""); setLotsText(""); setSymptoms([]);
      setSeverity(""); setIsSerious(false); setEscalatedTo("");
      setFdaMedwatchFiled(false); setMrddNumber("");
      setReturnRequested(false); setRmaNumber("");
      setFollowUpAt(""); setFollowUpMethod(""); setFollowUpNotes("");
      setStatus("open"); setLookupHint(null);
      loadRecent();
    } catch (e) { setFormError(e.message); }
    finally { setSubmitting(false); }
  }

  const inputBase = { width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid " + SOFT_BORDER, background: W, fontFamily: F.sans, fontSize: 13, color: INK, outline: "none", boxSizing: "border-box" };
  const labelStyle = { fontFamily: F.sans, fontSize: 10, color: INK, opacity: 0.7, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 4, display: "block" };
  const checkRow = { display: "flex", alignItems: "center", gap: 8, fontFamily: F.sans, fontSize: 12, color: INK, cursor: "pointer" };

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "16px 24px 96px" }}>
      <div style={{ background: "#fff8f5", border: "1px solid " + RED, borderLeft: "3px solid " + RED, borderRadius: 8, padding: "12px 16px", marginBottom: 20, fontFamily: F.sans, fontSize: 12, color: BURG }}>
        <strong style={{ color: RED, letterSpacing: 1, textTransform: "uppercase" }}>Compliance record.</strong>{" "}
        Capture the customer's words verbatim. Do not troubleshoot. Issue full refund. Escalate to Head of CX immediately for any reaction.
      </div>

      <div style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 14, padding: "24px 28px", marginBottom: 24 }}>
        <div style={{ fontFamily: F.serif, fontSize: 22, color: BURG, fontWeight: 600, marginBottom: 18 }}>Log an adverse reaction</div>

        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
          <div>
            <label style={labelStyle}>Order ID</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input value={orderId} onChange={(e) => setOrderId(e.target.value)} placeholder="#LME-10500" style={{ ...inputBase, flex: 1 }} />
              <button onClick={lookupOrder} disabled={!orderId.trim() || lookupLoading} style={{ background: BURG, color: CREAM, border: "1px solid " + BURG, fontFamily: F.sans, fontSize: 11, fontWeight: 700, padding: "0 18px", letterSpacing: 1.5, textTransform: "uppercase", cursor: orderId.trim() && !lookupLoading ? "pointer" : "not-allowed", borderRadius: 8, opacity: orderId.trim() && !lookupLoading ? 1 : 0.5 }}>{lookupLoading ? "..." : "Lookup"}</button>
            </div>
            {lookupError && <div style={{ fontFamily: F.sans, fontSize: 11, color: RED, marginTop: 4 }}>{lookupError}</div>}
          </div>
          <div>
            <label style={labelStyle}>Gorgias ticket # <span style={{ color: RED, fontWeight: 700 }}>*</span></label>
            <input value={ticketId} onChange={(e) => setTicketId(e.target.value)} placeholder="e.g. 12345" style={inputBase} />
          </div>
          <div>
            <label style={labelStyle}>Reported via</label>
            <select value={complaintMethod} onChange={(e) => setComplaintMethod(e.target.value)} style={inputBase}>
              {AR_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
        </div>

        {lookupHint?.items && (
          <div style={{ background: CREAM, border: "1px solid " + SOFT_BORDER, borderRadius: 8, padding: "12px 14px", marginBottom: 14, fontFamily: F.sans, fontSize: 12, color: INK }}>
            <div style={{ fontWeight: 700, marginBottom: 4, color: BURG }}>Order items (auto-filled below)</div>
            <pre style={{ margin: 0, fontFamily: F.sans, fontSize: 12, whiteSpace: "pre-wrap" }}>{lookupHint.items}</pre>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
          <div><label style={labelStyle}>Customer name</label><input value={customerName} onChange={(e) => setCustomerName(e.target.value)} style={inputBase} /></div>
          <div><label style={labelStyle}>Email</label><input value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} style={inputBase} /></div>
          <div><label style={labelStyle}>Phone</label><input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} style={inputBase} /></div>
          <div><label style={labelStyle}>Country</label><input value={country} onChange={(e) => setCountry(e.target.value)} style={inputBase} /></div>
        </div>

        <div style={{ background: CREAM, borderRadius: 8, padding: "12px 14px", marginBottom: 14 }}>
          <label style={{ ...checkRow, marginBottom: patientSameAsCustomer ? 0 : 10 }}>
            <input type="checkbox" checked={patientSameAsCustomer} onChange={(e) => setPatientSameAsCustomer(e.target.checked)} />
            <span>Patient is the customer</span>
          </label>
          {!patientSameAsCustomer && (
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
              <div><label style={labelStyle}>Patient name</label><input value={patientName} onChange={(e) => setPatientName(e.target.value)} style={inputBase} /></div>
              <div><label style={labelStyle}>Age</label><input value={patientAge} onChange={(e) => setPatientAge(e.target.value)} style={inputBase} /></div>
            </div>
          )}
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Verbatim complaint <span style={{ color: RED, fontWeight: 700 }}>*</span> (paste exactly what the customer said)</label>
          <textarea value={complaintDescription} onChange={(e) => setComplaintDescription(e.target.value)} rows={4} placeholder="Use the customer's own words. Do not summarise or interpret." style={{ ...inputBase, fontFamily: F.sans, resize: "vertical" }} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
          <div>
            <label style={labelStyle}>Products affected (one per line) <span style={{ color: RED, fontWeight: 700 }}>*</span></label>
            <textarea value={productsText} onChange={(e) => setProductsText(e.target.value)} rows={2} placeholder="Daily Ultimate Essentials Pro" style={{ ...inputBase, fontFamily: F.sans, resize: "vertical" }} />
          </div>
          <div>
            <label style={labelStyle}>Lot # (one per line, if known)</label>
            <textarea value={lotsText} onChange={(e) => setLotsText(e.target.value)} rows={2} placeholder="optional" style={{ ...inputBase, fontFamily: F.sans, resize: "vertical" }} />
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Symptoms (tick all that apply) <span style={{ color: RED, fontWeight: 700 }}>*</span></label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {AR_COMMON_SYMPTOMS.map((s) => {
              const active = symptoms.includes(s);
              return (
                <button key={s} type="button" onClick={() => toggleSymptom(s)} style={{
                  background: active ? BURG : "transparent",
                  color: active ? CREAM : BURG,
                  border: "1px solid " + (active ? BURG : SOFT_BORDER),
                  fontFamily: F.sans, fontSize: 12, fontWeight: 600, padding: "6px 12px",
                  borderRadius: 99, cursor: "pointer",
                }}>{s}</button>
              );
            })}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
          <div>
            <label style={labelStyle}>Severity <span style={{ color: RED, fontWeight: 700 }}>*</span></label>
            <select value={severity} onChange={(e) => { setSeverity(e.target.value); if (e.target.value === "serious") setIsSerious(true); }} style={{ ...inputBase, color: severity === "serious" ? RED : INK, fontWeight: severity === "serious" ? 700 : 400 }}>
              <option value="">Select severity…</option>
              {AR_SEVERITY.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Escalated to</label>
            <select value={escalatedTo} onChange={(e) => setEscalatedTo(e.target.value)} style={inputBase}>
              <option value="">— not yet escalated</option>
              {AR_ESCALATION.map((e) => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Status</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)} style={inputBase}>
              {AR_STATUS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </div>

        <div style={{ background: CREAM, borderRadius: 8, padding: "12px 14px", marginBottom: 14, display: "flex", flexDirection: "column", gap: 8 }}>
          <label style={checkRow}><input type="checkbox" checked={isSerious} onChange={(e) => setIsSerious(e.target.checked)} /><span>Serious Adverse Event (SAE) — hospitalization, life-threatening, or persistent disability</span></label>
          <label style={checkRow}><input type="checkbox" checked={fdaMedwatchFiled} onChange={(e) => setFdaMedwatchFiled(e.target.checked)} /><span>FDA MEDWATCH form filed</span></label>
          <label style={checkRow}><input type="checkbox" checked={returnRequested} onChange={(e) => setReturnRequested(e.target.checked)} /><span>Customer requested to return product</span></label>
          {(isSerious || fdaMedwatchFiled) && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 6 }}>
              <div><label style={labelStyle}>MRDD #</label><input value={mrddNumber} onChange={(e) => setMrddNumber(e.target.value)} style={inputBase} /></div>
              <div><label style={labelStyle}>RMA #</label><input value={rmaNumber} onChange={(e) => setRmaNumber(e.target.value)} style={inputBase} /></div>
            </div>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
          <div>
            <label style={labelStyle}>Follow-up scheduled</label>
            <input type="datetime-local" value={followUpAt} onChange={(e) => setFollowUpAt(e.target.value)} style={inputBase} />
          </div>
          <div>
            <label style={labelStyle}>Follow-up method</label>
            <input value={followUpMethod} onChange={(e) => setFollowUpMethod(e.target.value)} placeholder="email / phone / etc." style={inputBase} />
          </div>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Follow-up notes</label>
          <textarea value={followUpNotes} onChange={(e) => setFollowUpNotes(e.target.value)} rows={2} placeholder="Internal notes — what was actioned, what's next" style={{ ...inputBase, fontFamily: F.sans, resize: "vertical" }} />
        </div>

        {formError && <div style={{ background: "#fee", border: "1px solid " + RED, color: RED, padding: 8, borderRadius: 6, marginBottom: 12, fontFamily: F.sans, fontSize: 12 }}>{formError}</div>}

        <button onClick={submit} disabled={submitting} style={{ background: severity === "serious" ? RED : BURG, color: CREAM, border: "1px solid " + (severity === "serious" ? RED : BURG), fontFamily: F.sans, fontSize: 12, fontWeight: 700, padding: "12px 28px", letterSpacing: 2, textTransform: "uppercase", cursor: submitting ? "wait" : "pointer", borderRadius: 99, opacity: submitting ? 0.6 : 1 }}>{submitting ? "Saving..." : "File adverse reaction report"}</button>
      </div>

      {canSeeList ? (
        (() => {
          const recent7 = filterLast7Days(recent);
          return (
            <>
              <div style={{ fontFamily: F.sans, fontSize: 11, color: BURG, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 12 }}>
                Recent reports · last 7 days ({loading ? "..." : recent7.length})
              </div>
              <RecentLogTable
                rows={recent7}
                emptyMessage="No adverse reactions logged in the last 7 days."
                columns={[
                  { key: "createdAt",    label: "Date",     width: 70,  render: (r) => shortDate(r.createdAt) },
                  { key: "orderId",      label: "Order",    width: 130, render: (r) => (
                    <span>
                      {r.orderId}
                      {r.isSerious && (
                        <span style={{ fontFamily: F.sans, fontSize: 9, color: RED, fontWeight: 800, letterSpacing: 1, padding: "1px 6px", border: "1px solid " + RED, borderRadius: 99, marginLeft: 6 }}>SAE</span>
                      )}
                    </span>
                  ) },
                  { key: "severity",     label: "Severity", width: 90 },
                  { key: "symptoms",     label: "Symptoms",             render: (r) => truncate((r.symptoms || []).join(", "), 80) },
                  { key: "escalatedTo",  label: "Escalated",width: 110, render: (r) => r.escalatedTo || "—" },
                  { key: "status",       label: "Status",   width: 90 },
                ]}
              />
            </>
          );
        })()
      ) : (
        <div style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 14, color: INK, opacity: 0.55, padding: "16px 0" }}>
          Reports list visible to Lead Agent and above. Your submission was filed — check with your Lead if you need to confirm.
        </div>
      )}
    </div>
  );
}

// ─── Playbook Tab ─────────────────────────────────────────────────
const KB_CATEGORIES = ["All", "Safety", "Product", "Product Quality", "Value", "Results", "Shipping", "Subscription", "Partnership"];
// Live Playbook subtabs (May 2026 redesign). Source of truth lives in
// lib/playbook-data.js as PLAYBOOK_SUBTABS_NEW — re-aliased here so the
// rest of the file's local references stay tidy. Old legacy subcomponents
// (PlaybookMacros, PlaybookRules, etc.) remain in the file as orphans
// and can be revived if Cherie wants Macros back later.
const PLAYBOOK_SUBTABS = PLAYBOOK_SUBTABS_NEW;

// ═══════════════════════════════════════════════════════════════════════════
// PLAYBOOK TAB — May 2026 redesign
// Products is default. Tabs in order: Products · Policy · Shipping ·
// Escalation · Voice · Non-Negotiables. Search scopes to the active panel.
// ═══════════════════════════════════════════════════════════════════════════

function PlaybookTab({ role }) {
  const [sub, setSub] = useState("Products");
  const [query, setQuery] = useState("");
  const eyebrowS = { fontFamily: F.sans, fontSize: 10, color: GOLD, textTransform: "uppercase", letterSpacing: 4, fontWeight: 600, marginBottom: 14 };

  // Subtitle that follows the active subtab — orients the reader without
  // a separate heading per panel.
  const subSubtitle = {
    Products: "The full LUMÉ range — know every product so you can answer anything.",
    "How To": "Application guides, usage FAQs, and shipping windows by region.",
    Policy: "Refunds, replacements, subscriptions — navigate every tricky situation.",
    "Tone of Voice": "The LUMÉ way — warm, confident, direct. No jargon, no corporate script.",
    Escalation: "When to flag, who to flag, what to say when you do.",
    "Non-Negotiables": "The lines we never cross. No grey area.",
  };

  return (
    <div style={{ background: CREAM, minHeight: "100vh" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "56px 24px 24px" }}>
        <div style={eyebrowS}>LUMÉ CX — Playbook · the brand on tap</div>
        <div style={{ fontFamily: F.serif, fontSize: 48, color: BURG, fontWeight: 600, lineHeight: 1.05, marginBottom: 8, letterSpacing: -1 }}>
          {sub}
        </div>
        <div style={{ fontFamily: F.sans, fontSize: 13, color: INK, opacity: 0.7, marginBottom: 18, lineHeight: 1.5 }}>
          {subSubtitle[sub] || ""}
        </div>

        {/* Search bar — scoped to the active panel */}
        <div style={{ position: "relative", marginBottom: 22 }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${sub.toLowerCase()}…`}
            style={{
              width: "100%",
              padding: "12px 16px 12px 42px",
              fontFamily: F.sans, fontSize: 14,
              background: W,
              border: "1px solid " + SOFT_BORDER,
              borderRadius: 8,
              color: INK,
              outline: "none",
              transition: "border-color 0.15s",
            }}
            onFocus={(e) => (e.target.style.borderColor = BURG)}
            onBlur={(e) => (e.target.style.borderColor = SOFT_BORDER)}
          />
          <div style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", fontSize: 14, opacity: 0.4, pointerEvents: "none" }}>⌕</div>
          {query && (
            <button
              onClick={() => setQuery("")}
              style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", fontSize: 18, color: INK, opacity: 0.4, cursor: "pointer", padding: 4 }}
              aria-label="Clear search"
            >×</button>
          )}
        </div>

        {/* Subtab chips */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
          {PLAYBOOK_SUBTABS.map((s) => {
            const active = s === sub;
            return (
              <button key={s} onClick={() => { setSub(s); setQuery(""); }} style={{
                background: active ? BURG : "transparent",
                color: active ? CREAM : BURG,
                border: "1px solid " + (active ? BURG : SOFT_BORDER),
                fontFamily: F.sans, fontSize: 11, fontWeight: 700, padding: "10px 18px",
                letterSpacing: 2, textTransform: "uppercase", cursor: "pointer", borderRadius: 99,
                transition: "all 0.15s",
              }}>
                {s}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "8px 24px 96px" }}>
        {sub === "Products"          && <PlaybookProductsNew    query={query} />}
        {sub === "How To"           && <PlaybookShippingNew    query={query} />}
        {sub === "Policy"           && <PlaybookPolicyNew      query={query} />}
        {sub === "Tone of Voice"    && <PlaybookVoiceNew       query={query} />}
        {sub === "Escalation"       && <PlaybookEscalationNew  query={query} />}
        {sub === "Non-Negotiables"  && <PlaybookNonNegNew      query={query} />}
      </div>
    </div>
  );
}

// ─── Shared building blocks for playbook subpanels ────────────────────

// Light markdown renderer for Playbook card bodies: **bold**, *italic*,
// and newlines. Same pattern as the chat renderer but local to keep this
// section self-contained.
function renderPlaybookMarkdown(text) {
  if (!text) return null;
  const lines = text.split("\n");
  return lines.map((line, li) => {
    const parts = [];
    let i = 0;
    while (i < line.length) {
      // **bold**
      if (line.startsWith("**", i)) {
        const end = line.indexOf("**", i + 2);
        if (end !== -1) {
          parts.push(<strong key={`b-${li}-${i}`} style={{ color: BURG, fontWeight: 600 }}>{line.slice(i + 2, end)}</strong>);
          i = end + 2;
          continue;
        }
      }
      // *italic*
      if (line[i] === "*" && line[i + 1] !== "*") {
        const end = line.indexOf("*", i + 1);
        if (end !== -1) {
          parts.push(<em key={`i-${li}-${i}`}>{line.slice(i + 1, end)}</em>);
          i = end + 1;
          continue;
        }
      }
      // plain run — accumulate until next marker
      let j = i;
      while (j < line.length && !(line.startsWith("**", j) || (line[j] === "*" && line[j + 1] !== "*"))) j++;
      parts.push(line.slice(i, j));
      i = j;
    }
    return (
      <span key={li}>
        {parts}
        {li < lines.length - 1 && <br />}
      </span>
    );
  });
}

// Section header used inside subpanels.
function PlaybookSectionHeader({ children }) {
  return (
    <div style={{
      fontFamily: F.sans, fontSize: 10, color: GOLD, fontWeight: 700,
      textTransform: "uppercase", letterSpacing: 3.5,
      marginTop: 32, marginBottom: 14, paddingBottom: 8,
      borderBottom: "1px solid " + SOFT_BORDER,
    }}>
      {children}
    </div>
  );
}

// Reusable expandable Q&A card with optional "Why it matters" footer.
function PlaybookQACard({ q, a, tag, why, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{
      background: W,
      border: "1px solid " + SOFT_BORDER,
      borderRadius: 8,
      marginBottom: 10,
      overflow: "hidden",
      transition: "border-color 0.15s",
    }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%", background: "transparent", border: "none",
          padding: "16px 20px", display: "flex", alignItems: "center",
          gap: 12, cursor: "pointer", textAlign: "left",
          fontFamily: F.sans,
        }}
      >
        <div style={{ flex: 1, fontSize: 14, fontWeight: 600, color: INK, lineHeight: 1.4 }}>
          {q}
        </div>
        {tag && (
          <span style={{
            fontFamily: F.sans, fontSize: 9, color: GOLD, fontWeight: 700,
            letterSpacing: 2, textTransform: "uppercase",
            background: "transparent", padding: "3px 8px",
            border: "1px solid " + SOFT_BORDER, borderRadius: 99,
            whiteSpace: "nowrap",
          }}>{tag}</span>
        )}
        <span style={{ fontSize: 12, color: BURG, opacity: 0.5, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>⌄</span>
      </button>
      {open && (
        <div style={{
          padding: "14px 20px 16px",
          borderTop: "1px solid " + SOFT_BORDER,
          fontFamily: F.sans, fontSize: 14, lineHeight: 1.6, color: INK,
        }}>
          {renderPlaybookMarkdown(a)}
          {why && (
            <div style={{
              marginTop: 14, paddingTop: 12,
              borderTop: "1px dashed " + SOFT_BORDER,
              fontSize: 13, lineHeight: 1.55, color: INK,
              opacity: 0.85, fontStyle: "italic",
            }}>
              <span style={{
                fontStyle: "normal", fontWeight: 600, fontSize: 10,
                letterSpacing: 2, textTransform: "uppercase",
                color: BURG, opacity: 0.75, marginRight: 6,
              }}>Why it matters ·</span>
              {renderPlaybookMarkdown(why)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Chip filter row.
function PlaybookChipRow({ chips, counts, active, onChange }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
      {chips.map((c) => {
        const isActive = c.key === active;
        const count = counts[c.key] ?? 0;
        return (
          <button
            key={c.key}
            onClick={() => onChange(c.key)}
            style={{
              background: isActive ? BURG : W,
              color: isActive ? CREAM : BURG,
              border: "1px solid " + (isActive ? BURG : SOFT_BORDER),
              fontFamily: F.sans, fontSize: 11, fontWeight: 600,
              padding: "6px 12px", borderRadius: 99, cursor: "pointer",
              display: "inline-flex", alignItems: "center", gap: 6,
              transition: "all 0.15s",
            }}
          >
            {c.label}
            <span style={{ fontSize: 10, opacity: 0.7, fontWeight: 700 }}>{count}</span>
          </button>
        );
      })}
    </div>
  );
}

// Helper — filter Q&A list by category + search query.
function filterQA(list, cat, query) {
  let out = cat === "all" ? list : list.filter((x) => x.cat === cat);
  if (query && query.trim()) {
    const q = query.trim().toLowerCase();
    out = out.filter((x) =>
      (x.q || "").toLowerCase().includes(q) ||
      (x.a || "").toLowerCase().includes(q) ||
      (x.why || "").toLowerCase().includes(q)
    );
  }
  return out;
}

// Pricing reminder banner used at top of Products tab.
function PricingNote() {
  return (
    <div style={{
      background: "#FDF8F0",
      border: "1px solid #E8DCC0",
      borderLeft: "3px solid " + GOLD,
      padding: "12px 16px",
      marginBottom: 22,
      fontSize: 13, lineHeight: 1.55, color: INK,
      borderRadius: 4,
      fontFamily: F.sans,
    }}>
      <strong style={{ color: BURG }}>Pricing reminder:</strong> Customers see their local currency. Always pull the actual amount from the customer's order in Shopify/Gorgias before quoting any number — never quote pricing from internal docs.
    </div>
  );
}

// ─── Products subpanel ───────────────────────────────────────────────

function PlaybookProductsNew({ query }) {
  const [openProduct, setOpenProduct] = useState(null);
  const [chip, setChip] = useState("all");

  // Combined Q&A list (About IM8 + Common Product Q&As) for chip filtering.
  const allQA = useMemo(() => [...ABOUT_IM8_QA, ...COMMON_PRODUCT_QA], []);
  const filtered = useMemo(() => filterQA(allQA, chip, query), [allQA, chip, query]);

  // Counts per chip key (for the chip badges).
  const counts = useMemo(() => {
    const c = { all: allQA.length };
    for (const item of allQA) c[item.cat] = (c[item.cat] || 0) + 1;
    return c;
  }, [allQA]);

  // When searching, hide product cards (Q&A search is the focus).
  const showProducts = !query || !query.trim();

  return (
    <div>
      {/* PricingNote removed — agents pull live pricing from Shopify/Gorgias */}

      {/* Product reference cards */}
      {showProducts && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14, marginBottom: 8 }}>
          {PRODUCT_CARDS.map((p) => {
            const isOpen = openProduct === p.key;
            return (
              <div key={p.key} style={{
                background: W,
                border: "1px solid " + SOFT_BORDER,
                borderRadius: 8,
                padding: 20,
                cursor: "pointer",
                transition: "all 0.15s",
                gridColumn: isOpen ? "1 / -1" : "auto",
              }} onClick={() => setOpenProduct(isOpen ? null : p.key)}>
                <div style={{ fontFamily: F.serif, fontSize: 22, color: BURG, fontWeight: 600, marginBottom: 4 }}>{p.name}</div>
                <div style={{ fontFamily: F.sans, fontSize: 12, color: INK, opacity: 0.7, marginBottom: 14 }}>{p.tagline}</div>
                <div style={{ display: "flex", gap: 16, marginBottom: isOpen ? 18 : 0 }}>
                  {p.stats.map((s, i) => (
                    <div key={i} style={{ fontFamily: F.sans, fontSize: 11, color: INK }}>
                      <strong style={{ display: "block", color: BURG, fontSize: 18, fontWeight: 700 }}>{s.value}</strong>
                      <span style={{ opacity: 0.6, fontSize: 10, letterSpacing: 1.2, textTransform: "uppercase" }}>{s.label}</span>
                    </div>
                  ))}
                </div>
                {isOpen && (
                  <div style={{ borderTop: "1px solid " + SOFT_BORDER, paddingTop: 16, marginTop: 4 }}>
                    {p.sections.map((sec, si) => (
                      <div key={si} style={{ marginBottom: 14 }}>
                        <div style={{ fontFamily: F.sans, fontSize: 10, color: GOLD, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>{sec.heading}</div>
                        <ul style={{ margin: 0, paddingLeft: 18, fontFamily: F.sans, fontSize: 13, lineHeight: 1.6, color: INK }}>
                          {sec.items.map((it, ii) => (
                            <li key={ii} style={{ marginBottom: 4 }}>{renderPlaybookMarkdown(it)}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Common Questions section */}
      <PlaybookSectionHeader>Common Questions</PlaybookSectionHeader>
      <PlaybookChipRow chips={PRODUCT_QA_CHIPS} counts={counts} active={chip} onChange={setChip} />
      {filtered.length === 0 ? (
        <div style={{ fontFamily: F.sans, fontSize: 13, color: INK, opacity: 0.6, padding: 24, textAlign: "center" }}>
          No questions match. Try a different search or chip.
        </div>
      ) : (
        filtered.map((qa, i) => (
          <PlaybookQACard key={qa.q + i} q={qa.q} a={qa.a} tag={qa.tag} why={qa.why} />
        ))
      )}
    </div>
  );
}

// ─── Policy subpanel ─────────────────────────────────────────────────

function PlaybookPolicyNew({ query }) {
  const [chip, setChip] = useState("all");
  const filtered = useMemo(() => filterQA(POLICY_QA, chip, query), [chip, query]);
  const counts = useMemo(() => {
    const c = { all: POLICY_QA.length };
    for (const item of POLICY_QA) c[item.cat] = (c[item.cat] || 0) + 1;
    return c;
  }, []);

  return (
    <div>
      <PlaybookChipRow chips={POLICY_QA_CHIPS} counts={counts} active={chip} onChange={setChip} />
      {filtered.length === 0 ? (
        <div style={{ fontFamily: F.sans, fontSize: 13, color: INK, opacity: 0.6, padding: 24, textAlign: "center" }}>
          No questions match. Try a different search or chip.
        </div>
      ) : (
        filtered.map((qa, i) => (
          <PlaybookQACard key={qa.q + i} q={qa.q} a={qa.a} tag={qa.tag} why={qa.why} />
        ))
      )}
    </div>
  );
}

// ─── Shipping subpanel ───────────────────────────────────────────────

function PlaybookShippingNew({ query }) {
  const q = (query || "").trim().toLowerCase();

  const HOW_TO_GUIDES = [
    {
      name: "Smooth Serum",
      emoji: "✨",
      steps: [
        "Apply 2–3 pumps to palms and rub together",
        "Work through mid-lengths to ends on damp or dry hair",
        "Do not apply to roots (weighs down fine hair)",
        "Style as usual — works with or without heat",
      ],
      tip: "For maximum frizz control, apply on damp hair before blowdrying.",
      when: "Damp or dry · Daily · Heat styling days",
    },
    {
      name: "Repair Serum",
      emoji: "🔧",
      steps: [
        "Start with freshly washed, towel-dried damp hair",
        "Apply 3–4 pumps, focusing on the most damaged sections and ends",
        "Leave in — do not rinse",
        "Style as usual. Use consistently for 6+ weeks for bond repair",
      ],
      tip: "Bond repair is cumulative. If a customer says it's not working at 2 weeks, that's normal — encourage them to continue.",
      when: "Damp hair only · Daily · Best for damaged/colour-treated",
    },
    {
      name: "Scalp Serum",
      emoji: "🌿",
      steps: [
        "Part hair into sections and apply directly to the scalp using the dropper",
        "Massage in with fingertips for 1–2 minutes",
        "Do not rinse out",
        "Use 3× per week — not daily. Over-use can cause irritation",
      ],
      tip: "The tingling is from peppermint oil — normal and expected. It means circulation is increasing. If it burns rather than tingles, stop use.",
      when: "Dry or slightly damp scalp · 3× per week · Do not rinse",
    },
    {
      name: "Glow Serum",
      emoji: "💫",
      steps: [
        "Dispense 1–2 pumps into palm",
        "Apply all over — roots to ends — for full-hair glow",
        "Or apply to ends only as a split-end treatment",
        "Use on dry or damp hair — can be used daily",
      ],
      tip: "The lightest serum in the range. Ideal for fine hair. Can be layered under Smooth or over Repair.",
      when: "Damp or dry · Daily · All hair types",
    },
  ];

  const filteredGuides = q
    ? HOW_TO_GUIDES.filter((g) =>
        g.name.toLowerCase().includes(q) ||
        g.steps.some((s) => s.toLowerCase().includes(q)) ||
        g.tip.toLowerCase().includes(q)
      )
    : HOW_TO_GUIDES;

  const filteredShipping = q
    ? SHIPPING_LEAD_TIMES.filter((r) => r.region.toLowerCase().includes(q))
    : SHIPPING_LEAD_TIMES;

  return (
    <div>
      {/* Application guides */}
      {(!q || filteredGuides.length > 0) && (
        <>
          <PlaybookSectionHeader>Application guides</PlaybookSectionHeader>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 14, marginBottom: 24 }}>
            {filteredGuides.map((g) => (
              <div key={g.name} style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 10, padding: "18px 20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <span style={{ fontSize: 22 }}>{g.emoji}</span>
                  <div>
                    <div style={{ fontFamily: F.serif, fontSize: 17, fontWeight: 600, color: BURG }}>{g.name}</div>
                    <div style={{ fontFamily: F.sans, fontSize: 10, color: GOLD, letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 700 }}>{g.when}</div>
                  </div>
                </div>
                <ol style={{ margin: 0, paddingLeft: 18, fontFamily: F.sans, fontSize: 13, color: INK, lineHeight: 1.7 }}>
                  {g.steps.map((s, i) => <li key={i} style={{ marginBottom: 4 }}>{s}</li>)}
                </ol>
                <div style={{ marginTop: 12, background: CREAM, borderRadius: 6, padding: "8px 12px", fontFamily: F.sans, fontSize: 12, color: INK, opacity: 0.8, lineHeight: 1.5 }}>
                  💡 {g.tip}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Shipping windows */}
      {(!q || filteredShipping.length > 0) && (
        <>
          <PlaybookSectionHeader>Shipping windows</PlaybookSectionHeader>
          <div style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 8, overflow: "hidden", marginBottom: 8 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", background: CREAM, padding: "8px 18px", fontFamily: F.sans, fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: INK, opacity: 0.6 }}>
              <span>Region</span><span style={{ textAlign: "center" }}>Standard</span><span style={{ textAlign: "right" }}>Express</span>
            </div>
            {filteredShipping.map((r, i) => (
              <div key={r.region} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", alignItems: "center", padding: "12px 18px", borderTop: i === 0 ? "none" : "1px solid " + SOFT_BORDER, fontFamily: F.sans, fontSize: 13, color: INK }}>
                <span style={{ fontWeight: 600 }}>{r.region}</span>
                <span style={{ textAlign: "center", color: BURG }}>{r.standard}</span>
                <span style={{ textAlign: "right", color: BURG }}>{r.express}</span>
              </div>
            ))}
          </div>
          <div style={{ fontFamily: F.sans, fontSize: 11, color: INK, opacity: 0.45, marginTop: 8 }}>
            Business days from dispatch. Express available at checkout. Timelines are estimates — check Aftership for live tracking.
          </div>
        </>
      )}
    </div>
  );
}

// ─── Escalation subpanel ─────────────────────────────────────────────

function PlaybookEscalationNew({ query }) {
  const q = (query || "").trim().toLowerCase();

  const escalateList = q
    ? ESCALATE_IMMEDIATELY.filter((x) => x.toLowerCase().includes(q))
    : ESCALATE_IMMEDIATELY;

  const treeRows = q
    ? DECISION_TREE.filter((x) =>
        x.tag.toLowerCase().includes(q) ||
        x.play.toLowerCase().includes(q) ||
        x.save.toLowerCase().includes(q)
      )
    : DECISION_TREE;

  return (
    <div>
      <PlaybookSectionHeader>Escalate Immediately</PlaybookSectionHeader>
      <div style={{ fontFamily: F.sans, fontSize: 13, color: INK, opacity: 0.7, marginBottom: 14, lineHeight: 1.55 }}>
        Slack the Head of CX as soon as any of these come in — don't wait for the case to play out.
      </div>
      <div style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 8, padding: "14px 20px" }}>
        <ul style={{ margin: 0, paddingLeft: 18, fontFamily: F.sans, fontSize: 14, lineHeight: 1.7, color: INK }}>
          {escalateList.map((line, i) => (
            <li key={i} style={{ marginBottom: 4 }}>{line}</li>
          ))}
        </ul>
      </div>

      <PlaybookSectionHeader>Decision Tree</PlaybookSectionHeader>
      <div style={{ fontFamily: F.sans, fontSize: 13, color: INK, opacity: 0.7, marginBottom: 14, lineHeight: 1.55 }}>
        By ticket tag — what to do, whether to attempt a save, when to cancel immediately.
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {treeRows.map((row, i) => (
          <PlaybookQACard
            key={row.tag + i}
            q={row.tag}
            a={`**Play:** ${row.play}\n\n**Save attempt:** ${row.save}  ·  **Cancel immediately:** ${row.cancelNow}`}
            tag={row.save === "NO" || row.save === "No" ? "NO SAVE" : row.save === "N/A" ? "NEUTRAL" : "TRY SAVE"}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Voice subpanel ──────────────────────────────────────────────────

function PlaybookVoiceNew({ query }) {
  const q = (query || "").trim().toLowerCase();
  const filteredPairs = q
    ? VOICE_PAIRS.filter((p) =>
        (p.bad || "").toLowerCase().includes(q) ||
        (p.good || "").toLowerCase().includes(q)
      )
    : VOICE_PAIRS;

  return (
    <div>
      <PlaybookSectionHeader>We Are / We Are Not</PlaybookSectionHeader>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
        <div style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 8, padding: 20 }}>
          <div style={{ fontFamily: F.sans, fontSize: 10, color: GOLD, fontWeight: 700, letterSpacing: 2.5, textTransform: "uppercase", marginBottom: 10 }}>We Are</div>
          <ul style={{ margin: 0, paddingLeft: 18, fontFamily: F.sans, fontSize: 14, lineHeight: 1.8, color: INK }}>
            {VOICE_RULES.we_are.map((v, i) => <li key={i}>{v}</li>)}
          </ul>
        </div>
        <div style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 8, padding: 20 }}>
          <div style={{ fontFamily: F.sans, fontSize: 10, color: GOLD, fontWeight: 700, letterSpacing: 2.5, textTransform: "uppercase", marginBottom: 10 }}>We Are Not</div>
          <ul style={{ margin: 0, paddingLeft: 18, fontFamily: F.sans, fontSize: 14, lineHeight: 1.8, color: INK, opacity: 0.7 }}>
            {VOICE_RULES.we_are_not.map((v, i) => <li key={i}>{v}</li>)}
          </ul>
        </div>
      </div>

      <PlaybookSectionHeader>Bad → Good Rewrites</PlaybookSectionHeader>
      {filteredPairs.length === 0 ? (
        <div style={{ fontFamily: F.sans, fontSize: 13, color: INK, opacity: 0.6, padding: 24, textAlign: "center" }}>
          No rewrites match.
        </div>
      ) : (
        filteredPairs.map((p, i) => (
          <div key={i} style={{
            display: "grid", gridTemplateColumns: "1fr auto 1fr", gap: 14,
            alignItems: "center", marginBottom: 10,
            background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 8, padding: "14px 18px",
          }}>
            <div style={{ fontFamily: F.sans, fontSize: 13, color: INK, opacity: 0.6, fontStyle: "italic", lineHeight: 1.5 }}>
              &ldquo;{p.bad}&rdquo;
            </div>
            <div style={{ fontFamily: F.serif, fontSize: 18, color: GOLD, fontWeight: 600 }}>→</div>
            <div style={{ fontFamily: F.sans, fontSize: 13, color: INK, lineHeight: 1.5 }}>
              &ldquo;{p.good}&rdquo;
            </div>
          </div>
        ))
      )}

      {!q && (
        <div style={{ background: BURG, borderRadius: 10, padding: "18px 24px", display: "flex", gap: 14, alignItems: "center", marginTop: 8 }}>
          <span style={{ fontSize: 22 }}>✍️</span>
          <div>
            <div style={{ fontFamily: F.sans, fontSize: 10, fontWeight: 700, color: GOLD, textTransform: "uppercase", letterSpacing: 2.5, marginBottom: 4 }}>Close every response with</div>
            <div style={{ fontFamily: F.serif, fontSize: 16, fontWeight: 600, color: CREAM }}>With care, [Your name] — LUMÉ CX</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Non-Negotiables subpanel ────────────────────────────────────────

function PlaybookNonNegNew({ query }) {
  const q = (query || "").trim().toLowerCase();
  const filtered = q
    ? NON_NEGOTIABLES.filter((n) =>
        n.title.toLowerCase().includes(q) ||
        n.detail.toLowerCase().includes(q)
      )
    : NON_NEGOTIABLES;

  return (
    <div>
      <div style={{ fontFamily: F.sans, fontSize: 13, color: INK, opacity: 0.7, marginBottom: 18, lineHeight: 1.55 }}>
        Hard rules. Customer pressure doesn't change them — when in doubt, flag rather than flex.
      </div>
      {filtered.length === 0 ? (
        <div style={{ fontFamily: F.sans, fontSize: 13, color: INK, opacity: 0.6, padding: 24, textAlign: "center" }}>
          No rules match.
        </div>
      ) : (
        filtered.map((n, i) => (
          <div key={n.title + i} style={{
            background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 8,
            padding: "16px 20px", marginBottom: 10,
          }}>
            <div style={{ fontFamily: F.serif, fontSize: 16, color: BURG, fontWeight: 600, marginBottom: 6 }}>
              {n.title}
            </div>
            <div style={{ fontFamily: F.sans, fontSize: 13, color: INK, lineHeight: 1.6 }}>
              {renderPlaybookMarkdown(n.detail)}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TEAM TAB — Admin / Owner only
// User management UI: list, invite, change role, remove access.
// All actions flow through /api/admin/users/* + /api/admin/invitations/*
// which in turn call Clerk's backend API server-side.
// ═══════════════════════════════════════════════════════════════════════════

function TeamTab({ role }) {
  const [users, setUsers] = useState([]);
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showInvite, setShowInvite] = useState(false);
  const [busyUserId, setBusyUserId] = useState(null);
  const [busyInviteId, setBusyInviteId] = useState(null);
  const isOwner = role === "Owner";

  async function loadTeam() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/users");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setUsers(json.users || []);
      setPending(json.pendingInvites || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { loadTeam(); }, []);

  async function changeRole(userId, newRole) {
    setBusyUserId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      // Optimistic local update
      setUsers((cur) => cur.map((u) => (u.id === userId ? { ...u, role: newRole, effectiveRole: u.email?.toLowerCase() === "cherie.jones@prenetics.com" ? "Owner" : newRole } : u)));
    } catch (e) {
      alert(e.message);
    } finally {
      setBusyUserId(null);
    }
  }

  async function removeUser(userId, email) {
    if (!confirm(`Remove ${email}? They will lose access immediately and will need a new invitation to come back.`)) return;
    setBusyUserId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setUsers((cur) => cur.filter((u) => u.id !== userId));
    } catch (e) {
      alert(e.message);
    } finally {
      setBusyUserId(null);
    }
  }

  async function revokeInvite(inviteId, email) {
    if (!confirm(`Revoke pending invite for ${email}? The magic link in their email will stop working.`)) return;
    setBusyInviteId(inviteId);
    try {
      const res = await fetch(`/api/admin/invitations/${inviteId}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setPending((cur) => cur.filter((i) => i.id !== inviteId));
    } catch (e) {
      alert(e.message);
    } finally {
      setBusyInviteId(null);
    }
  }

  // Warn if any non-Owner user has no explicit role set. Once the team
  // flips TESTING_OPEN_ACCESS off in lib/auth.js, those users will drop
  // to "New Starter" and lose access.
  const unassignedCount = users.filter((u) => !u.role && u.effectiveRole !== "Owner").length;

  // Permission helpers (UI gating — backend re-enforces all of these)
  function canEditRow(u) {
    if (u.effectiveRole === "Owner") return false; // Owner is locked
    if (!isOwner && u.role === "Admin") return false; // Admins can't touch other Admins
    return true;
  }
  function rolesAvailableFor(u) {
    return TEAM_ROLES.filter((r) => {
      if (r === "Owner") return false;
      if (r === "Admin" && !isOwner) return false;
      return true;
    });
  }
  function fmtLastSeen(iso) {
    if (!iso) return "never";
    const t = typeof iso === "number" ? iso : new Date(iso).getTime();
    if (!Number.isFinite(t)) return "—";
    const days = Math.floor((Date.now() - t) / (24 * 60 * 60 * 1000));
    if (days === 0) return "today";
    if (days === 1) return "yesterday";
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    return `${Math.floor(days / 30)}mo ago`;
  }

  const eyebrowS = { fontFamily: F.sans, fontSize: 10, color: GOLD, textTransform: "uppercase", letterSpacing: 4, fontWeight: 600, marginBottom: 14 };
  const cardS = { background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 12, padding: "16px 20px", marginBottom: 10 };

  return (
    <div style={{ background: CREAM, minHeight: "100vh" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "56px 24px 96px" }}>
        <div style={eyebrowS}>LUMÉ CX — Team Management</div>
        <div style={{ fontFamily: F.serif, fontSize: 48, color: BURG, fontWeight: 600, lineHeight: 1.05, marginBottom: 14, letterSpacing: -1 }}>
          Team
        </div>
        <div style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 16, color: INK, opacity: 0.6, marginBottom: 22, maxWidth: 700 }}>
          Invite people. Assign roles. Manage access. {isOwner ? "You're the Owner — you can do anything here." : "You're an Admin — you can manage everyone except other Admins and the Owner."}
        </div>

        {/* Safety banner — unassigned roles */}
        {unassignedCount > 0 && (
          <div style={{ background: "#FFF4DC", border: "1px solid " + GOLD, borderLeft: "3px solid " + GOLD, borderRadius: 8, padding: "14px 18px", marginBottom: 20, fontFamily: F.sans, fontSize: 13, lineHeight: 1.6, color: INK }}>
            <strong style={{ color: BURG }}>⚠ {unassignedCount} {unassignedCount === 1 ? "user has" : "users have"} no role assigned.</strong>{" "}
            They currently have access via TESTING_OPEN_ACCESS in <code>lib/auth.js</code>. Once that flag is flipped off, they'll lose access. Assign their roles below first.
          </div>
        )}

        {/* Top bar — invite + refresh */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <div style={{ fontFamily: F.sans, fontSize: 11, color: BURG, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>
            {loading ? "Loading…" : `${users.length} user${users.length === 1 ? "" : "s"}`}
            {pending.length > 0 && ` · ${pending.length} pending invite${pending.length === 1 ? "" : "s"}`}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={loadTeam} disabled={loading} style={{ background: "transparent", color: BURG, border: "1px solid " + BURG, fontFamily: F.sans, fontSize: 11, fontWeight: 600, padding: "8px 16px", letterSpacing: 1.5, textTransform: "uppercase", cursor: loading ? "wait" : "pointer", borderRadius: 99, opacity: loading ? 0.5 : 1 }}>
              Refresh
            </button>
            <button onClick={() => setShowInvite(true)} style={{ background: BURG, color: CREAM, border: "1px solid " + BURG, fontFamily: F.sans, fontSize: 11, fontWeight: 700, padding: "8px 18px", letterSpacing: 1.5, textTransform: "uppercase", cursor: "pointer", borderRadius: 99 }}>
              + Invite user
            </button>
          </div>
        </div>

        {error && (
          <div style={{ background: "#fee", border: "1px solid " + RED, color: RED, padding: 12, borderRadius: 8, marginBottom: 16, fontFamily: F.sans, fontSize: 13 }}>
            {error}
          </div>
        )}

        {/* USERS LIST */}
        {!loading && users.length === 0 && !error && (
          <div style={{ ...cardS, fontFamily: F.serif, fontStyle: "italic", textAlign: "center", color: INK, opacity: 0.6, padding: "40px 20px" }}>
            No team members yet. Click "Invite user" to get started.
          </div>
        )}

        {users.map((u) => {
          const locked = !canEditRow(u);
          const rowBusy = busyUserId === u.id;
          const isYou = u.email && (typeof window !== "undefined" && u.email === window.__VIEWER_EMAIL); // best-effort flag; backend enforces
          return (
            <div key={u.id} style={{ ...cardS, opacity: rowBusy ? 0.5 : 1 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto auto auto", gap: 14, alignItems: "center" }}>
                <div>
                  <div style={{ fontFamily: F.serif, fontSize: 15, color: BURG, fontWeight: 600 }}>
                    {[u.firstName, u.lastName].filter(Boolean).join(" ") || "(no name set)"}
                    {u.effectiveRole === "Owner" && <span style={{ fontFamily: F.sans, fontSize: 9, fontWeight: 700, color: GOLD, letterSpacing: 1.5, marginLeft: 8, padding: "2px 8px", border: "1px solid " + GOLD, borderRadius: 99 }}>OWNER</span>}
                  </div>
                  <div style={{ fontFamily: F.sans, fontSize: 12, color: INK, opacity: 0.6 }}>{u.email || "(no email)"}</div>
                </div>
                <div style={{ fontFamily: F.sans, fontSize: 11, color: INK, opacity: 0.55, letterSpacing: 0.5 }}>
                  Last seen: {fmtLastSeen(u.lastSignInAt)}
                </div>
                <div>
                  {u.effectiveRole === "Owner" ? (
                    <span style={{ fontFamily: F.sans, fontSize: 12, fontWeight: 600, color: BURG, padding: "6px 14px" }}>
                      Owner
                    </span>
                  ) : (
                    <select
                      value={u.role || ""}
                      onChange={(e) => changeRole(u.id, e.target.value)}
                      disabled={locked || rowBusy}
                      style={{
                        background: locked ? CREAM : W,
                        border: "1px solid " + SOFT_BORDER,
                        borderRadius: 8,
                        padding: "6px 12px",
                        fontFamily: F.sans,
                        fontSize: 12,
                        color: INK,
                        cursor: locked ? "not-allowed" : "pointer",
                        minWidth: 130,
                      }}
                    >
                      {!u.role && <option value="">— (no role set)</option>}
                      {rolesAvailableFor(u).map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  )}
                </div>
                <div>
                  {u.effectiveRole === "Owner" ? null : (
                    <button
                      onClick={() => removeUser(u.id, u.email)}
                      disabled={locked || rowBusy}
                      title={locked ? "Only Owner can remove this user" : "Remove access"}
                      style={{
                        background: "transparent",
                        border: "1px solid " + SOFT_BORDER,
                        color: locked ? INK : RED,
                        opacity: locked ? 0.3 : 0.8,
                        fontFamily: F.sans,
                        fontSize: 11,
                        fontWeight: 600,
                        padding: "6px 12px",
                        borderRadius: 99,
                        cursor: locked ? "not-allowed" : "pointer",
                        letterSpacing: 1,
                        textTransform: "uppercase",
                      }}
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div></div>
              </div>
            </div>
          );
        })}

        {/* PENDING INVITES */}
        {pending.length > 0 && (
          <>
            <div style={{ fontFamily: F.sans, fontSize: 11, color: BURG, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", marginTop: 36, marginBottom: 12 }}>
              Pending invites
            </div>
            {pending.map((inv) => (
              <div key={inv.id} style={{ ...cardS, background: "#FBF7F2", display: "flex", justifyContent: "space-between", alignItems: "center", opacity: busyInviteId === inv.id ? 0.5 : 1 }}>
                <div>
                  <div style={{ fontFamily: F.serif, fontSize: 14, color: BURG, fontWeight: 600 }}>{inv.email}</div>
                  <div style={{ fontFamily: F.sans, fontSize: 11, color: INK, opacity: 0.6, marginTop: 2 }}>
                    Invited as <strong style={{ color: BURG }}>{inv.role || "(no role set)"}</strong>
                    {inv.createdAt && " · " + fmtLastSeen(inv.createdAt)}
                  </div>
                </div>
                <button
                  onClick={() => revokeInvite(inv.id, inv.email)}
                  disabled={busyInviteId === inv.id}
                  style={{ background: "transparent", border: "1px solid " + SOFT_BORDER, color: RED, opacity: 0.85, fontFamily: F.sans, fontSize: 11, fontWeight: 600, padding: "6px 14px", borderRadius: 99, cursor: "pointer", letterSpacing: 1, textTransform: "uppercase" }}
                >
                  Revoke
                </button>
              </div>
            ))}
          </>
        )}
      </div>

      {showInvite && (
        <InviteUserModal
          viewerIsOwner={isOwner}
          onClose={() => setShowInvite(false)}
          onInvited={() => { setShowInvite(false); loadTeam(); }}
        />
      )}
    </div>
  );
}

function InviteUserModal({ viewerIsOwner, onClose, onInvited }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("Agent");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const availableRoles = TEAM_ROLES.filter((r) => {
    if (r === "Owner") return false;
    if (r === "Admin" && !viewerIsOwner) return false;
    return true;
  });

  async function submit() {
    setError(null);
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError("Enter a valid email address");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed, role }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      onInvited();
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: W, borderRadius: 12, padding: "28px 32px", width: "100%", maxWidth: 460, boxShadow: "0 16px 48px rgba(0,0,0,0.2)" }}>
        <div style={{ fontFamily: F.serif, fontSize: 24, color: BURG, fontWeight: 600, marginBottom: 6 }}>Invite a user</div>
        <div style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 13, color: INK, opacity: 0.6, marginBottom: 22 }}>
          They'll get a magic-link email to sign in and join the Hub with the role you choose.
        </div>

        <label style={{ fontFamily: F.sans, fontSize: 10, color: INK, opacity: 0.7, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", display: "block", marginBottom: 4 }}>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="newteammate@example.com"
          autoFocus
          style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid " + SOFT_BORDER, background: W, fontFamily: F.sans, fontSize: 14, color: INK, outline: "none", marginBottom: 14, boxSizing: "border-box" }}
        />

        <label style={{ fontFamily: F.sans, fontSize: 10, color: INK, opacity: 0.7, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", display: "block", marginBottom: 4 }}>Role</label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1px solid " + SOFT_BORDER, background: W, fontFamily: F.sans, fontSize: 14, color: INK, outline: "none", marginBottom: 20, boxSizing: "border-box" }}
        >
          {availableRoles.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>

        {error && (
          <div style={{ background: "#fee", border: "1px solid " + RED, color: RED, padding: 10, borderRadius: 6, marginBottom: 14, fontFamily: F.sans, fontSize: 12 }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onClose} disabled={submitting} style={{ background: "transparent", color: INK, border: "1px solid " + SOFT_BORDER, fontFamily: F.sans, fontSize: 11, fontWeight: 600, padding: "10px 22px", letterSpacing: 1.5, textTransform: "uppercase", cursor: submitting ? "wait" : "pointer", borderRadius: 99 }}>
            Cancel
          </button>
          <button onClick={submit} disabled={submitting} style={{ background: BURG, color: CREAM, border: "1px solid " + BURG, fontFamily: F.sans, fontSize: 11, fontWeight: 700, padding: "10px 22px", letterSpacing: 1.5, textTransform: "uppercase", cursor: submitting ? "wait" : "pointer", borderRadius: 99, opacity: submitting ? 0.7 : 1 }}>
            {submitting ? "Sending..." : "Send invite"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// LEGACY PLAYBOOK SUBCOMPONENTS — orphaned, no longer referenced
// Kept in the file so Macros (a real DB-backed feature) can be revived
// later without re-implementing. Safe to remove if/when we commit to
// fully retiring Macros.
// ═══════════════════════════════════════════════════════════════════════════

function PlaybookMacros({ role }) {
  const [macros, setMacros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState({});
  const [seedStatus, setSeedStatus] = useState(null);

  const isManagerPlus = role && ["Manager", "Admin", "Owner"].includes(role);

  async function loadMacros() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (category && category !== "All") params.set("category", category);
      if (query.trim()) params.set("q", query.trim());
      const res = await fetch(`/api/kb/macros?${params}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setMacros(json.macros || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadMacros(); }, [category]);

  const onSearchSubmit = (e) => { e.preventDefault(); loadMacros(); };

  async function runSeed() {
    if (!confirm("Seed all macros from the markdown source? This will upsert ~209 records.")) return;
    setSeedStatus("running");
    try {
      const res = await fetch(`/api/admin/kb/seed`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setSeedStatus(`✓ ${json.upserted} macros seeded`);
      loadMacros();
    } catch (e) {
      setSeedStatus(`✗ ${e.message}`);
    }
  }

  function copyBody(macro) {
    navigator.clipboard.writeText(macro.body);
    setExpanded((p) => ({ ...p, [macro.id]: { ...(p[macro.id] || {}), copied: true } }));
    setTimeout(() => {
      setExpanded((p) => ({ ...p, [macro.id]: { ...(p[macro.id] || {}), copied: false } }));
    }, 1500);
  }

  function toggleExpanded(id) {
    setExpanded((p) => ({ ...p, [id]: { ...(p[id] || {}), open: !(p[id]?.open) } }));
  }

  return (
    <div>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 24px 96px" }}>
        <div style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 17, color: INK, opacity: 0.65, maxWidth: 640, lineHeight: 1.4, marginBottom: 28 }}>
          Search by question, tag or content. Click any macro to expand and copy.
        </div>

        {/* Search + admin controls */}
        <form onSubmit={onSearchSubmit} style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 24, flexWrap: "wrap" }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search macros…"
            style={{ flex: 1, minWidth: 240, padding: "12px 18px", borderRadius: 99, border: "1px solid " + SOFT_BORDER, background: W, fontFamily: F.sans, fontSize: 14, color: INK, outline: "none" }}
          />
          <button type="submit" style={{ background: BURG, border: "1px solid " + BURG, color: CREAM, fontFamily: F.sans, fontSize: 12, fontWeight: 700, padding: "12px 22px", letterSpacing: 2, textTransform: "uppercase", cursor: "pointer", borderRadius: 99 }}>
            Search
          </button>
          {isManagerPlus && (
            <button type="button" onClick={runSeed} disabled={seedStatus === "running"} style={{ background: "transparent", border: "1px solid " + SOFT_BORDER, color: BURG, fontFamily: F.sans, fontSize: 11, fontWeight: 700, padding: "12px 18px", letterSpacing: 2, textTransform: "uppercase", cursor: "pointer", borderRadius: 99 }}>
              {seedStatus === "running" ? "Re-seeding…" : "Re-seed from source"}
            </button>
          )}
        </form>
        {seedStatus && seedStatus !== "running" && (
          <div style={{ fontFamily: F.sans, fontSize: 12, color: seedStatus.startsWith("✓") ? "#3F8A3F" : RED, marginBottom: 16 }}>{seedStatus}</div>
        )}

        {/* Category pills */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 32 }}>
          {KB_CATEGORIES.map((c) => {
            const active = c === category;
            return (
              <button key={c} onClick={() => setCategory(c)} style={{
                background: active ? BURG : "transparent",
                color: active ? CREAM : BURG,
                border: "1px solid " + (active ? BURG : SOFT_BORDER),
                fontFamily: F.sans, fontSize: 11, fontWeight: 700, padding: "10px 18px",
                letterSpacing: 2, textTransform: "uppercase", cursor: "pointer", borderRadius: 99,
                transition: "all 0.15s",
              }}>
                {c}
              </button>
            );
          })}
        </div>

        {/* Loading / error / empty */}
        {loading && (
          <div style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 16, color: INK, opacity: 0.5 }}>Loading macros…</div>
        )}
        {error && (
          <div style={{ background: "#fee", border: "1px solid " + RED, color: RED, padding: 12, borderRadius: 12, fontFamily: F.sans, fontSize: 13, marginBottom: 16 }}>
            {error}
          </div>
        )}
        {!loading && !error && macros.length === 0 && (
          <div style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 16, color: INK, opacity: 0.5 }}>
            No macros match{query ? ` "${query}"` : category !== "All" ? ` in ${category}` : ""}. Try a different search or category.
          </div>
        )}

        {/* Macro list */}
        {!loading && !error && macros.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {macros.map((m) => {
              const ex = expanded[m.id] || {};
              const open = !!ex.open;
              return (
                <div key={m.id} style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 14, overflow: "hidden" }}>
                  <button onClick={() => toggleExpanded(m.id)} style={{ width: "100%", textAlign: "left", padding: "20px 24px", background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" }}>
                        <span style={{ fontFamily: F.sans, fontSize: 9, color: GOLD, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", border: "1px solid " + GOLD, padding: "3px 8px", borderRadius: 99 }}>{m.category}</span>
                        {m.escalationRule && (
                          <span style={{ fontFamily: F.sans, fontSize: 9, color: RED, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", border: "1px solid " + RED, padding: "3px 8px", borderRadius: 99 }}>
                            Escalate · {m.escalationRule.replace(/_/g, " ")}
                          </span>
                        )}
                      </div>
                      <div style={{ fontFamily: F.serif, fontSize: 17, color: BURG, fontWeight: 600, lineHeight: 1.3 }}>{m.question}</div>
                      <div style={{ fontFamily: F.sans, fontSize: 11, color: INK, opacity: 0.5, marginTop: 4, letterSpacing: 0.5 }}>LUMÉ CX: {m.slug}</div>
                    </div>
                    <span style={{ fontFamily: F.sans, fontSize: 18, color: BURG, opacity: 0.5, transform: open ? "rotate(90deg)" : "none", transition: "transform 0.15s" }}>›</span>
                  </button>
                  {open && (
                    <div style={{ padding: "0 24px 24px", borderTop: "1px solid " + SOFT_BORDER }}>
                      {m.notes && (
                        <div style={{ marginTop: 16, padding: "10px 14px", background: BLUSH, borderRadius: 8, fontFamily: F.sans, fontSize: 12, color: BURG, lineHeight: 1.5, whiteSpace: "pre-line" }}>
                          {m.notes}
                        </div>
                      )}
                      <pre style={{ margin: "16px 0 0", padding: "20px 22px", background: CREAM, border: "1px solid " + SOFT_BORDER, borderRadius: 10, fontFamily: F.sans, fontSize: 14, color: INK, lineHeight: 1.6, whiteSpace: "pre-wrap", wordWrap: "break-word" }}>{m.body}</pre>
                      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                        <button onClick={() => copyBody(m)} style={{ background: BURG, color: CREAM, border: "1px solid " + BURG, fontFamily: F.sans, fontSize: 11, fontWeight: 700, padding: "10px 18px", letterSpacing: 2, textTransform: "uppercase", cursor: "pointer", borderRadius: 99 }}>
                          {ex.copied ? "Copied ✓" : "Copy macro"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Footer count */}
        {!loading && !error && macros.length > 0 && (
          <div style={{ marginTop: 32, fontFamily: F.sans, fontSize: 11, color: INK, opacity: 0.5, letterSpacing: 0.5 }}>
            {macros.length} macro{macros.length === 1 ? "" : "s"}{category !== "All" ? ` in ${category}` : ""}{query ? ` matching "${query}"` : ""}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Playbook sub-views ported from former Handbook tab ──

function PlaybookRules() {
  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 24px 96px" }}>
      <div style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 17, color: INK, opacity: 0.65, marginBottom: 28 }}>
        Hard rules — non-negotiables across every customer interaction.
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 14, marginBottom: 24 }}>
        {NON_NEGOTIABLES.map((r, i) => {
          const accent = r.severity === "high" ? BURG : GOLD;
          return (
            <div key={i} style={{ background: W, border: "1px solid " + SOFT_BORDER, borderLeft: "3px solid " + accent, borderRadius: 14, padding: "20px 24px" }}>
              <div style={{ fontFamily: F.sans, fontSize: 9, color: accent, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", marginBottom: 10 }}>Rule {i + 1}</div>
              <div style={{ fontFamily: F.serif, fontSize: 18, color: BURG, fontWeight: 600, marginBottom: 8 }}>{r.title}</div>
              <div style={{ fontFamily: F.sans, fontSize: 13, color: INK, opacity: 0.75, lineHeight: 1.6 }}>{r.detail}</div>
            </div>
          );
        })}
      </div>
      <div style={{ background: BLUSH, border: "1px solid " + SOFT_BORDER, borderRadius: 14, padding: "18px 24px", display: "flex", gap: 14, alignItems: "center" }}>
        <div style={{ fontSize: 22 }}>✍️</div>
        <div>
          <div style={{ fontFamily: F.sans, fontSize: 10, fontWeight: 700, color: BURG, opacity: 0.7, textTransform: "uppercase", letterSpacing: 2.5, marginBottom: 4 }}>Close every response with</div>
          <div style={{ fontFamily: F.serif, fontSize: 16, fontWeight: 600, color: BURG }}>With Health, Team IM8</div>
        </div>
      </div>
    </div>
  );
}

function PlaybookVoice() {
  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 24px 96px" }}>
      <div style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 17, color: INK, opacity: 0.65, marginBottom: 28 }}>
        How the team actually talks to customers — left column out, right column in.
      </div>
      <div style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 14, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", background: SOFT_BORDER, gap: 1 }}>
          <div style={{ background: BLUSH, padding: "14px 22px", fontFamily: F.sans, fontSize: 10, color: BURG, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase" }}>Don't say</div>
          <div style={{ background: PEACH, padding: "14px 22px", fontFamily: F.sans, fontSize: 10, color: BURG, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase" }}>Say instead</div>
          {VOICE_PAIRS.flatMap((p, i) => [
            <div key={`b-${i}`} style={{ background: W, padding: "18px 22px", fontFamily: F.serif, fontStyle: "italic", fontSize: 14, color: INK, opacity: 0.7, lineHeight: 1.5 }}>"{p.bad}"</div>,
            <div key={`g-${i}`} style={{ background: W, padding: "18px 22px", fontFamily: F.serif, fontStyle: "italic", fontSize: 14, color: BURG, lineHeight: 1.5 }}>"{p.good}"</div>,
          ])}
        </div>
      </div>
    </div>
  );
}

function PlaybookProducts() {
  const [compareOpen, setCompareOpen] = useState(false);
  const [showDisc, setShowDisc] = useState(false);
  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 24px 96px" }}>
      <div style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 17, color: INK, opacity: 0.65, marginBottom: 28 }}>
        Quick product reference — current SKUs and pricing.
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 14 }}>
        {PRODUCTS.map((p, i) => (
          <div key={i} style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 16, padding: "24px 28px" }}>
            <div style={{ fontFamily: F.sans, fontSize: 10, color: GOLD, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", marginBottom: 8 }}>{p.tag}</div>
            <div style={{ fontFamily: F.serif, fontSize: 22, color: BURG, fontWeight: 600, marginBottom: 16, lineHeight: 1.2 }}>{p.name}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 16 }}>
              {p.specs.map((s, j) => (
                <div key={j} style={{ display: "flex", gap: 12 }}>
                  <div style={{ fontFamily: F.sans, fontSize: 11, fontWeight: 700, color: INK, opacity: 0.55, minWidth: 96, textTransform: "uppercase", letterSpacing: 0.5 }}>{s[0]}</div>
                  <div style={{ fontFamily: F.sans, fontSize: 12, color: INK, lineHeight: 1.5, flex: 1 }}>{s[1]}</div>
                </div>
              ))}
            </div>
            <div style={{ borderTop: "1px solid " + SOFT_BORDER, paddingTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
              {p.pricing.map((pp, k) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", fontFamily: F.sans, fontSize: 12, color: INK }}>
                  <span style={{ opacity: 0.7 }}>{pp[0]}</span>
                  <span style={{ color: BURG, fontWeight: 700 }}>{pp[1]}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 32 }}>
        <button
          onClick={() => setCompareOpen(o => !o)}
          style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "transparent", border: "1px solid " + SOFT_BORDER, borderRadius: 99, padding: "10px 20px", fontFamily: F.sans, fontSize: 11, color: BURG, fontWeight: 700, cursor: "pointer", letterSpacing: 2, textTransform: "uppercase" }}
        >
          <span>{compareOpen ? "Hide" : "Compare"} side-by-side</span>
          <span style={{ fontSize: 14 }}>{compareOpen ? "▲" : "▼"}</span>
        </button>
        {compareOpen && (
          <div style={{ marginTop: 20 }}>
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: F.sans, fontSize: 12, color: INK, opacity: 0.7, cursor: "pointer" }}>
                <input type="checkbox" checked={showDisc} onChange={(e) => setShowDisc(e.target.checked)} />
                Show discontinued
              </label>
            </div>
            <CompareMatrix showDiscontinued={showDisc} />
          </div>
        )}
      </div>
    </div>
  );
}

function PlaybookShipping() {
  const [query, setQuery] = useState("");
  const filtered = SHIPPING_ROWS.filter((r) =>
    !query.trim() || r.region.toLowerCase().includes(query.trim().toLowerCase())
  );
  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 24px 96px" }}>
      <div style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 17, color: INK, opacity: 0.65, marginBottom: 8 }}>
        Average lead times in calendar days, from internal CS data. Set expectations early.
      </div>
      <div style={{ fontFamily: F.sans, fontSize: 12, color: INK, opacity: 0.5, marginBottom: 24, letterSpacing: 0.3 }}>
        Source: CS Master SOP — Shipping Times External
      </div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search country…"
        style={{ width: "100%", padding: "12px 18px", borderRadius: 99, border: "1px solid " + SOFT_BORDER, background: W, fontFamily: F.sans, fontSize: 14, color: INK, outline: "none", marginBottom: 16, boxSizing: "border-box" }}
      />
      <div style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 14, overflow: "hidden" }}>
        {filtered.map((r, i) => (
          <div key={r.region} style={{ display: "grid", gridTemplateColumns: "minmax(180px, 240px) minmax(90px, 120px) 1fr", gap: 16, padding: "14px 22px", alignItems: "center", borderBottom: i < filtered.length - 1 ? "1px solid " + SOFT_BORDER : "none" }}>
            <div style={{ fontFamily: F.serif, fontSize: 15, color: BURG, fontWeight: 600 }}>{r.region}</div>
            <div style={{ fontFamily: F.sans, fontSize: 13, color: INK, fontWeight: 500 }}>{r.sla}</div>
            <div style={{ fontFamily: F.sans, fontSize: 12, color: INK, opacity: 0.65, fontStyle: "italic" }}>{r.note || ""}</div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div style={{ padding: "20px 22px", fontFamily: F.serif, fontStyle: "italic", fontSize: 14, color: INK, opacity: 0.5 }}>
            No country matches "{query}".
          </div>
        )}
      </div>
      <div style={{ marginTop: 16, fontFamily: F.sans, fontSize: 11, color: INK, opacity: 0.5, letterSpacing: 0.5 }}>
        {filtered.length} {filtered.length === 1 ? "region" : "regions"}{query ? ` matching "${query}"` : ""}
      </div>
    </div>
  );
}

function PlaybookEscalation() {
  const tierColor = (sev) => sev === "high" ? RED : sev === "med" ? GOLD : "#3F8A3F";
  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 24px 96px" }}>
      <div style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 17, color: INK, opacity: 0.65, marginBottom: 28 }}>
        Three tiers. Know which one a ticket falls into before you draft.
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {ESCALATION.map((e, i) => {
          const c = tierColor(e.severity);
          return (
            <div key={i} style={{ background: W, border: "1px solid " + SOFT_BORDER, borderLeft: "3px solid " + c, borderRadius: 14, padding: "24px 28px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14, flexWrap: "wrap" }}>
                <span style={{ fontFamily: F.sans, fontSize: 11, fontWeight: 800, color: c, letterSpacing: 3, textTransform: "uppercase", border: "1px solid " + c, padding: "4px 12px", borderRadius: 99 }}>{e.tier}</span>
                <span style={{ fontFamily: F.serif, fontSize: 18, color: BURG, fontWeight: 600 }}>{e.label}</span>
              </div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontFamily: F.sans, fontSize: 10, fontWeight: 700, color: INK, opacity: 0.5, textTransform: "uppercase", letterSpacing: 2.5, marginBottom: 8 }}>Triggers</div>
                <ul style={{ margin: 0, paddingLeft: 20, fontFamily: F.sans, fontSize: 13, color: INK, opacity: 0.8, lineHeight: 1.7 }}>
                  {e.triggers.map((t, j) => <li key={j}>{t}</li>)}
                </ul>
              </div>
              <div>
                <div style={{ fontFamily: F.sans, fontSize: 10, fontWeight: 700, color: INK, opacity: 0.5, textTransform: "uppercase", letterSpacing: 2.5, marginBottom: 8 }}>Action</div>
                <div style={{ fontFamily: F.sans, fontSize: 13, color: INK, lineHeight: 1.6 }}>{e.action}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BrightTile({ label, value, hint, accent }) {
  return (
    <div style={{
      background: accent ? BLUSH : W,
      border: "1px solid " + (accent ? "#F0D5D0" : SOFT_BORDER),
      borderRadius: 14,
      padding: "20px 22px",
      minHeight: 96,
    }}>
      <div style={{ fontFamily: F.sans, fontSize: 11, color: BURG, opacity: 0.6, textTransform: "uppercase", letterSpacing: 1.5, fontWeight: 600, marginBottom: 10 }}>
        {label}
      </div>
      <div style={{ fontFamily: F.serif, fontSize: 32, color: BURG, fontWeight: 700, lineHeight: 1.1 }}>
        {value}
      </div>
      {hint && (
        <div style={{ fontFamily: F.sans, fontSize: 11, color: INK, opacity: 0.55, marginTop: 6 }}>
          {hint}
        </div>
      )}
    </div>
  );
}

// ─── QUIZ TAB ─────────────────────────────────────────────────────────────────
function QuizTab({ selMod, setSelMod, qIdx, chosen, answers, sessionScores, completed, startMod, pickAnswer, nextQ, finishMod }) {
  if (selMod === null) {
    return (
      <div style={{ maxWidth: 540, margin: "0 auto", padding: "24px 16px" }}>
        <div style={{ fontFamily: F.sans, fontSize: 11, color: "#999", textTransform: "uppercase", letterSpacing: 2, marginBottom: 20, textAlign: "center" }}>All Modules</div>
        {MODULES.map((mod, idx) => {
          const score = sessionScores[mod.id];
          const done  = completed.includes(mod.id);
          const pct   = score !== undefined ? Math.round((score / mod.questions.length) * 100) : null;
          return (
            <div key={mod.id} onClick={() => startMod(idx)} style={{ background: W, border: "1px solid #e0d9d0", borderRadius: 10, padding: "16px 20px", marginBottom: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: F.sans, fontSize: 10, color: "#aaa", textTransform: "uppercase", letterSpacing: 1, marginBottom: 3 }}>{mod.tag}</div>
                <div style={{ fontFamily: F.serif, fontSize: 16, fontWeight: 600, color: BURG }}>{mod.title}</div>
                <div style={{ display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap" }}>
                  {mod.critical && (
                    <span style={{ background: RED, color: W, fontFamily: F.sans, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 3, textTransform: "uppercase", letterSpacing: 1 }}>Critical</span>
                  )}
                  {done && pct !== null && (
                    <span style={{ fontFamily: F.sans, fontSize: 11, color: pct >= 80 ? "#2a7a2a" : RED, fontWeight: 600 }}>{score}/{mod.questions.length} ({pct}%)</span>
                  )}
                </div>
              </div>
              <div style={{ fontSize: 20, color: done ? "#2a7a2a" : "#ccc", fontWeight: 700 }}>{done ? "✓" : "›"}</div>
            </div>
          );
        })}
      </div>
    );
  }

  const mod   = MODULES[selMod];
  const q     = mod.questions[qIdx];
  const total = mod.questions.length;
  const pct   = Math.round(((qIdx) / total) * 100);
  const isLast = qIdx === total - 1;
  const correctSoFar = answers.filter(a => a.chosen === a.correct).length;

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", paddingBottom: 40 }}>
      {/* Quiz header */}
      <div style={{ background: W, padding: "16px 20px", borderBottom: "1px solid #e0d9d0", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={() => setSelMod(null)} style={{ background: "transparent", border: "none", color: RED, fontFamily: F.sans, fontSize: 24, cursor: "pointer", lineHeight: 1, padding: 0 }}>{"←"}</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: F.sans, fontSize: 12, color: "#999" }}>{mod.tag}</div>
          <div style={{ fontFamily: F.serif, fontSize: 15, fontWeight: 600, color: BURG }}>{mod.title}</div>
        </div>
        <div style={{ fontFamily: F.serif, fontSize: 18, fontWeight: 700, color: GOLD }}>{correctSoFar}/{qIdx}</div>
      </div>

      {mod.critical && (
        <div style={{ background: RED, padding: "8px 20px", display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 14, color: W }}>!</span>
          <span style={{ fontFamily: F.sans, fontSize: 12, color: W, fontWeight: 600 }}>CRITICAL MODULE - These rules have zero tolerance for errors</span>
        </div>
      )}

      <div style={{ background: "#e0d9d0", height: 4 }}>
        <div style={{ background: RED, width: pct + "%", height: "100%", transition: "width 0.3s" }} />
      </div>

      <div style={{ padding: "24px 20px" }}>
        <div style={{ fontFamily: F.sans, fontSize: 11, color: "#aaa", marginBottom: 12 }}>{"Question " + (qIdx + 1) + " of " + total}</div>
        <div style={{ fontFamily: F.serif, fontSize: 19, fontWeight: 600, color: BURG, lineHeight: 1.5, marginBottom: 24 }}>{q.q}</div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {q.options.map((opt, i) => {
            let bg = W, border = "1px solid #ddd", color = BURG;
            if (chosen !== null) {
              if (i === q.correct)   { bg = "#e8f5e8"; border = "2px solid #2a7a2a"; color = "#1a5a1a"; }
              else if (i === chosen) { bg = "#fde8e8"; border = "2px solid " + RED;  color = RED; }
            }
            return (
              <button key={i} onClick={() => pickAnswer(i)} style={{ background: bg, border, color, fontFamily: F.sans, fontSize: 14, padding: "14px 16px", borderRadius: 8, textAlign: "left", cursor: chosen !== null ? "default" : "pointer", lineHeight: 1.4 }}>
                <span style={{ fontWeight: 700, marginRight: 8 }}>{String.fromCharCode(65 + i) + "."}</span>
                {opt}
              </button>
            );
          })}
        </div>

        {chosen !== null && (
          <div style={{ background: chosen === q.correct ? "#e8f5e8" : "#fff8e8", border: "1px solid " + (chosen === q.correct ? "#2a7a2a" : GOLD), borderRadius: 8, padding: 16, marginTop: 20 }}>
            <div style={{ fontFamily: F.sans, fontSize: 12, fontWeight: 700, color: chosen === q.correct ? "#2a7a2a" : GOLD, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
              {chosen === q.correct ? "Correct!" : "Not quite"}
            </div>
            <div style={{ fontFamily: F.sans, fontSize: 13, color: "#444", lineHeight: 1.6 }}>{q.exp}</div>
            <button onClick={nextQ} style={{ background: BURG, color: W, fontFamily: F.sans, fontWeight: 700, fontSize: 13, padding: "10px 24px", border: "none", borderRadius: 6, cursor: "pointer", marginTop: 14 }}>
              {isLast ? "Finish Module" : "Next Question"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── ASK IM8 TAB ─────────────────────────────────────────────────────────────

// Minimal markdown renderer for the Ask IM8 chat. Handles **bold**,
// *italic*, `code`, numbered lists (1. text), and bullet lists (- text).
// Zero dependencies — purpose-built for the bot's typical output shape.
function renderChatMarkdown(text) {
  if (!text) return null;
  const lines = String(text).split("\n");
  const blocks = [];
  let listBuf = null; // { type: 'ol' | 'ul', items: [string] }

  const flushList = () => {
    if (listBuf) blocks.push(listBuf);
    listBuf = null;
  };

  for (const raw of lines) {
    const line = raw.replace(/\s+$/, "");
    const num = line.match(/^\s*(\d+)\.\s+(.+)$/);
    const bullet = line.match(/^\s*[-*]\s+(.+)$/);

    if (num) {
      if (!listBuf || listBuf.type !== "ol") { flushList(); listBuf = { type: "ol", items: [] }; }
      listBuf.items.push(num[2]);
      continue;
    }
    if (bullet) {
      if (!listBuf || listBuf.type !== "ul") { flushList(); listBuf = { type: "ul", items: [] }; }
      listBuf.items.push(bullet[1]);
      continue;
    }

    // Non-list line — flush any list, then push paragraph (or blank line spacer)
    flushList();
    if (line.trim() === "") blocks.push({ type: "br" });
    else blocks.push({ type: "p", text: line });
  }
  flushList();

  // Inline formatting — bold / italic / code. Order: bold before italic so
  // "**foo**" doesn't get eaten as two italics.
  const renderInline = (s) => {
    const parts = [];
    const re = /(\*\*([^*\n]+)\*\*)|(\*([^*\n]+)\*)|(`([^`\n]+)`)/g;
    let i = 0, m, key = 0;
    while ((m = re.exec(s)) !== null) {
      if (m.index > i) parts.push(s.slice(i, m.index));
      if (m[1]) parts.push(<strong key={`b${key++}`} style={{ fontWeight: 700, color: BURG }}>{m[2]}</strong>);
      else if (m[3]) parts.push(<em key={`i${key++}`}>{m[4]}</em>);
      else if (m[5]) parts.push(
        <code key={`c${key++}`} style={{ background: "#f4eee5", padding: "1px 6px", borderRadius: 4, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: "0.92em" }}>{m[6]}</code>
      );
      i = re.lastIndex;
    }
    if (i < s.length) parts.push(s.slice(i));
    return parts;
  };

  return blocks.map((b, idx) => {
    if (b.type === "br") return <div key={idx} style={{ height: 6 }} />;
    if (b.type === "ol") return (
      <ol key={idx} style={{ margin: "4px 0 8px", paddingLeft: 22, lineHeight: 1.55 }}>
        {b.items.map((it, j) => <li key={j} style={{ marginBottom: 4 }}>{renderInline(it)}</li>)}
      </ol>
    );
    if (b.type === "ul") return (
      <ul key={idx} style={{ margin: "4px 0 8px", paddingLeft: 22, lineHeight: 1.55 }}>
        {b.items.map((it, j) => <li key={j} style={{ marginBottom: 4 }}>{renderInline(it)}</li>)}
      </ul>
    );
    return <div key={idx} style={{ marginBottom: 6 }}>{renderInline(b.text)}</div>;
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// AFFILIATES TAB — May 2026
// CS team's reference for handling affiliate program emails. Static playbook
// sourced from lib/affiliates-data.js (autogenerated from Kendra's macros
// .xlsx). Sub-tabs: Triage (decision tree + status panel), Macros (full
// reply library, searchable, copy-to-clipboard), Program (program overview),
// Links (knowledge base).
//
// Visible to Agent and above (gated in the TABS filter, around line 2039).
// ═══════════════════════════════════════════════════════════════════════════

// "Stats" sub-tab is Manager+ only — filtered into AFFILIATES_SUBTABS
// at render time based on role. Agents never see the chip.
const AFFILIATES_SUBTABS_BASE = ["Start Here", "Macros", "Program", "Links"];

const AFFILIATES_SUBTITLE = {
  // Start Here intentionally has no subtitle — the panel below explains
  // itself (paste box + inline search) and Cherie wanted the top trim.
  "Start Here": "",
  Macros: "Pre-written replies. Copy, personalise [Name] and [bracketed] placeholders, then send.",
  Program: "How the program works. Read once so you know what we can and can't commit to.",
  Links: "Every URL you might need. Internal first, then affiliate-facing.",
  Stats: "Which macros are getting copied most. The 'Not in Gorgias yet' list is your priority for what to add to Gorgias next.",
};

// Small persistent status panel rendered at the top of every Affiliates
// sub-tab. Kept short — Cherie's call: "where to look for what" is the
// most useful baseline orientation.
function AffiliatesStatusPanel() {
  const Row = ({ label, dest }) => (
    <div style={{ display: "flex", gap: 10, padding: "4px 0", fontFamily: F.sans, fontSize: 13, color: INK, lineHeight: 1.5 }}>
      <span style={{ flex: 1, opacity: 0.8 }}>{label}</span>
      <span style={{ color: BURG, fontWeight: 700 }}>→ {dest}</span>
    </div>
  );
  return (
    <div style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 10, padding: "14px 18px", marginBottom: 18 }}>
      <div style={{ fontFamily: F.sans, fontSize: 10, color: BURG, letterSpacing: 2, textTransform: "uppercase", fontWeight: 700, marginBottom: 8 }}>
        Before any affiliate email — where to look for what
      </div>
      <Row label="Affiliate account, balance, link, code" dest={<>Social Snowball admin <span style={{ opacity: 0.55, fontWeight: 500 }}>(Tune for pre-May)</span></>} />
      <Row label="Activation, Discord posts, Strava" dest="Discord" />
      <Row label="Orders, sales history" dest="Shopify" />
    </div>
  );
}

// Copy-to-clipboard button. Reusable for any block of text. Shows brief
// "Copied" affirmation on success.
//
// When `macroName` is provided, also fires a fire-and-forget POST to
// /api/affiliates/copy so Cherie can track which macros are getting
// copied most (and therefore which "not in Gorgias yet" macros to add
// to Gorgias next). The fetch is intentionally NOT awaited — never
// block the user's clipboard interaction on a logging round-trip.
function CopyButton({ text, label = "Copy macro", macroName, copyType, inGorgias }) {
  const [copied, setCopied] = useState(false);
  const doCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
      if (macroName) {
        // Fire-and-forget — silent on failure
        fetch("/api/affiliates/copy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            macroName,
            copyType: copyType || "unknown",
            inGorgias: !!inGorgias,
          }),
        }).catch(() => {});
      }
    } catch {
      // Older browsers / non-secure context — silently no-op rather than crash.
    }
  };
  return (
    <button
      onClick={doCopy}
      style={{
        background: copied ? GOLD : BURG,
        color: CREAM,
        border: "none",
        fontFamily: F.sans, fontSize: 10, fontWeight: 700,
        padding: "6px 12px", letterSpacing: 1.5, textTransform: "uppercase",
        borderRadius: 99, cursor: "pointer", transition: "background 0.15s",
        whiteSpace: "nowrap",
      }}
    >{copied ? "Copied ✓" : label}</button>
  );
}

function AffiliatesTab({ role }) {
  // Manager+ required (Cherie May 22 — bumped from Lead Agent+ while the
  // workstream is being re-scoped with a dedicated owner). Mirrors the
  // tab-visibility gate in App() so hash-based deep links don't sneak
  // Lead Agents or below in.
  const canView = role && ["Manager", "Admin", "Owner"].includes(role);
  const [sub, setSub] = useState("Start Here");
  const [query, setQuery] = useState("");
  const eyebrowS = { fontFamily: F.sans, fontSize: 10, color: GOLD, textTransform: "uppercase", letterSpacing: 4, fontWeight: 600, marginBottom: 14 };
  // Stats sub-tab visible to Manager and above — agents don't see the
  // chip at all, so the chrome stays clean for the day-to-day audience.
  // (Inline role check rather than importing roleAtLeast — matches the
  // pattern used by the other tab-gating in this file.)
  const canSeeStats = role && ["Manager", "Admin", "Owner"].includes(role);
  const subtabs = canSeeStats ? [...AFFILIATES_SUBTABS_BASE, "Stats"] : AFFILIATES_SUBTABS_BASE;

  if (!canView) {
    return (
      <div style={{ background: CREAM, minHeight: "100vh", padding: "80px 24px" }}>
        <div style={{ maxWidth: 600, margin: "0 auto", textAlign: "center" }}>
          <div style={{ fontFamily: F.serif, fontSize: 32, color: BURG, fontWeight: 600, marginBottom: 14 }}>Affiliates</div>
          <div style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 16, color: INK, opacity: 0.6 }}>
            Affiliates is visible to Manager and above while the workstream is being re-scoped. Ask your manager if you need a question routed.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: CREAM, minHeight: "100vh" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "56px 24px 24px" }}>
        <div style={eyebrowS}>LUMÉ CX — Affiliates Playbook · CS team handover</div>
        <div style={{ fontFamily: F.serif, fontSize: 48, color: BURG, fontWeight: 600, lineHeight: 1.05, marginBottom: 8, letterSpacing: -1 }}>
          {sub}
        </div>
        {AFFILIATES_SUBTITLE[sub] && (
          <div style={{ fontFamily: F.sans, fontSize: 13, color: INK, opacity: 0.7, marginBottom: 18, lineHeight: 1.5 }}>
            {AFFILIATES_SUBTITLE[sub]}
          </div>
        )}

        {/* Search bar — scoped to the active panel. Hidden on Start Here
            because that sub-tab has its own inline search field below
            the AI helper, so we'd otherwise stack two near-identical
            inputs at the top. */}
        {sub !== "Start Here" && (
        <div style={{ position: "relative", marginBottom: 22 }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${sub.toLowerCase()}…`}
            style={{
              width: "100%",
              padding: "12px 16px 12px 42px",
              fontFamily: F.sans, fontSize: 14,
              background: W,
              border: "1px solid " + SOFT_BORDER,
              borderRadius: 8,
              color: INK,
              outline: "none",
              transition: "border-color 0.15s",
            }}
            onFocus={(e) => (e.target.style.borderColor = BURG)}
            onBlur={(e) => (e.target.style.borderColor = SOFT_BORDER)}
          />
          <div style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", fontSize: 14, opacity: 0.4, pointerEvents: "none" }}>⌕</div>
          {query && (
            <button
              onClick={() => setQuery("")}
              style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", fontSize: 18, color: INK, opacity: 0.4, cursor: "pointer", padding: 4 }}
              aria-label="Clear search"
            >×</button>
          )}
        </div>
        )}

        {/* Subtab chips */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
          {subtabs.map((s) => {
            const active = s === sub;
            return (
              <button key={s} onClick={() => { setSub(s); setQuery(""); }} style={{
                background: active ? BURG : "transparent",
                color: active ? CREAM : BURG,
                border: "1px solid " + (active ? BURG : SOFT_BORDER),
                fontFamily: F.sans, fontSize: 11, fontWeight: 700, padding: "10px 18px",
                letterSpacing: 2, textTransform: "uppercase", cursor: "pointer", borderRadius: 99,
                transition: "all 0.15s",
              }}>
                {s}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "8px 24px 96px" }}>
        <AffiliatesStatusPanel />
        {sub === "Start Here" && <AffiliatesStartHere query={query} setQuery={setQuery} />}
        {sub === "Macros"     && <AffiliatesMacros    query={query} />}
        {sub === "Program"    && <AffiliatesProgram   query={query} />}
        {sub === "Links"      && <AffiliatesLinks     query={query} />}
        {sub === "Stats" && canSeeStats && <AffiliatesStats />}
      </div>
    </div>
  );
}

// ─── Start Here sub-tab ──────────────────────────────────────────────
// Search-first surface. Empty state: chip row + friendly hint. Search
// state: merges matching decision-tree rows ("what kind of email is
// this?") + matching macros ("ready replies"). Guiding principles live
// in a collapsed accordion at the bottom — available, not in the way.
//
// Chips set the parent's query state (passed via setQuery prop) so they
// drive the same search the header search bar does. The Start Here
// component is the only sub-tab that gets setQuery — the others are
// browse-only and don't need to mutate the query.

// Common-trigger chips. Labels are friendly; queries are the keyword
// that actually matches Kendra's content (verified against decisions
// + macros on 2026-05-15).
const AFFILIATES_COMMON_TRIGGERS = [
  { label: "payout",              query: "payout" },
  { label: "where's my link",     query: "link" },
  { label: "free product",        query: "free product" },
  { label: "TUNE / migration",    query: "TUNE" },
  { label: "login issue",         query: "login" },
  { label: "partnership",         query: "partnership" },
  { label: "reward / sales",      query: "reward" },
];

function AffiliatesStartHere({ query, setQuery }) {
  const decisions = AFFILIATES_DATA.decisions ?? [];
  const principles = AFFILIATES_DATA.principles ?? [];
  const allMacros = (AFFILIATES_DATA.macros ?? []).flatMap((c) =>
    c.items.map((m) => ({ ...m, category: c.category }))
  );

  const q = query.trim().toLowerCase();
  const hasQuery = q.length > 0;

  const matchingDecisions = hasQuery
    ? decisions.filter((d) =>
        (d.trigger + " " + d.tag + " " + d.approach + " " + d.macroSheet).toLowerCase().includes(q)
      )
    : [];

  const matchingMacros = hasQuery
    ? allMacros.filter((m) =>
        (m.trigger + " " + m.tag + " " + m.response).toLowerCase().includes(q)
      )
    : [];

  const totalMatches = matchingDecisions.length + matchingMacros.length;

  const [principlesOpen, setPrinciplesOpen] = useState(false);

  // Per Cherie (2026-05-15) — Start Here renders BOTH the AI helper
  // (primary, top) AND the keyword search (secondary, below). No mode
  // toggle. Agent's first instinct is to paste; if they prefer to
  // search by keyword, it's right there below the divider.

  // Section divider for visual separation between the AI helper above
  // and the keyword-search below.
  const Divider = () => (
    <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "24px 0 18px" }}>
      <div style={{ flex: 1, height: 1, background: SOFT_BORDER }} />
      <div style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 13, color: INK, opacity: 0.55 }}>
        or search a keyword below
      </div>
      <div style={{ flex: 1, height: 1, background: SOFT_BORDER }} />
    </div>
  );

  return (
    <div>
      {/* ── AI HELPER (top, primary) ─────────────────────────── */}
      <AffiliatesAskPlaybook />

      <Divider />

      {/* ── KEYWORD SEARCH (below, secondary) ─────────────────── */}

      {/* Inline search field — wired to the same `query` state as
          the parent header search bar so typing here filters the
          chips and results below. */}
      <div style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 10, padding: "14px 18px", marginBottom: 14 }}>
        <div style={{ fontFamily: F.sans, fontSize: 10, color: BURG, letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 700, marginBottom: 8 }}>
          Search by keyword
        </div>
        <div style={{ position: "relative" }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. payout, login, free product…"
            style={{
              width: "100%", boxSizing: "border-box",
              padding: "10px 14px 10px 38px",
              fontFamily: F.sans, fontSize: 14,
              background: CREAM,
              border: "1px solid " + SOFT_BORDER,
              borderRadius: 8, color: INK, outline: "none",
              transition: "border-color 0.15s",
            }}
            onFocus={(e) => (e.target.style.borderColor = BURG)}
            onBlur={(e) => (e.target.style.borderColor = SOFT_BORDER)}
          />
          <div style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", fontSize: 14, opacity: 0.4, pointerEvents: "none" }}>⌕</div>
          {query && (
            <button
              onClick={() => setQuery("")}
              style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "transparent", border: "none", fontSize: 18, color: INK, opacity: 0.4, cursor: "pointer", padding: 4 }}
              aria-label="Clear search"
            >×</button>
          )}
        </div>
      </div>

      {/* Common-trigger chips — primary affordance for cold users */}
      <div style={{ marginBottom: 18 }}>
        <div style={{ fontFamily: F.sans, fontSize: 10, color: INK, opacity: 0.55, letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 700, marginBottom: 8 }}>
          Common triggers — tap any
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {AFFILIATES_COMMON_TRIGGERS.map((t) => {
            const active = q === t.query.toLowerCase();
            return (
              <button
                key={t.label}
                onClick={() => setQuery(active ? "" : t.query)}
                style={{
                  background: active ? BURG : W,
                  color: active ? CREAM : BURG,
                  border: "1px solid " + (active ? BURG : SOFT_BORDER),
                  fontFamily: F.sans, fontSize: 12, fontWeight: 600,
                  padding: "8px 14px", borderRadius: 99, cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >{t.label}</button>
            );
          })}
        </div>
      </div>

      {/* Empty state — what to do when nothing is typed */}
      {!hasQuery && (
        <div style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 10, padding: "26px 28px", textAlign: "center", marginBottom: 18 }}>
          <div style={{ fontFamily: F.serif, fontSize: 18, color: BURG, fontWeight: 600, marginBottom: 6 }}>
            Got an affiliate email?
          </div>
          <div style={{ fontFamily: F.sans, fontSize: 13, color: INK, opacity: 0.7, lineHeight: 1.55, maxWidth: 520, margin: "0 auto" }}>
            Type a keyword from their message in the search bar above, or tap one of the common triggers.
            You'll see the matching macro to copy and the escalation flag if there is one.
          </div>
        </div>
      )}

      {/* Results — decisions first ("what kind of email is this"),
          then macros ("ready replies") */}
      {hasQuery && (
        <>
          <div style={{ fontFamily: F.sans, fontSize: 11, color: INK, opacity: 0.55, marginBottom: 12, letterSpacing: 1, textTransform: "uppercase", fontWeight: 700 }}>
            {totalMatches === 0
              ? `No matches for "${query}"`
              : `Results for "${query}" · ${totalMatches} ${totalMatches === 1 ? "match" : "matches"}`}
          </div>

          {totalMatches === 0 && (
            <div style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 10, padding: "20px 24px", fontFamily: F.serif, fontStyle: "italic", fontSize: 14, color: INK, opacity: 0.65 }}>
              Nothing matched "{query}". Try a different keyword, or tap one of the common triggers above. If you've tried a few and still aren't sure — that's a sign to flag to a manager.
            </div>
          )}

          {/* Decision-tree matches: training context for what kind of
              ticket this is. Approach text is framed as "Tips for this
              ticket" — the team uses these as cold-onboarding training,
              not just lookup. No tag / category labels (tags go in Gorgias). */}
          {matchingDecisions.length > 0 && (
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontFamily: F.sans, fontSize: 10, color: INK, opacity: 0.55, letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 700, marginBottom: 8 }}>
                What kind of email is this? · {matchingDecisions.length}
              </div>
              {matchingDecisions.map((d, i) => {
                const esc = String(d.escalate || "").toLowerCase();
                const needsEscalation = esc.includes("flag") || esc.includes("escalate");
                return (
                  <div key={i} style={{
                    background: W,
                    border: "1px solid " + (needsEscalation ? RED : SOFT_BORDER),
                    borderLeft: "4px solid " + (needsEscalation ? RED : GOLD),
                    borderRadius: 10, padding: "12px 16px", marginBottom: 8,
                  }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
                      <span style={{ fontFamily: F.serif, fontSize: 14, color: BURG, fontWeight: 700, flex: 1 }}>
                        {d.trigger}
                      </span>
                      {needsEscalation && (
                        <span style={{ fontFamily: F.sans, fontSize: 10, color: RED, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", background: "#fee", padding: "3px 8px", borderRadius: 4 }}>
                          Flag manager first
                        </span>
                      )}
                    </div>
                    <div style={{ fontFamily: F.sans, fontSize: 10, color: BURG, opacity: 0.7, letterSpacing: 1, textTransform: "uppercase", fontWeight: 700, marginBottom: 6 }}>
                      Tips for this ticket
                    </div>
                    {/* Bullet-list rendering when we've reformatted the
                        approach text into proper bullets (all 23 decisions
                        as of 2026-05-15). Falls back to the prose form if
                        a future-added decision lacks bullets. */}
                    {(d.approachBullets ?? []).length > 0 ? (
                      <ul style={{ margin: 0, paddingLeft: 18, fontFamily: F.sans, fontSize: 12.5, color: INK, lineHeight: 1.55 }}>
                        {d.approachBullets.map((b, bi) => (
                          <li key={bi} style={{ marginBottom: 4 }}>{b}</li>
                        ))}
                      </ul>
                    ) : (
                      <div style={{ fontFamily: F.sans, fontSize: 12.5, color: INK, lineHeight: 1.55, whiteSpace: "pre-wrap" }}>
                        {d.approach}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Macro matches — two display modes depending on whether the
              macro is in Gorgias yet:
              • IN GORGIAS (green pill): the primary action is "Copy name"
                — the agent pastes the name into Gorgias's macro search
                and inserts the macro from there. Body shown for reference.
              • NOT IN GORGIAS (amber pill): the primary action is "Copy
                body" — the agent pastes the body straight into the reply.
                Body shown prominently. */}
          {matchingMacros.length > 0 && (
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontFamily: F.sans, fontSize: 10, color: INK, opacity: 0.55, letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 700, marginBottom: 8 }}>
                Ready replies · {matchingMacros.length}
              </div>
              {matchingMacros.map((m, i) => {
                const inG = !!m.inGorgias;
                const pillBg = inG ? "#E8F4EA" : "#FCEFD9";
                const pillFg = inG ? "#1F5C2E" : "#7A4A05";
                const pillBorder = inG ? "#B8DDC2" : "#E8C994";
                return (
                  <div key={i} style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 10, padding: "12px 16px", marginBottom: 8 }}>
                    <div style={{ fontFamily: F.serif, fontSize: 14, color: BURG, fontWeight: 700, marginBottom: 8 }}>
                      {m.trigger}
                    </div>
                    {/* Status pill + primary action */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
                      <span style={{
                        fontFamily: F.sans, fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase",
                        color: pillFg, background: pillBg, border: "1px solid " + pillBorder,
                        padding: "3px 8px", borderRadius: 99, whiteSpace: "nowrap",
                      }}>
                        {inG ? "✓ In Gorgias" : "Not in Gorgias yet"}
                      </span>
                      {inG ? (
                        <>
                          <span style={{ fontFamily: "ui-monospace, SFMono-Regular, monospace", fontSize: 12, color: BURG, fontWeight: 700, background: CREAM, padding: "4px 10px", borderRadius: 4 }}>
                            {m.gorgiasMacro}
                          </span>
                          <CopyButton text={m.gorgiasMacro} label="Copy name" macroName={m.gorgiasMacro} copyType="name" inGorgias={true} />
                        </>
                      ) : (
                        <>
                          <span style={{ fontFamily: F.sans, fontSize: 11, color: INK, opacity: 0.65, fontStyle: "italic" }}>
                            Copy the body and paste it into your Gorgias reply.
                          </span>
                          <CopyButton text={m.response} label="Copy body" macroName={m.gorgiasMacro} copyType="body" inGorgias={false} />
                        </>
                      )}
                    </div>
                    {/* Body — shown for reference when in Gorgias, primary action target when not */}
                    <div style={{
                      fontFamily: F.sans, fontSize: 12.5, color: INK, lineHeight: 1.6,
                      whiteSpace: "pre-wrap",
                      background: CREAM,
                      padding: "10px 12px",
                      borderRadius: 6,
                      opacity: inG ? 0.75 : 1,
                    }}>
                      {m.response}
                    </div>
                    {m.note && (
                      <div style={{ marginTop: 6, fontFamily: F.serif, fontStyle: "italic", fontSize: 11, color: INK, opacity: 0.6 }}>
                        Note: {m.note}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* Guiding principles — collapsed accordion at the bottom.
          Available when curious, out of the way otherwise. */}
      <div style={{ marginTop: 24 }}>
        <button
          onClick={() => setPrinciplesOpen((o) => !o)}
          style={{
            background: "transparent", border: "1px solid " + SOFT_BORDER,
            borderRadius: 10, padding: "10px 16px", cursor: "pointer",
            display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left",
          }}
        >
          <span style={{ fontFamily: F.sans, fontSize: 13, color: INK, opacity: 0.5 }}>
            {principlesOpen ? "▾" : "▸"}
          </span>
          <span style={{ fontFamily: F.sans, fontSize: 11, color: BURG, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase" }}>
            Guiding principles
          </span>
        </button>
        {principlesOpen && (
          <div style={{ background: W, border: "1px solid " + SOFT_BORDER, borderTop: "none", borderRadius: "0 0 10px 10px", padding: "14px 18px" }}>
            {principles.map((p, i) => (
              <div key={i} style={{ padding: "6px 0", borderBottom: i < principles.length - 1 ? "1px solid " + SOFT_BORDER : "none", fontFamily: F.sans, fontSize: 12.5, color: INK, lineHeight: 1.55 }}>
                <span style={{ color: BURG, fontWeight: 700 }}>{p.title}.</span>{" "}
                <span style={{ opacity: 0.85 }}>{p.body}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Macros sub-tab ──────────────────────────────────────────────────
// All 7 macro categories. Each macro is a collapsible card showing the
// trigger as the header; expanded reveals the full response + a copy
// button. Search filters across trigger and response text.
function AffiliatesMacros({ query }) {
  const categories = AFFILIATES_DATA.macros ?? [];
  const [expanded, setExpanded] = useState({}); // keyed "catIdx:itemIdx"
  const q = query.trim().toLowerCase();

  // Filter at the item level so empty categories collapse out of view.
  const filteredCategories = categories
    .map((cat) => ({
      ...cat,
      items: q
        ? cat.items.filter((m) =>
            (m.trigger + " " + m.tag + " " + m.response).toLowerCase().includes(q)
          )
        : cat.items,
    }))
    .filter((cat) => cat.items.length > 0);

  const totalShown = filteredCategories.reduce((n, c) => n + c.items.length, 0);
  const totalAll = categories.reduce((n, c) => n + c.items.length, 0);

  return (
    <div>
      <div style={{ fontFamily: F.sans, fontSize: 11, color: INK, opacity: 0.55, marginBottom: 10, letterSpacing: 1, textTransform: "uppercase", fontWeight: 700 }}>
        Macros · {totalShown} of {totalAll}
        {q && <span style={{ opacity: 0.6, fontWeight: 500 }}> — searching for "{query}"</span>}
      </div>

      {filteredCategories.length === 0 && (
        <div style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 10, padding: "20px 24px", fontFamily: F.serif, fontStyle: "italic", fontSize: 14, color: INK, opacity: 0.6 }}>
          No macros match your search.
        </div>
      )}

      {filteredCategories.map((cat, ci) => (
        <div key={cat.category} style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: F.serif, fontSize: 22, color: BURG, fontWeight: 700, marginBottom: 10, paddingBottom: 6, borderBottom: "2px solid " + GOLD }}>
            {cat.category}
          </div>
          {cat.items.map((m, mi) => {
            const key = `${ci}:${mi}`;
            const isOpen = !!expanded[key];
            const inG = !!m.inGorgias;
            const pillBg = inG ? "#E8F4EA" : "#FCEFD9";
            const pillFg = inG ? "#1F5C2E" : "#7A4A05";
            const pillBorder = inG ? "#B8DDC2" : "#E8C994";
            return (
              <div key={key} style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 10, marginBottom: 8, overflow: "hidden" }}>
                <button
                  onClick={() => setExpanded((cur) => ({ ...cur, [key]: !cur[key] }))}
                  style={{
                    width: "100%", background: "transparent", border: "none",
                    padding: "12px 18px", textAlign: "left", cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 10,
                  }}
                >
                  <span style={{ fontFamily: F.sans, fontSize: 13, color: INK, opacity: 0.5 }}>{isOpen ? "▾" : "▸"}</span>
                  <span style={{ fontFamily: F.serif, fontSize: 14, color: BURG, fontWeight: 600, flex: 1 }}>
                    {m.trigger}
                  </span>
                  {/* Compact status pill in the collapsed-header row */}
                  <span style={{
                    fontFamily: F.sans, fontSize: 9, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase",
                    color: pillFg, background: pillBg, border: "1px solid " + pillBorder,
                    padding: "2px 7px", borderRadius: 99, whiteSpace: "nowrap",
                  }}>
                    {inG ? "✓ Gorgias" : "Paste body"}
                  </span>
                </button>
                {isOpen && (
                  <div style={{ padding: "0 18px 16px 38px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
                      {inG ? (
                        <>
                          <span style={{ fontFamily: F.sans, fontSize: 10, color: INK, opacity: 0.6, letterSpacing: 1, textTransform: "uppercase", fontWeight: 700 }}>
                            In Gorgias — copy name to insert
                          </span>
                          <span style={{ fontFamily: "ui-monospace, SFMono-Regular, monospace", fontSize: 12, color: BURG, fontWeight: 700, background: CREAM, padding: "4px 10px", borderRadius: 4 }}>
                            {m.gorgiasMacro}
                          </span>
                          <CopyButton text={m.gorgiasMacro} label="Copy name" macroName={m.gorgiasMacro} copyType="name" inGorgias={true} />
                        </>
                      ) : (
                        <>
                          <span style={{ fontFamily: F.sans, fontSize: 10, color: INK, opacity: 0.6, letterSpacing: 1, textTransform: "uppercase", fontWeight: 700 }}>
                            Not in Gorgias yet — paste body directly
                          </span>
                          <CopyButton text={m.response} label="Copy body" macroName={m.gorgiasMacro} copyType="body" inGorgias={false} />
                        </>
                      )}
                    </div>
                    <div style={{
                      fontFamily: F.sans, fontSize: 13, color: INK, lineHeight: 1.6,
                      whiteSpace: "pre-wrap", background: CREAM, padding: "12px 14px",
                      borderRadius: 6,
                      opacity: inG ? 0.75 : 1,
                    }}>
                      {m.response}
                    </div>
                    {m.note && (
                      <div style={{ marginTop: 8, fontFamily: F.serif, fontStyle: "italic", fontSize: 11, color: INK, opacity: 0.6 }}>
                        Note: {m.note}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ─── Program sub-tab ──────────────────────────────────────────────────
// The overview content from Kendra's PROGRAM OVERVIEW sheet. Each
// heading is a section; each item is a label/body pair. Searchable.
function AffiliatesProgram({ query }) {
  const sections = AFFILIATES_DATA.overview ?? [];
  const q = query.trim().toLowerCase();

  const filtered = q
    ? sections
        .map((sec) => ({
          ...sec,
          items: sec.items.filter((it) =>
            (sec.heading + " " + it.label + " " + it.body).toLowerCase().includes(q)
          ),
        }))
        .filter((sec) => sec.items.length > 0 || (q && sec.heading.toLowerCase().includes(q)))
    : sections.filter((sec) => sec.items.length > 0);

  return (
    <div>
      {filtered.length === 0 && (
        <div style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 10, padding: "20px 24px", fontFamily: F.serif, fontStyle: "italic", fontSize: 14, color: INK, opacity: 0.6 }}>
          No program-overview sections match your search.
        </div>
      )}
      {filtered.map((sec, si) => (
        <div key={si} style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 10, padding: "20px 24px", marginBottom: 16 }}>
          <div style={{ fontFamily: F.serif, fontSize: 18, color: BURG, fontWeight: 700, marginBottom: 12, paddingBottom: 6, borderBottom: "2px solid " + GOLD }}>
            {sec.heading}
          </div>
          {sec.items.map((it, ii) => (
            <div key={ii} style={{ padding: "10px 0", borderBottom: ii < sec.items.length - 1 ? "1px solid " + SOFT_BORDER : "none" }}>
              <div style={{ fontFamily: F.sans, fontSize: 11, color: BURG, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>
                {it.label}
              </div>
              <div style={{ fontFamily: F.sans, fontSize: 13, color: INK, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                {it.body}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── Links sub-tab ──────────────────────────────────────────────────
// Knowledge base — all URLs CS needs, grouped by section.
function AffiliatesLinks({ query }) {
  const groups = AFFILIATES_DATA.links ?? [];
  const q = query.trim().toLowerCase();

  // Defensive URL sanitiser. Cherie May 18 — a Links row had two URLs
  // and a "Sign in via Shopify" instruction smushed into one `url`
  // string, breaking the anchor (clicked to a 404, displayed as one
  // long broken line). The data is fixed at source now, but this
  // strips any non-URL crud (newlines, extra text after a space) so
  // a future bad row degrades gracefully — first whitespace-delimited
  // token wins.
  const cleanUrl = (raw) => {
    if (!raw) return "";
    const first = String(raw).trim().split(/\s+/)[0];
    return first || "";
  };

  const filtered = q
    ? groups
        .map((g) => ({
          ...g,
          items: g.items.filter((it) =>
            (g.heading + " " + it.title + " " + it.url + " " + it.purpose).toLowerCase().includes(q)
          ),
        }))
        .filter((g) => g.items.length > 0)
    : groups.filter((g) => g.items.length > 0);

  return (
    <div>
      {filtered.length === 0 && (
        <div style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 10, padding: "20px 24px", fontFamily: F.serif, fontStyle: "italic", fontSize: 14, color: INK, opacity: 0.6 }}>
          No links match your search.
        </div>
      )}
      {filtered.map((g, gi) => {
        const isInternal = String(g.heading || "").toUpperCase().includes("INTERNAL");
        return (
          <div key={gi} style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 10, padding: "20px 24px", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 12, paddingBottom: 6, borderBottom: "2px solid " + (isInternal ? RED : GOLD) }}>
              <div style={{ fontFamily: F.serif, fontSize: 18, color: BURG, fontWeight: 700, flex: 1 }}>
                {g.heading}
              </div>
              {isInternal && (
                <span style={{ fontFamily: F.sans, fontSize: 10, color: RED, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", background: "#fee", padding: "3px 8px", borderRadius: 4 }}>
                  Do not share
                </span>
              )}
            </div>
            {g.items.map((it, ii) => (
              <div key={ii} style={{ padding: "10px 0", borderBottom: ii < g.items.length - 1 ? "1px solid " + SOFT_BORDER : "none" }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 4, flexWrap: "wrap" }}>
                  <div style={{ fontFamily: F.sans, fontSize: 13, color: BURG, fontWeight: 700, flex: 1 }}>
                    {it.title}
                  </div>
                  {(() => {
                    const safeUrl = cleanUrl(it.url);
                    if (!safeUrl) return null;
                    return (
                      <>
                        <a href={safeUrl} target="_blank" rel="noreferrer" style={{
                          fontFamily: F.sans, fontSize: 11, color: BURG, textDecoration: "underline",
                          wordBreak: "break-all", maxWidth: 480, opacity: 0.75,
                        }}>{safeUrl}</a>
                        <CopyButton text={safeUrl} label="Copy URL" />
                      </>
                    );
                  })()}
                </div>
                {it.purpose && (
                  <div style={{ fontFamily: F.sans, fontSize: 12, color: INK, opacity: 0.7, lineHeight: 1.55, whiteSpace: "pre-wrap" }}>
                    {it.purpose}
                  </div>
                )}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

// ─── Ask the Playbook sub-tab ────────────────────────────────────
// Stage 2 of the affiliates rollout. Agent pastes the affiliate's email,
// AI returns: a suggested macro, escalation flag if any, rationale, and
// any policy reminders (e.g. "don't mention reward tiers — not public
// yet"). Backed by /api/affiliates/suggest which calls Claude with
// AFFILIATES_DATA as grounding context, so the model can ONLY pick
// macros that exist and follows our policy rules.
function AffiliatesAskPlaybook() {
  const [emailText, setEmailText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [suggestion, setSuggestion] = useState(null);
  const [rawText, setRawText] = useState(null);
  // Chat-continue state — for the "Refine this" affordance below the
  // structured suggestion. Lets agents ask follow-ups on edge cases
  // (Cherie May 18) without losing the anti-hallucination grounding
  // that the structured /suggest endpoint provides.
  const [chatOpen, setChatOpen] = useState(false);
  const [chatHistory, setChatHistory] = useState([]); // [{ role, content }]
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState(null);

  // Flat lookup of every macro by gorgiasMacro name so we can render
  // the suggested macro with its full info (body, inGorgias status).
  const macroByName = useMemo(() => {
    const m = {};
    for (const cat of AFFILIATES_DATA.macros ?? []) {
      for (const item of cat.items ?? []) {
        if (item.gorgiasMacro) m[item.gorgiasMacro] = item;
      }
    }
    return m;
  }, []);

  async function submit() {
    if (!emailText.trim()) {
      setError("Paste the affiliate's email first.");
      return;
    }
    setLoading(true);
    setError(null);
    setSuggestion(null);
    setRawText(null);
    // New suggestion = reset any in-progress refine chat — the old
    // chat history was about a different email.
    setChatOpen(false);
    setChatHistory([]);
    setChatInput("");
    setChatError(null);
    try {
      const res = await fetch("/api/affiliates/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailText: emailText.trim() }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      if (json.suggestion) {
        setSuggestion(json.suggestion);
      } else {
        // Parse failed — surface raw text so the agent can still read it
        setRawText(json.rawText || "(empty response)");
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function clearAll() {
    setEmailText("");
    setSuggestion(null);
    setRawText(null);
    setError(null);
    setChatOpen(false);
    setChatHistory([]);
    setChatInput("");
    setChatError(null);
  }

  // Send a follow-up message to /api/affiliates/suggest/refine. The
  // endpoint takes the original email + initial suggestion + running
  // history so it stays grounded in the same playbook the structured
  // suggestion came from.
  async function sendChat() {
    const text = chatInput.trim();
    if (!text || chatLoading) return;
    const nextHistory = [...chatHistory, { role: "user", content: text }];
    setChatHistory(nextHistory);
    setChatInput("");
    setChatLoading(true);
    setChatError(null);
    try {
      const res = await fetch("/api/affiliates/suggest/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emailText: emailText.trim(),
          initialSuggestion: suggestion,
          history: nextHistory,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setChatHistory((cur) => [...cur, { role: "assistant", content: json.reply || "(empty reply)" }]);
    } catch (e) {
      setChatError(e.message);
    } finally {
      setChatLoading(false);
    }
  }

  const inputStyle = {
    width: "100%", boxSizing: "border-box",
    fontFamily: F.sans, fontSize: 14, color: INK, lineHeight: 1.55,
    background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 8,
    padding: "12px 14px", resize: "vertical", outline: "none",
  };

  const confColor = (c) => c === "high" ? "#3B7A4F" : c === "medium" ? GOLD : RED;

  return (
    <div>
      <div style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 10, padding: "16px 20px", marginBottom: 16 }}>
        <div style={{ fontFamily: F.sans, fontSize: 10, color: BURG, letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 700, marginBottom: 8 }}>
          Paste the email for a suggestion on how to handle
        </div>
        <textarea
          value={emailText}
          onChange={(e) => setEmailText(e.target.value)}
          placeholder={"Paste the affiliate's email here — the full message or just the question.\n\nThe AI will read it against the playbook and suggest a macro + flag any escalation."}
          rows={10}
          style={inputStyle}
          onFocus={(e) => (e.target.style.borderColor = BURG)}
          onBlur={(e) => (e.target.style.borderColor = SOFT_BORDER)}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
          <button
            onClick={submit}
            disabled={loading || !emailText.trim()}
            style={{
              background: BURG, color: CREAM, border: "1px solid " + BURG,
              fontFamily: F.sans, fontSize: 11, fontWeight: 700, padding: "10px 22px",
              letterSpacing: 1.5, textTransform: "uppercase",
              cursor: loading || !emailText.trim() ? "not-allowed" : "pointer",
              borderRadius: 99, opacity: loading || !emailText.trim() ? 0.5 : 1,
            }}
          >
            {loading ? "Thinking…" : "Suggest a macro"}
          </button>
          {(emailText || suggestion || rawText) && (
            <button
              onClick={clearAll}
              disabled={loading}
              style={{
                background: "transparent", color: BURG, border: "1px solid " + SOFT_BORDER,
                fontFamily: F.sans, fontSize: 11, fontWeight: 700, padding: "10px 18px",
                letterSpacing: 1.5, textTransform: "uppercase", cursor: "pointer", borderRadius: 99,
              }}
            >Clear</button>
          )}
          <div style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 12, color: INK, opacity: 0.55 }}>
            Typically 3-8 seconds. The suggestion is grounded in the playbook — it can't invent macro names or rules.
          </div>
        </div>
      </div>

      {error && (
        <div style={{ background: "#fee", border: "1px solid " + RED, color: RED, padding: 12, borderRadius: 8, fontFamily: F.sans, fontSize: 13, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {rawText && (
        <div style={{ background: W, border: "1px solid " + GOLD, borderLeft: "4px solid " + GOLD, borderRadius: 10, padding: "16px 20px", marginBottom: 16 }}>
          <div style={{ fontFamily: F.sans, fontSize: 10, color: BURG, letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 700, marginBottom: 8 }}>
            AI response (couldn't parse cleanly — raw output below)
          </div>
          <div style={{ fontFamily: "ui-monospace, SFMono-Regular, monospace", fontSize: 12, color: INK, whiteSpace: "pre-wrap", background: CREAM, padding: "10px 12px", borderRadius: 6 }}>
            {rawText}
          </div>
        </div>
      )}

      {suggestion && (
        <div>
          {/* Escalation banner — shown first so it can't be missed */}
          {suggestion.escalate?.required && (
            <div style={{ background: "#fee", border: "1px solid " + RED, borderLeft: "4px solid " + RED, borderRadius: 10, padding: "14px 18px", marginBottom: 16 }}>
              <div style={{ fontFamily: F.sans, fontSize: 10, color: RED, letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 700, marginBottom: 6 }}>
                ⚠ Escalate first — flag to {suggestion.escalate.to || "manager"}
              </div>
              <div style={{ fontFamily: F.sans, fontSize: 13, color: INK, lineHeight: 1.55 }}>
                {suggestion.escalate.reason || "This case is outside the standard SOP."}
              </div>
            </div>
          )}

          {/* Plain-English summary — always rendered, separate from the
              macro/rationale rationale so the agent gets a quick read
              of what the affiliate is actually asking before diving in. */}
          {suggestion.summary && (
            <div style={{ background: W, border: "1px solid " + SOFT_BORDER, borderLeft: "4px solid " + BURG, borderRadius: 10, padding: "14px 18px", marginBottom: 16 }}>
              <div style={{ fontFamily: F.sans, fontSize: 10, color: BURG, letterSpacing: 1, textTransform: "uppercase", fontWeight: 700, marginBottom: 6 }}>
                Summary
              </div>
              <div style={{ fontFamily: F.sans, fontSize: 13, color: INK, lineHeight: 1.6 }}>
                {suggestion.summary}
              </div>
            </div>
          )}

          {/* Recommended macro */}
          {suggestion.recommendedMacro?.name ? (() => {
            const macroName = suggestion.recommendedMacro.name;
            const macro = macroByName[macroName];
            const inG = macro?.inGorgias ?? !!suggestion.recommendedMacro.inGorgias;
            const pillBg = inG ? "#E8F4EA" : "#FCEFD9";
            const pillFg = inG ? "#1F5C2E" : "#7A4A05";
            const pillBorder = inG ? "#B8DDC2" : "#E8C994";
            return (
              <div style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 10, padding: "16px 20px", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
                  <span style={{ fontFamily: F.sans, fontSize: 10, color: INK, opacity: 0.55, letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 700 }}>
                    Recommended macro
                  </span>
                  <span style={{
                    fontFamily: F.sans, fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase",
                    color: pillFg, background: pillBg, border: "1px solid " + pillBorder,
                    padding: "3px 8px", borderRadius: 99,
                  }}>
                    {inG ? "✓ In Gorgias" : "Not in Gorgias yet"}
                  </span>
                  <span style={{ marginLeft: "auto", fontFamily: F.sans, fontSize: 11, color: confColor(suggestion.confidence), fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>
                    {suggestion.confidence || "—"} confidence
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
                  <span style={{ fontFamily: "ui-monospace, SFMono-Regular, monospace", fontSize: 13, color: BURG, fontWeight: 700, background: CREAM, padding: "6px 12px", borderRadius: 4 }}>
                    {macroName}
                  </span>
                  {inG ? (
                    <CopyButton text={macroName} label="Copy name" macroName={macroName} copyType="name" inGorgias={true} />
                  ) : macro?.response ? (
                    <CopyButton text={macro.response} label="Copy body" macroName={macroName} copyType="body" inGorgias={false} />
                  ) : null}
                </div>

                {macro?.trigger && (
                  <div style={{ fontFamily: F.serif, fontSize: 13, color: INK, opacity: 0.7, fontStyle: "italic", marginBottom: 10 }}>
                    Matches: {macro.trigger}
                  </div>
                )}

                {suggestion.rationale && (
                  <>
                    <div style={{ fontFamily: F.sans, fontSize: 10, color: BURG, opacity: 0.7, letterSpacing: 1, textTransform: "uppercase", fontWeight: 700, marginBottom: 4 }}>
                      Why this macro
                    </div>
                    <div style={{ fontFamily: F.sans, fontSize: 13, color: INK, lineHeight: 1.55, marginBottom: macro?.response ? 12 : 0 }}>
                      {suggestion.rationale}
                    </div>
                  </>
                )}

                {macro?.response && (
                  <details style={{ marginTop: 8 }}>
                    <summary style={{ fontFamily: F.sans, fontSize: 11, color: BURG, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", cursor: "pointer" }}>
                      Preview macro body
                    </summary>
                    <div style={{
                      marginTop: 8,
                      fontFamily: F.sans, fontSize: 12.5, color: INK, lineHeight: 1.6,
                      whiteSpace: "pre-wrap", background: CREAM, padding: "10px 12px",
                      borderRadius: 6,
                    }}>
                      {macro.response}
                    </div>
                  </details>
                )}
              </div>
            );
          })() : (
            <div style={{ background: W, border: "1px solid " + GOLD, borderLeft: "4px solid " + GOLD, borderRadius: 10, padding: "16px 20px", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
                <span style={{ fontFamily: F.sans, fontSize: 10, color: INK, opacity: 0.55, letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 700 }}>
                  No clear macro found
                </span>
                <span style={{ marginLeft: "auto", fontFamily: F.sans, fontSize: 11, color: confColor(suggestion.confidence), fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>
                  {suggestion.confidence || "—"} confidence
                </span>
              </div>
              <div style={{ fontFamily: F.serif, fontSize: 15, color: BURG, fontWeight: 700, marginBottom: 8 }}>
                This case is outside the standard SOP — use the holding reply below while it routes.
              </div>
              {suggestion.rationale && (
                <div style={{ fontFamily: F.sans, fontSize: 12.5, color: INK, opacity: 0.75, lineHeight: 1.55, marginBottom: 12, fontStyle: "italic" }}>
                  {suggestion.rationale}
                </div>
              )}
              {suggestion.suggestedResponse ? (
                <>
                  <div style={{ fontFamily: F.sans, fontSize: 10, color: BURG, opacity: 0.7, letterSpacing: 1, textTransform: "uppercase", fontWeight: 700, marginBottom: 6 }}>
                    Suggested holding reply
                  </div>
                  <div style={{ fontFamily: F.sans, fontSize: 13, color: INK, lineHeight: 1.6, whiteSpace: "pre-wrap", background: CREAM, padding: "12px 14px", borderRadius: 6, marginBottom: 10 }}>
                    {suggestion.suggestedResponse}
                  </div>
                  <CopyButton text={suggestion.suggestedResponse} label="Copy reply" />
                </>
              ) : (
                <div style={{ fontFamily: F.sans, fontSize: 13, color: INK, opacity: 0.6, fontStyle: "italic" }}>
                  No holding reply drafted — review the decision tree manually and escalate.
                </div>
              )}
            </div>
          )}

          {/* Extra policy notes for the agent */}
          {Array.isArray(suggestion.flagsForAgent) && suggestion.flagsForAgent.length > 0 && (
            <div style={{ background: W, border: "1px solid " + SOFT_BORDER, borderLeft: "4px solid " + GOLD, borderRadius: 10, padding: "14px 18px", marginBottom: 16 }}>
              <div style={{ fontFamily: F.sans, fontSize: 10, color: BURG, letterSpacing: 1, textTransform: "uppercase", fontWeight: 700, marginBottom: 6 }}>
                Before you send — notes
              </div>
              <ul style={{ margin: 0, paddingLeft: 20, fontFamily: F.sans, fontSize: 13, color: INK, lineHeight: 1.6 }}>
                {suggestion.flagsForAgent.map((f, i) => <li key={i} style={{ marginBottom: 3 }}>{f}</li>)}
              </ul>
            </div>
          )}

          {/* Refine-this chat — opt-in expand for the 5% of edge cases
              where an agent needs to ask follow-ups. Stays grounded in
              the same playbook + tone guide as the structured panel. */}
          <div style={{ marginTop: 4 }}>
            {!chatOpen ? (
              <button
                onClick={() => setChatOpen(true)}
                style={{
                  background: "transparent",
                  color: BURG,
                  border: "1px dashed " + BURG,
                  fontFamily: F.sans, fontSize: 12, fontWeight: 700,
                  padding: "10px 16px", letterSpacing: 1, textTransform: "uppercase",
                  cursor: "pointer", borderRadius: 8,
                }}
              >
                💬 Refine this — ask a follow-up
              </button>
            ) : (
              <div style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 10, padding: "16px 18px" }}>
                <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12 }}>
                  <div style={{ fontFamily: F.sans, fontSize: 10, color: BURG, letterSpacing: 1.5, textTransform: "uppercase", fontWeight: 700 }}>
                    Refine this — chat
                  </div>
                  <button
                    onClick={() => { setChatOpen(false); setChatHistory([]); setChatInput(""); setChatError(null); }}
                    style={{
                      background: "transparent", color: INK, opacity: 0.5,
                      border: "none", fontSize: 11, cursor: "pointer",
                      fontFamily: F.sans, padding: 0,
                    }}
                  >
                    × Close
                  </button>
                </div>

                {chatHistory.length === 0 && (
                  <div style={{ fontFamily: F.serif, fontSize: 13, fontStyle: "italic", color: INK, opacity: 0.55, marginBottom: 12, lineHeight: 1.5 }}>
                    Ask a follow-up about this case. The AI keeps the original email and the suggestion above as context — try things like “Make the holding reply shorter,” “What if they're a VIP?,” or “Does the May 13 SOP cover this?”
                  </div>
                )}

                {chatHistory.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 12 }}>
                    {chatHistory.map((m, i) => {
                      const isUser = m.role === "user";
                      return (
                        <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: isUser ? "flex-end" : "flex-start" }}>
                          <div style={{
                            fontFamily: F.sans, fontSize: 9, color: INK, opacity: 0.5,
                            letterSpacing: 1, textTransform: "uppercase", fontWeight: 700,
                            marginBottom: 4,
                          }}>
                            {isUser ? "You" : "AI"}
                          </div>
                          <div style={{
                            maxWidth: "85%",
                            background: isUser ? BURG : CREAM,
                            color: isUser ? CREAM : INK,
                            fontFamily: F.sans, fontSize: 13, lineHeight: 1.55,
                            padding: "10px 14px", borderRadius: 10,
                            whiteSpace: "pre-wrap", wordBreak: "break-word",
                            border: isUser ? "1px solid " + BURG : "1px solid " + SOFT_BORDER,
                          }}>
                            {m.content}
                          </div>
                          {!isUser && (
                            <div style={{ marginTop: 6 }}>
                              <CopyButton text={m.content} label="Copy reply" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {chatLoading && (
                  <div style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 12, color: INK, opacity: 0.55, marginBottom: 12 }}>
                    Thinking…
                  </div>
                )}
                {chatError && (
                  <div style={{ background: "#fee", border: "1px solid " + RED, color: RED, padding: 8, borderRadius: 6, marginBottom: 10, fontFamily: F.sans, fontSize: 12 }}>
                    {chatError}
                  </div>
                )}

                <div style={{ display: "flex", gap: 8 }}>
                  <textarea
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      // Enter sends; shift+enter keeps the newline so the
                      // agent can write a longer follow-up if they need to.
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendChat();
                      }
                    }}
                    placeholder={chatLoading ? "Thinking…" : "Ask a follow-up… (Enter to send, Shift+Enter for newline)"}
                    rows={2}
                    disabled={chatLoading}
                    style={{
                      flex: 1, boxSizing: "border-box",
                      fontFamily: F.sans, fontSize: 13, color: INK, lineHeight: 1.5,
                      background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 8,
                      padding: "10px 12px", resize: "vertical", outline: "none",
                      opacity: chatLoading ? 0.6 : 1,
                    }}
                    onFocus={(e) => (e.target.style.borderColor = BURG)}
                    onBlur={(e) => (e.target.style.borderColor = SOFT_BORDER)}
                  />
                  <button
                    onClick={sendChat}
                    disabled={chatLoading || !chatInput.trim()}
                    style={{
                      background: BURG, color: CREAM,
                      border: "1px solid " + BURG,
                      fontFamily: F.sans, fontSize: 12, fontWeight: 700,
                      padding: "10px 16px", letterSpacing: 1, textTransform: "uppercase",
                      cursor: (chatLoading || !chatInput.trim()) ? "not-allowed" : "pointer",
                      borderRadius: 8, opacity: (chatLoading || !chatInput.trim()) ? 0.5 : 1,
                      alignSelf: "stretch",
                    }}
                  >
                    Send
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Stats sub-tab ──────────────────────────────────────────────
// Manager+ only. Shows which macros are getting copied most via the
// hub's Copy buttons. Two split lists:
//   1) "Not in Gorgias yet" — the priority list for what to add next.
//      If a macro here is getting hammered, it's a great candidate
//      for the next Gorgias batch.
//   2) "In Gorgias" — workhorse macros; informational.
// Configurable date window. Refetches when the window changes.
function AffiliatesStats() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/affiliates/copy/stats?days=${days}`)
      .then(async (res) => {
        const json = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`);
        if (!cancelled) setData(json);
      })
      .catch((e) => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [days]);

  const notInGorgias = (data?.stats ?? []).filter((s) => !s.inGorgias);
  const inGorgias = (data?.stats ?? []).filter((s) => s.inGorgias);

  const Range = ({ value, label }) => {
    const active = days === value;
    return (
      <button onClick={() => setDays(value)} style={{
        background: active ? BURG : "transparent",
        color: active ? CREAM : BURG,
        border: "1px solid " + (active ? BURG : SOFT_BORDER),
        fontFamily: F.sans, fontSize: 11, fontWeight: 700, padding: "6px 14px",
        letterSpacing: 1.5, textTransform: "uppercase", cursor: "pointer", borderRadius: 99,
      }}>{label}</button>
    );
  };

  const List = ({ heading, accent, items, emptyMsg }) => (
    <div style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 10, padding: "16px 20px", marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, paddingBottom: 8, borderBottom: "2px solid " + accent }}>
        <div style={{ fontFamily: F.serif, fontSize: 18, color: BURG, fontWeight: 700, flex: 1 }}>{heading}</div>
        <div style={{ fontFamily: F.sans, fontSize: 11, color: INK, opacity: 0.55, fontWeight: 600 }}>
          {items.length} {items.length === 1 ? "macro" : "macros"}
        </div>
      </div>
      {items.length === 0 ? (
        <div style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 13, color: INK, opacity: 0.55 }}>{emptyMsg}</div>
      ) : (
        items.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", padding: "8px 0", borderBottom: i < items.length - 1 ? "1px solid " + SOFT_BORDER : "none", fontFamily: F.sans, fontSize: 13, color: INK }}>
            <span style={{ fontFamily: "ui-monospace, SFMono-Regular, monospace", fontSize: 12, color: BURG, fontWeight: 700, flex: 1 }}>
              {s.macroName || "(unknown)"}
            </span>
            <span style={{ fontFamily: F.serif, fontSize: 18, color: BURG, fontWeight: 700, minWidth: 50, textAlign: "right" }}>
              {s.count.toLocaleString()}
            </span>
            <span style={{ fontFamily: F.sans, fontSize: 11, color: INK, opacity: 0.55, marginLeft: 6 }}>
              {s.count === 1 ? "click" : "clicks"}
            </span>
          </div>
        ))
      )}
    </div>
  );

  return (
    <div>
      {/* Range chips */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <Range value={7} label="Last 7 days" />
        <Range value={30} label="Last 30 days" />
        <Range value={90} label="Last 90 days" />
      </div>

      {loading && (
        <div style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 10, padding: "20px 24px", fontFamily: F.serif, fontStyle: "italic", fontSize: 14, color: INK, opacity: 0.5 }}>
          Loading copy stats…
        </div>
      )}
      {error && (
        <div style={{ background: "#fee", border: "1px solid " + RED, color: RED, padding: 12, borderRadius: 8, fontFamily: F.sans, fontSize: 13, marginBottom: 16 }}>
          {error}
        </div>
      )}
      {!loading && !error && data && (
        <>
          <div style={{ fontFamily: F.sans, fontSize: 11, color: INK, opacity: 0.55, marginBottom: 12, letterSpacing: 1, textTransform: "uppercase", fontWeight: 700 }}>
            {data.totalClicks?.toLocaleString() ?? 0} total copy click{data.totalClicks === 1 ? "" : "s"} · last {data.days} days
          </div>

          <List
            heading="Not in Gorgias yet — your priority list"
            accent={GOLD}
            items={notInGorgias}
            emptyMsg="Nothing copied yet in this window. As the team starts using macros not in Gorgias, they'll surface here ranked by demand."
          />

          <List
            heading="In Gorgias — workhorses"
            accent={SOFT_BORDER}
            items={inGorgias}
            emptyMsg="No in-Gorgias macros have been copied in this window yet."
          />
        </>
      )}
    </div>
  );
}

// Trustpilot lifetime stats — kept as plain constants, refreshed manually
// by visiting https://www.trustpilot.com/review/im8health.com and copying
// the current values. Cherie's call: skip the API integration (Business
// tier + key dance) and just show the public-facing numbers on the hub.
// Last refreshed 2026-05-15.
const TRUSTPILOT_STATS = {
  trustScore: 4.6,
  totalReviews: 1355,
  // Percentages by star, as shown on the Trustpilot profile page.
  // Numeric counts are computed on the fly.
  distribution: {
    fiveStar: 84,
    fourStar: 6,
    threeStar: 2,
    twoStar: 2,
    oneStar: 6,
  },
  url: "https://www.trustpilot.com/",
  lastUpdated: "2026-05-15",
};

// Render a star row of filled + outlined stars in tile-row coloring.
const tpRenderStars = (n) => "★".repeat(n) + "☆".repeat(5 - n);



function AskTab({ chatMsgs, chatInput, setChatInput, chatLoading, sendChat, chatEndRef }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 104px)", maxWidth: 700, margin: "0 auto" }}>
      <div style={{ background: W, padding: "14px 20px", borderBottom: "1px solid #e0d9d0" }}>
        <div style={{ fontFamily: F.serif, fontSize: 18, fontWeight: 600, color: BURG }}>Ask LUMÉ</div>
        <div style={{ fontFamily: F.sans, fontSize: 12, color: "#999" }}>Hi team — I&apos;m here for the &ldquo;what do I do here?&rdquo; moments. Policies, tricky situations, what to write back, when to escalate.</div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px", display: "flex", flexDirection: "column", gap: 14 }}>
        {chatMsgs.map((m, i) => {
          const isUser = m.role === "user";
          return (
            <div key={i} style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start" }}>
              <div style={{
                maxWidth: "80%",
                background: isUser ? BURG : W,
                color: isUser ? W : "#333",
                fontFamily: F.sans,
                fontSize: 14,
                lineHeight: 1.6,
                padding: "12px 16px",
                borderRadius: isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                border: isUser ? "none" : "1px solid #e0d9d0",
                // Plain text for user; rendered markdown blocks handle their own
                // layout for assistant, so we drop pre-wrap there.
                whiteSpace: isUser ? "pre-wrap" : "normal",
              }}>
                {isUser ? m.content : renderChatMarkdown(m.content)}
              </div>
            </div>
          );
        })}
        {chatLoading && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div style={{ background: W, border: "1px solid #e0d9d0", borderRadius: 16, padding: "12px 20px", fontFamily: F.sans, fontSize: 14, color: "#aaa" }}>Thinking...</div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div style={{ background: W, borderTop: "1px solid #e0d9d0", padding: "12px 16px", display: "flex", gap: 10 }}>
        <input
          value={chatInput}
          onChange={e => setChatInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendChat(); } }}
          placeholder="e.g. 'Can I refund outside the 30-day window?' or 'What do I say when a customer reports a reaction?'"
          style={{ flex: 1, fontFamily: F.sans, fontSize: 14, padding: "10px 14px", border: "1px solid #ddd", borderRadius: 8, outline: "none" }}
        />
        <button onClick={sendChat} disabled={chatLoading || !chatInput.trim()} style={{ background: chatLoading || !chatInput.trim() ? "#ccc" : BURG, color: W, fontFamily: F.sans, fontWeight: 700, fontSize: 13, padding: "10px 20px", border: "none", borderRadius: 8, cursor: chatLoading || !chatInput.trim() ? "default" : "pointer" }}>Send</button>
      </div>
    </div>
  );
}

// ─── SIMULATE TAB ─────────────────────────────────────────────────────────────
function SimTab({ selScen, setSelScen, simMsgs, simInput, setSimInput, simLoading, simFeedback, simDone, sendSim, startScen, simEndRef }) {
  if (!selScen) {
    return (
      <div style={{ maxWidth: 700, margin: "0 auto", padding: "24px 16px" }}>
        <div style={{ fontFamily: F.sans, fontSize: 11, color: "#999", textTransform: "uppercase", letterSpacing: 2, marginBottom: 8, textAlign: "center" }}>Simulation Scenarios</div>
        <div style={{ fontFamily: F.sans, fontSize: 13, color: "#aaa", textAlign: "center", marginBottom: 24 }}>Practice handling real customer situations. After 2 exchanges you receive coach feedback.</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {SCENARIOS.map(scen => (
            <div key={scen.id} onClick={() => startScen(scen)} style={{ background: W, border: "1px solid #e0d9d0", borderRadius: 10, padding: 16, cursor: "pointer" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ fontFamily: F.sans, fontSize: 13, fontWeight: 700, color: BURG }}>{scen.label}</div>
                <span style={{ background: diffColor(scen.difficulty) + "22", color: diffColor(scen.difficulty), fontFamily: F.sans, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99, textTransform: "uppercase" }}>{scen.difficulty}</span>
              </div>
              <div style={{ fontFamily: F.sans, fontSize: 12, color: "#777", lineHeight: 1.5 }}>
                {scen.customerMsg.length > 80 ? scen.customerMsg.slice(0, 80) + "..." : scen.customerMsg}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 104px)", maxWidth: 700, margin: "0 auto" }}>
      <div style={{ background: W, padding: "12px 16px", borderBottom: "1px solid #e0d9d0", display: "flex", alignItems: "center", gap: 12 }}>
        <button onClick={() => setSelScen(null)} style={{ background: "transparent", border: "none", color: RED, fontSize: 24, cursor: "pointer", padding: 0 }}>{"←"}</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: F.serif, fontSize: 16, fontWeight: 600, color: BURG }}>{selScen.label}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ background: diffColor(selScen.difficulty) + "22", color: diffColor(selScen.difficulty), fontFamily: F.sans, fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 99 }}>{selScen.difficulty}</span>
            <span style={{ fontFamily: F.sans, fontSize: 11, color: "#aaa" }}>{simDone ? "Complete - see feedback below" : "Type your response below"}</span>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        {simMsgs.map((m, i) => {
          const isCust = m.role === "customer";
          return (
            <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", justifyContent: isCust ? "flex-start" : "flex-end" }}>
              {isCust && <div style={{ width: 32, height: 32, borderRadius: "50%", background: RED, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontFamily: F.sans, fontWeight: 700, fontSize: 13, color: W }}>C</div>}
              <div style={{ maxWidth: "75%", background: isCust ? "#fde8e8" : BURG, color: isCust ? "#333" : W, fontFamily: F.sans, fontSize: 14, lineHeight: 1.6, padding: "12px 14px", borderRadius: isCust ? "4px 16px 16px 16px" : "16px 4px 16px 16px" }}>
                {m.content}
              </div>
              {!isCust && <div style={{ width: 32, height: 32, borderRadius: "50%", background: BURG, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontFamily: F.sans, fontWeight: 700, fontSize: 11, color: W }}>ME</div>}
            </div>
          );
        })}
        {simLoading && (
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: RED, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.sans, fontWeight: 700, fontSize: 13, color: W, flexShrink: 0 }}>C</div>
            <div style={{ background: "#fde8e8", borderRadius: "4px 16px 16px 16px", padding: "12px 16px", fontFamily: F.sans, fontSize: 14, color: "#aaa" }}>Typing...</div>
          </div>
        )}
        {simFeedback && (
          <div style={{ background: "#fffbf0", border: "2px solid " + GOLD, borderRadius: 12, padding: 20, marginTop: 8 }}>
            <div style={{ fontFamily: F.sans, fontSize: 11, fontWeight: 700, color: GOLD, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Coach Feedback</div>
            <div style={{ fontFamily: F.sans, fontSize: 14, color: "#444", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{simFeedback}</div>
            <button onClick={() => setSelScen(null)} style={{ background: BURG, color: W, fontFamily: F.sans, fontWeight: 700, fontSize: 13, padding: "10px 24px", border: "none", borderRadius: 6, cursor: "pointer", marginTop: 14 }}>Try Another Scenario</button>
          </div>
        )}
        <div ref={simEndRef} />
      </div>

      {!simDone && (
        <div style={{ background: W, borderTop: "1px solid #e0d9d0", padding: "12px 16px", display: "flex", gap: 10 }}>
          <input
            value={simInput}
            onChange={e => setSimInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendSim(); } }}
            placeholder="Type your customer service response..."
            style={{ flex: 1, fontFamily: F.sans, fontSize: 14, padding: "10px 14px", border: "1px solid #ddd", borderRadius: 8, outline: "none" }}
          />
          <button onClick={sendSim} disabled={simLoading || !simInput.trim()} style={{ background: simLoading || !simInput.trim() ? "#ccc" : RED, color: W, fontFamily: F.sans, fontWeight: 700, fontSize: 13, padding: "10px 20px", border: "none", borderRadius: 8, cursor: simLoading || !simInput.trim() ? "default" : "pointer" }}>Reply</button>
        </div>
      )}
    </div>
  );
}

// ─── COMPARE TAB ──────────────────────────────────────────────────────────────
function CompareMatrix({ showDiscontinued = true }) {
  const allHeaders = [
    { label: "Essentials PRO",      disc: false, key: "essPro" },
    { label: "Longevity Powder",    disc: false, key: "longevity" },
    { label: "Original Essentials", disc: true,  key: "origEss" },
    { label: "Longevity Capsule",   disc: true,  key: "longevityCap" },
  ];
  const headers = showDiscontinued ? allHeaders : allHeaders.filter(h => !h.disc);

  return (
    <div>
      <div style={{ fontFamily: F.sans, fontSize: 12, color: "#aaa", textAlign: "center", marginBottom: 16 }}>
        <span style={{ color: GOLD, fontWeight: 700 }}>Gold</span>{" = exclusive to PRO   "}
        <span style={{ color: RED, fontWeight: 700 }}>Red</span>{" = increased vs original   "}
        <span style={{ color: "#2a7a2a", fontWeight: 700 }}>Green</span>{" = confirmed"}
        {showDiscontinued && "   Faded = discontinued"}
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ minWidth: 480, width: "100%", borderCollapse: "collapse", background: W, borderRadius: 10, overflow: "hidden", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
          <thead>
            <tr>
              <th style={{ padding: "14px 16px", textAlign: "left", fontFamily: F.sans, fontSize: 12, color: "#999", fontWeight: 600, borderBottom: "2px solid #f0ebe5", background: CREAM, width: 140 }}>Feature</th>
              {headers.map((h, i) => (
                <th key={i} style={{ padding: "14px 12px", textAlign: "center", fontFamily: F.sans, fontSize: 12, fontWeight: 700, borderBottom: "2px solid #f0ebe5", background: h.disc ? "#e8e0d8" : BURG, color: h.disc ? "#999" : W, minWidth: 120 }}>
                  {h.label}
                  {h.disc && <div style={{ fontSize: 9, fontWeight: 400, color: "#bbb", textTransform: "uppercase", letterSpacing: 1, marginTop: 2 }}>Discontinued</div>}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COMPARE_ROWS.map((row, ri) => (
              <tr key={ri} style={{ background: ri % 2 === 0 ? W : "#fdfbf9" }}>
                <td style={{ padding: "10px 16px", fontFamily: F.sans, fontSize: 12, fontWeight: 600, color: "#777", borderBottom: "1px solid #f5f0eb" }}>{row.label}</td>
                {headers.map((h, ci) => (
                  <td key={ci} style={{ textAlign: "center", borderBottom: "1px solid #f5f0eb", ...cellStyle(row[h.key], h.disc) }}>{row[h.key]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CompareTab() {
  return (
    <div style={{ padding: "20px 16px 40px", maxWidth: 900, margin: "0 auto" }}>
      <div style={{ fontFamily: F.sans, fontSize: 11, color: "#999", textTransform: "uppercase", letterSpacing: 2, marginBottom: 14, textAlign: "center" }}>Product Comparison</div>
      <CompareMatrix showDiscontinued={true} />
    </div>
  );
}

// ─── PROGRESS TAB ─────────────────────────────────────────────────────────────
function ProgressTab({ totalScore, completed, sessionScores, setTab, setSelMod }) {
  const totalMods = MODULES.length;
  const overallPct = totalMods > 0 ? Math.round((completed.length / totalMods) * 100) : 0;

  function pctColor(pct) {
    if (pct >= 80) return GOLD;
    if (pct >= 60) return RED;
    return "#bbb";
  }

  const focusAreas = MODULES.filter(mod => {
    if (!completed.includes(mod.id)) return false;
    const s = sessionScores[mod.id] || 0;
    return Math.round((s / mod.questions.length) * 100) < 80;
  });

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "24px 16px 40px" }}>
      {/* Total score */}
      <div style={{ background: W, borderRadius: 12, padding: 28, textAlign: "center", border: "1px solid #e0d9d0", marginBottom: 20 }}>
        <div style={{ fontFamily: F.sans, fontSize: 11, color: "#aaa", textTransform: "uppercase", letterSpacing: 2, marginBottom: 6 }}>Total Score</div>
        <div style={{ fontFamily: F.serif, fontSize: 56, fontWeight: 700, color: GOLD, lineHeight: 1 }}>{totalScore}</div>
        <div style={{ fontFamily: F.sans, fontSize: 13, color: "#aaa", marginTop: 4 }}>{completed.length} of {totalMods} modules complete</div>
        <div style={{ background: "#f0ebe5", borderRadius: 99, height: 8, marginTop: 16 }}>
          <div style={{ background: "linear-gradient(90deg," + RED + "," + GOLD + ")", width: overallPct + "%", height: "100%", borderRadius: 99, transition: "width 0.5s" }} />
        </div>
        <div style={{ fontFamily: F.sans, fontSize: 12, color: "#aaa", marginTop: 6 }}>{overallPct}% complete</div>
      </div>

      {/* Per-day breakdown */}
      {[1,2,3,4,5].map(day => {
        const dayMods = MODULES.filter(m => m.day === day);
        if (!dayMods.length) return null;
        return (
          <div key={day} style={{ marginBottom: 20 }}>
            <div style={{ fontFamily: F.sans, fontSize: 11, color: "#999", textTransform: "uppercase", letterSpacing: 2, marginBottom: 10 }}>{"Day " + day}</div>
            {dayMods.map(mod => {
              const score = sessionScores[mod.id];
              const done  = completed.includes(mod.id);
              const pct   = done && score !== undefined ? Math.round((score / mod.questions.length) * 100) : null;
              return (
                <div key={mod.id} style={{ background: W, border: "1px solid #e0d9d0", borderRadius: 10, padding: "14px 16px", marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: done ? 8 : 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
                      <div style={{ fontFamily: F.serif, fontSize: 14, fontWeight: 600, color: BURG }}>{mod.title}</div>
                      {mod.critical && <span style={{ background: RED, color: W, fontFamily: F.sans, fontSize: 9, fontWeight: 700, padding: "1px 6px", borderRadius: 3, textTransform: "uppercase" }}>Critical</span>}
                    </div>
                    {done && pct !== null ? (
                      <div style={{ fontFamily: F.sans, fontSize: 13, fontWeight: 700, color: pctColor(pct) }}>{score}/{mod.questions.length} ({pct}%)</div>
                    ) : (
                      <div style={{ fontFamily: F.sans, fontSize: 12, color: "#ccc" }}>not started</div>
                    )}
                  </div>
                  {done && pct !== null && (
                    <div style={{ background: "#f0ebe5", borderRadius: 99, height: 5 }}>
                      <div style={{ background: pctColor(pct), width: pct + "%", height: "100%", borderRadius: 99, transition: "width 0.5s" }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}

      {/* Focus areas */}
      {focusAreas.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontFamily: F.sans, fontSize: 11, color: RED, textTransform: "uppercase", letterSpacing: 2, marginBottom: 12, fontWeight: 700 }}>Focus Areas</div>
          {focusAreas.map(mod => {
            const score = sessionScores[mod.id] || 0;
            const pct   = Math.round((score / mod.questions.length) * 100);
            const modIdx = MODULES.findIndex(m => m.id === mod.id);
            return (
              <div key={mod.id} style={{ background: "#fff8f8", border: "1px solid rgba(164,0,17,0.25)", borderRadius: 10, padding: "14px 16px", marginBottom: 10, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontFamily: F.serif, fontSize: 14, fontWeight: 600, color: BURG }}>{mod.title}</div>
                  <div style={{ fontFamily: F.sans, fontSize: 12, color: RED }}>{pct}% - needs improvement</div>
                </div>
                <button
                  onClick={() => { setTab("Quiz"); setTimeout(() => setSelMod(modIdx), 50); }}
                  style={{ background: RED, color: W, fontFamily: F.sans, fontWeight: 700, fontSize: 12, padding: "8px 16px", border: "none", borderRadius: 6, cursor: "pointer" }}
                >Retry</button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── SpotBlock ────────────────────────────────────────────────────────────────
function SpotBlock({ label, ticket, problems, fixed }) {
  const [revealed, setRevealed] = useState(false);
  return (
    <div style={{ border: "2px solid #e0d8d0", borderRadius: 10, overflow: "hidden", marginBottom: 18 }}>
      <div style={{ background: "rgba(164,0,17,0.06)", padding: "10px 14px", borderBottom: "1px solid #e0d8d0", display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontFamily: F.sans, fontSize: 11, fontWeight: 800, color: RED, textTransform: "uppercase", letterSpacing: 1.5 }}>🔍 {label || "Spot the Problem"}</span>
      </div>
      <div style={{ padding: "12px 14px", background: "#fff8f8", borderBottom: "1px solid #f0e0e0" }}>
        <div style={{ fontFamily: F.sans, fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Agent Response — What's Wrong Here?</div>
        <div style={{ fontFamily: F.sans, fontSize: 13, color: "#555", lineHeight: 1.7, fontStyle: "italic" }}>"{ticket}"</div>
      </div>
      {!revealed ? (
        <div style={{ padding: "12px 14px" }}>
          <button onClick={() => setRevealed(true)} style={{ background: RED, color: "#fff", fontFamily: F.sans, fontWeight: 700, fontSize: 13, padding: "10px 22px", border: "none", borderRadius: 7, cursor: "pointer" }}>Reveal Problems</button>
        </div>
      ) : (
        <div style={{ padding: "12px 14px" }}>
          <div style={{ fontFamily: F.sans, fontSize: 11, fontWeight: 700, color: RED, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Problems Found</div>
          <ul style={{ margin: "0 0 14px 0", paddingLeft: 18 }}>
            {problems.map((p, i) => <li key={i} style={{ fontFamily: F.sans, fontSize: 13, color: "#5a0008", lineHeight: 1.65, marginBottom: 5 }}>{p}</li>)}
          </ul>
          <div style={{ background: "#f0fff4", border: "1px solid rgba(42,122,42,0.3)", borderRadius: 7, padding: "10px 13px" }}>
            <div style={{ fontFamily: F.sans, fontSize: 11, fontWeight: 700, color: "#2a7a2a", textTransform: "uppercase", letterSpacing: 1, marginBottom: 5 }}>Better Version</div>
            <div style={{ fontFamily: F.sans, fontSize: 13, color: "#1a4a1a", lineHeight: 1.7 }}>"{fixed}"</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── ScorecardBlock ───────────────────────────────────────────────────────────
function ScorecardBlock({ context, ticket, scores, total, fixed }) {
  const [showFixed, setShowFixed] = useState(false);
  const scoreColor = s => s >= 4 ? "#2a7a2a" : s === 3 ? "#7a5e00" : "#a40011";
  const scoreBg    = s => s >= 4 ? "#f0fff4" : s === 3 ? "#fffbea" : "#fff0f0";
  const verdict = total >= 20 ? "Passes — but only just." : total >= 14 ? "Needs Coaching" : "Unacceptable";
  const verdictColor = total >= 20 ? "#2a7a2a" : total >= 14 ? "#7a5e00" : "#a40011";
  return (
    <div style={{ border: "2px solid #d0c8c0", borderRadius: 10, overflow: "hidden", marginBottom: 18 }}>
      <div style={{ background: BURG, padding: "10px 14px" }}>
        <div style={{ fontFamily: F.sans, fontSize: 11, fontWeight: 800, color: GOLD, textTransform: "uppercase", letterSpacing: 1.5 }}>📋 Live QC Scoring — Work Through This</div>
      </div>
      {context && <div style={{ padding: "8px 14px", background: "#f5f0eb", borderBottom: "1px solid #e0d8d0", fontFamily: F.sans, fontSize: 12, color: "#666" }}><strong>Situation:</strong> {context}</div>}
      <div style={{ padding: "10px 14px", background: "#fff8f8", borderBottom: "1px solid #f0e0e0" }}>
        <div style={{ fontFamily: F.sans, fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Agent Response Sent</div>
        <div style={{ fontFamily: F.sans, fontSize: 13, color: "#555", lineHeight: 1.7, fontStyle: "italic" }}>"{ticket}"</div>
      </div>
      <div style={{ padding: "10px 14px" }}>
        <div style={{ fontFamily: F.sans, fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Category Scores</div>
        {scores.map((s, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "140px 48px 1fr", gap: 8, marginBottom: 8, alignItems: "start" }}>
            <div style={{ fontFamily: F.sans, fontSize: 12, fontWeight: 700, color: BURG }}>{s.cat}</div>
            <div style={{ background: scoreBg(s.score), border: "1px solid " + scoreColor(s.score), borderRadius: 5, padding: "2px 0", textAlign: "center", fontFamily: F.sans, fontSize: 13, fontWeight: 700, color: scoreColor(s.score) }}>{s.score}/5</div>
            <div style={{ fontFamily: F.sans, fontSize: 12, color: "#555", lineHeight: 1.5 }}>{s.why}</div>
          </div>
        ))}
        <div style={{ marginTop: 12, paddingTop: 10, borderTop: "2px solid #e0d8d0", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ fontFamily: F.serif, fontSize: 28, fontWeight: 700, color: verdictColor }}>{total}<span style={{ fontSize: 14, fontWeight: 400, color: "#888" }}>/25</span></div>
          <div>
            <div style={{ fontFamily: F.sans, fontSize: 13, fontWeight: 700, color: verdictColor }}>{verdict}</div>
            <div style={{ fontFamily: F.sans, fontSize: 11, color: "#888" }}>Target is 20+. This response would require immediate coaching.</div>
          </div>
        </div>
        {!showFixed ? (
          <button onClick={() => setShowFixed(true)} style={{ marginTop: 12, background: "#2a7a2a", color: "#fff", fontFamily: F.sans, fontWeight: 700, fontSize: 13, padding: "10px 22px", border: "none", borderRadius: 7, cursor: "pointer" }}>Show 20+ Response</button>
        ) : (
          <div style={{ marginTop: 12, background: "#f0fff4", border: "1px solid rgba(42,122,42,0.3)", borderRadius: 7, padding: "12px 14px" }}>
            <div style={{ fontFamily: F.sans, fontSize: 11, fontWeight: 700, color: "#2a7a2a", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>What a 22+/25 Looks Like</div>
            <div style={{ fontFamily: F.sans, fontSize: 13, color: "#1a4a1a", lineHeight: 1.75 }}>"{fixed}"</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── ResultsTreeBlock ─────────────────────────────────────────────────────────
function ResultsTreeBlock() {
  const [step, setStep] = useState(0);
  const [days, setDays] = useState(null);
  const [tone, setTone] = useState(null);
  const reset = () => { setStep(0); setDays(null); setTone(null); };
  const Btn = ({ label, onClick, color }) => (
    <button onClick={onClick} style={{ background: color || BURG, color: "#fff", fontFamily: F.sans, fontWeight: 700, fontSize: 13, padding: "10px 18px", border: "none", borderRadius: 7, cursor: "pointer", flex: 1 }}>{label}</button>
  );
  const results = {
    sub90_soft: {
      action: "Educate & One Save Attempt",
      color: "#2a7a2a", bg: "#f0fff4",
      steps: ["Educate on the 90-day clinical curve — this is how the trial was designed to work", "Normalise: 'Most customers report the biggest changes between weeks 8-12'", "Ask about consistency: 'How consistent has your daily routine been?'", "One save attempt — frame the 90 days as an investment not yet complete", "If they insist: cancel politely. Never push twice."],
      never: "Never promise specific outcomes or results timelines."
    },
    sub90_firm: {
      action: "One Attempt, Then Cancel Gracefully",
      color: "#7a5e00", bg: "#fffbea",
      steps: ["Acknowledge their experience without arguing", "One short save attempt: '90 days is the clinical window — you are X days away from the full picture'", "If they still want to cancel: process it immediately and politely", "Do NOT guilt-trip or push a second time"],
      never: "Never argue the timeline with a firm customer — it damages trust and generates chargebacks."
    },
    over90_any: {
      action: "Validate, Escalate to CS Lead, Cancel if Insisted",
      color: "#a40011", bg: "#fff0f0",
      steps: ["Validate that they gave IM8 a real, full trial — acknowledge this genuinely", "Escalate to CS Lead before processing anything", "CS Lead may probe routine, offer a different approach, or check in on health goals", "If the customer insists after that: cancel with full empathy and no pushback", "Tag as 'over-90-results' churn for product feedback"],
      never: "Never cancel an over-90 results ticket without escalating to CS Lead first."
    }
  };
  const resultKey = days === "over90" ? "over90_any" : tone === "soft" ? "sub90_soft" : "sub90_firm";
  const result = (days && (days === "over90" || tone)) ? results[resultKey] : null;
  return (
    <div style={{ border: "2px solid #d0c8c0", borderRadius: 10, overflow: "hidden", marginBottom: 18 }}>
      <div style={{ background: BURG, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontFamily: F.sans, fontSize: 11, fontWeight: 800, color: GOLD, textTransform: "uppercase", letterSpacing: 1.5 }}>🌳 Results Decision Tree — Click Through It</div>
        {(days || tone) && <button onClick={reset} style={{ background: "rgba(255,255,255,0.15)", color: "#fff", fontFamily: F.sans, fontSize: 11, fontWeight: 700, padding: "4px 10px", border: "none", borderRadius: 5, cursor: "pointer" }}>Reset</button>}
      </div>
      <div style={{ padding: "14px" }}>
        {/* Step 1 */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontFamily: F.sans, fontSize: 12, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Step 1 — How long has the customer been taking IM8?</div>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn label="Under 90 days" color={days === "sub90" ? RED : BURG} onClick={() => { setDays("sub90"); setTone(null); }} />
            <Btn label="90+ days (or unknown)" color={days === "over90" ? RED : BURG} onClick={() => { setDays("over90"); setTone(null); }} />
          </div>
        </div>
        {/* Step 2 — only if sub90 */}
        {days === "sub90" && (
          <div style={{ marginBottom: 12, paddingLeft: 14, borderLeft: "3px solid " + RED }}>
            <div style={{ fontFamily: F.sans, fontSize: 12, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>Step 2 — What is their tone?</div>
            <div style={{ display: "flex", gap: 8 }}>
              <Btn label={"Soft / Exploring\n\"Not sure it's working...\""} color={tone === "soft" ? "#2a7a2a" : "#666"} onClick={() => setTone("soft")} />
              <Btn label={"Firm / Decided\n\"I want to cancel\""} color={tone === "firm" ? "#a40011" : "#666"} onClick={() => setTone("firm")} />
            </div>
          </div>
        )}
        {/* Result */}
        {result && (
          <div style={{ background: result.bg, border: "2px solid " + result.color, borderRadius: 8, padding: "14px" }}>
            <div style={{ fontFamily: F.sans, fontSize: 12, fontWeight: 800, color: result.color, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>→ {result.action}</div>
            <ul style={{ margin: "0 0 10px 0", paddingLeft: 18 }}>
              {result.steps.map((s, i) => <li key={i} style={{ fontFamily: F.sans, fontSize: 13, color: "#333", lineHeight: 1.65, marginBottom: 4 }}>{s}</li>)}
            </ul>
            <div style={{ fontFamily: F.sans, fontSize: 12, color: result.color, fontWeight: 700, background: "rgba(0,0,0,0.05)", borderRadius: 5, padding: "7px 10px" }}>⚠ {result.never}</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── BootcampTab ──────────────────────────────────────────────────────────────
function BootcampTab({ bcProgress, saveBcProgress, bcView, setBcView, bcDay, setBcDay, bcLesson, setBcLesson, bcQIdx, setBcQIdx, bcChosen, setBcChosen, bcAnswers, setBcAnswers, bcWriteInput, setBcWriteInput, bcWriteFeedback, bcWriteLoading, bcWriteDone, setBcWriteDone, setBcWriteFeedback, submitWritingExercise, playerName }) {

  const [expandedScenarios, setExpandedScenarios] = useState({});

  function isDayUnlocked(d) {
    if (d === 1) return true;
    return !!(bcProgress[d - 1] && bcProgress[d - 1].passed);
  }
  function isLessonDone(d, l) { return !!(bcProgress[d] && bcProgress[d].lessons && bcProgress[d].lessons[l]); }
  function allLessonsDone(d) { return BOOTCAMP_DAYS[d - 1].lessons.every((_, i) => isLessonDone(d, i)); }
  function isQuizDone(d) { return bcProgress[d] && bcProgress[d].quizScore !== undefined; }
  function isDayPassed(d) { return !!(bcProgress[d] && bcProgress[d].passed); }
  function allDaysPassed() { return BOOTCAMP_DAYS.every(day => isDayPassed(day.day)); }

  function dayCompletionPct(d) {
    const day = BOOTCAMP_DAYS[d - 1];
    const lessonsDone = day.lessons.filter((_, i) => isLessonDone(d, i)).length;
    const total = day.lessons.length + 1 + (day.writing ? 1 : 0);
    const done  = lessonsDone + (isQuizDone(d) ? 1 : 0) + ((bcProgress[d] && bcProgress[d].writingDone) ? 1 : 0);
    return Math.round((done / total) * 100);
  }

  function completeLesson(d, l) {
    const updated = { ...bcProgress, [d]: { ...(bcProgress[d] || {}), lessons: { ...(bcProgress[d]?.lessons || {}), [l]: true } } };
    saveBcProgress(updated);
  }

  function handleBcCheckAnswer(i, questions) {
    if (bcChosen !== null) return;
    setBcChosen(i);
    setBcAnswers(prev => [...prev, { chosen: i, correct: questions[bcQIdx].correct }]);
  }

  function handleBcNext(questions, onFinish) {
    if (bcQIdx + 1 < questions.length) { setBcQIdx(q => q + 1); setBcChosen(null); }
    else { setBcQIdx(0); setBcChosen(null); setBcAnswers([]); onFinish(); }
  }

  function finishCheck(d, l) {
    completeLesson(d, l);
    setBcView("day");
  }

  function finishDayQuiz(d, score, total) {
    const passed = score / total >= BC_PASS;
    const updated = { ...bcProgress, [d]: { ...(bcProgress[d] || {}), quizScore: score, quizTotal: total, passed } };
    saveBcProgress(updated);
    setBcView("quiz-result");
  }

  function renderContentBlock(block, idx) {
    if (block.t === "h")  return <div key={idx} style={{ fontFamily: F.serif, fontSize: 17, fontWeight: 600, color: BURG, marginTop: 20, marginBottom: 6 }}>{block.v}</div>;
    if (block.t === "p")  return <div key={idx} style={{ fontFamily: F.sans, fontSize: 14, color: "#333", lineHeight: 1.7, marginBottom: 10 }}>{block.v}</div>;
    if (block.t === "rule") return <div key={idx} style={{ background: "rgba(164,0,17,0.07)", border: "1px solid rgba(164,0,17,0.25)", borderLeft: "4px solid " + RED, borderRadius: 6, padding: "12px 14px", marginBottom: 12 }}><div style={{ fontFamily: F.sans, fontSize: 13, color: BURG, lineHeight: 1.6 }}>{block.v}</div></div>;
    if (block.t === "warn") return <div key={idx} style={{ background: "#fff3cd", border: "1px solid #e6a817", borderLeft: "4px solid #e6a817", borderRadius: 6, padding: "12px 14px", marginBottom: 12 }}><div style={{ fontFamily: F.sans, fontSize: 13, color: "#5c3d00", lineHeight: 1.6 }}>{block.v}</div></div>;
    if (block.t === "list") return <ul key={idx} style={{ margin: "0 0 12px 0", paddingLeft: 20 }}>{block.items.map((it, j) => <li key={j} style={{ fontFamily: F.sans, fontSize: 14, color: "#333", lineHeight: 1.7, marginBottom: 4 }}>{it}</li>)}</ul>;
    if (block.t === "kv")  return <div key={idx} style={{ marginBottom: 14 }}>{block.pairs.map(([k, v], j) => <div key={j} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: "1px solid #f0ebe5" }}><div style={{ fontFamily: F.sans, fontSize: 13, fontWeight: 700, color: BURG, minWidth: 130, flexShrink: 0 }}>{k}</div><div style={{ fontFamily: F.sans, fontSize: 13, color: "#333", lineHeight: 1.5, flex: 1 }}>{v}</div></div>)}</div>;
    if (block.t === "ex")  return <div key={idx} style={{ background: CREAM, border: "1px solid #ddd", borderRadius: 8, overflow: "hidden", marginBottom: 12 }}><div style={{ padding: "10px 14px", background: "#f0e8e0", borderBottom: "1px solid #ddd" }}><span style={{ fontFamily: F.sans, fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: 1 }}>Customer</span><div style={{ fontFamily: F.sans, fontSize: 13, color: "#333", marginTop: 4, lineHeight: 1.5 }}>{block.c}</div></div><div style={{ padding: "10px 14px" }}><span style={{ fontFamily: F.sans, fontSize: 11, fontWeight: 700, color: RED, textTransform: "uppercase", letterSpacing: 1 }}>LUMÉ CX Response</span><div style={{ fontFamily: F.sans, fontSize: 13, color: BURG, marginTop: 4, lineHeight: 1.5 }}>{block.a}</div></div></div>;
    if (block.t === "spot")      return <SpotBlock key={idx} {...block} />;
    if (block.t === "scorecard") return <ScorecardBlock key={idx} {...block} />;
    if (block.t === "flowchart") return <ResultsTreeBlock key={idx} />;
    if (block.t === "compare") return <div key={idx} style={{ marginBottom: 14 }}>{block.pairs.map(([bad, good], j) => <div key={j} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}><div style={{ background: "#fff0f0", border: "1px solid rgba(164,0,17,0.2)", borderRadius: 6, padding: "10px 12px" }}><div style={{ fontFamily: F.sans, fontSize: 10, fontWeight: 700, color: RED, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>{"Do Not Say"}</div><div style={{ fontFamily: F.sans, fontSize: 12, color: "#666", lineHeight: 1.5 }}>{bad}</div></div><div style={{ background: "#f0fff0", border: "1px solid rgba(42,122,42,0.3)", borderRadius: 6, padding: "10px 12px" }}><div style={{ fontFamily: F.sans, fontSize: 10, fontWeight: 700, color: "#2a7a2a", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Say Instead</div><div style={{ fontFamily: F.sans, fontSize: 12, color: "#2a4a2a", lineHeight: 1.5 }}>{good}</div></div></div>)}</div>;
    if (block.t === "video") return <div key={idx} style={{ marginBottom: 20 }}><div style={{ background: BURG, borderRadius: "10px 10px 0 0", padding: "10px 14px", display: "flex", alignItems: "center", gap: 10 }}><div style={{ width: 28, height: 28, background: RED, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 13, color: W }}>{"▶"}</div><div style={{ fontFamily: F.sans, fontSize: 13, fontWeight: 700, color: GOLD }}>{block.label}</div>{block.dur && <div style={{ fontFamily: F.sans, fontSize: 11, color: "rgba(255,255,255,0.5)", marginLeft: "auto" }}>{block.dur}</div>}</div>{block.url ? <video controls style={{ width: "100%", display: "block", borderRadius: "0 0 10px 10px", background: "#000", maxHeight: 340 }}><source src={block.url} type="video/mp4" /></video> : <div style={{ background: "#1a0005", borderRadius: "0 0 10px 10px", padding: "20px 14px", fontFamily: F.sans, fontSize: 12, color: "rgba(255,255,255,0.35)", fontStyle: "italic", textAlign: "center" }}>{"Ask your team leader for the video link"}</div>}</div>;
    if (block.t === "tip") return <div key={idx} style={{ background: "linear-gradient(135deg,rgba(200,151,58,0.13),rgba(200,151,58,0.06))", border: "1px solid rgba(200,151,58,0.45)", borderLeft: "4px solid " + GOLD, borderRadius: 6, padding: "12px 14px", marginBottom: 14 }}><div style={{ fontFamily: F.sans, fontSize: 10, fontWeight: 800, color: GOLD, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 6 }}>{"Pro Tip"}</div><div style={{ fontFamily: F.sans, fontSize: 13, color: "#5a4000", lineHeight: 1.65 }}>{block.v}</div></div>;
    if (block.t === "summary") return <div key={idx} style={{ background: "linear-gradient(135deg,#f0ebe4,#e8ddd4)", border: "1px solid #c4b09a", borderRadius: 10, padding: "16px 18px", marginTop: 24, marginBottom: 4 }}><div style={{ fontFamily: F.sans, fontSize: 10, fontWeight: 800, color: BURG, textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 10 }}>{"Key Takeaways"}</div><ul style={{ margin: 0, paddingLeft: 18 }}>{block.items.map((it, j) => <li key={j} style={{ fontFamily: F.sans, fontSize: 13, color: BURG, lineHeight: 1.7, marginBottom: 4 }}>{it}</li>)}</ul></div>;
    if (block.t === "scenario") {
      const isOpen = !!expandedScenarios[idx];
      return <div key={idx} style={{ border: "2px solid #e0d8d0", borderRadius: 10, overflow: "hidden", marginBottom: 16, background: W }}>
        <div style={{ background: "rgba(80,0,11,0.05)", padding: "10px 14px", borderBottom: "1px solid #ece5dc" }}>
          <div style={{ fontFamily: F.sans, fontSize: 10, fontWeight: 800, color: "#999", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>{"Practice Scenario \u2014 Customer Message"}</div>
          <div style={{ fontFamily: F.sans, fontSize: 14, color: "#333", lineHeight: 1.65, fontStyle: "italic" }}>{"\u201c"}{block.customer}{"\u201d"}</div>
        </div>
        {block.hint && <div style={{ padding: "8px 14px", background: "rgba(200,151,58,0.07)", borderBottom: "1px solid rgba(200,151,58,0.2)" }}><div style={{ fontFamily: F.sans, fontSize: 12, color: "#7a5e10" }}>{"Hint: "}{block.hint}</div></div>}
        {!isOpen
          ? <button onClick={() => setExpandedScenarios(prev => ({ ...prev, [idx]: true }))} style={{ display: "block", width: "100%", background: "none", border: "none", padding: "12px 14px", cursor: "pointer", fontFamily: F.sans, fontSize: 13, fontWeight: 700, color: RED, textAlign: "left" }}>{"Show ideal response \u2192"}</button>
          : <div style={{ padding: "14px" }}>
              <div style={{ fontFamily: F.sans, fontSize: 10, fontWeight: 800, color: "#2a7a2a", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>{"Ideal Response"}</div>
              <div style={{ fontFamily: F.sans, fontSize: 13, color: "#1a4a1a", lineHeight: 1.7, background: "#f0fff4", border: "1px solid rgba(42,122,42,0.25)", borderRadius: 6, padding: "12px 14px" }}>{block.response}</div>
            </div>
        }
      </div>;
    }
    return null;
  }

  // ── GRADUATION ────────────────────────────────────────────────────────────
  if (bcView === "graduation") {
    const totalPts = BOOTCAMP_DAYS.reduce((sum, day) => sum + (bcProgress[day.day]?.quizScore || 0), 0);
    const totalPoss = BOOTCAMP_DAYS.reduce((sum, day) => sum + day.quiz.length, 0);
    return (
      <div style={{ minHeight: "100vh", background: HEADER_GRAD, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, textAlign: "center" }}>
        <div style={{ fontFamily: F.sans, fontSize: 48, marginBottom: 8 }}>{"🎓"}</div>
        <div style={{ fontFamily: F.serif, fontSize: 28, color: GOLD, fontWeight: 600, marginBottom: 8 }}>Training Complete</div>
        {playerName && <div style={{ fontFamily: F.serif, fontSize: 22, color: W, marginBottom: 6 }}>{playerName}</div>}
        <div style={{ fontFamily: F.sans, fontSize: 14, color: "rgba(255,255,255,0.7)", marginBottom: 24 }}>has successfully completed the IM8 CS Agent 5-Day Bootcamp</div>
        <div style={{ background: "rgba(200,151,58,0.15)", border: "2px solid " + GOLD, borderRadius: 12, padding: "20px 40px", marginBottom: 28 }}>
          <div style={{ fontFamily: F.sans, fontSize: 12, color: GOLD, textTransform: "uppercase", letterSpacing: 2, marginBottom: 8 }}>Total Quiz Score</div>
          <div style={{ fontFamily: F.serif, fontSize: 40, color: GOLD, fontWeight: 700 }}>{totalPts} / {totalPoss}</div>
          <div style={{ fontFamily: F.sans, fontSize: 14, color: "rgba(255,255,255,0.7)", marginTop: 6 }}>{Math.round((totalPts / totalPoss) * 100)}{"% overall accuracy"}</div>
        </div>
        {BOOTCAMP_DAYS.map(day => (
          <div key={day.day} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <div style={{ fontFamily: F.sans, fontSize: 12, color: "#2a7a2a", fontWeight: 700 }}>{"✓"}</div>
            <div style={{ fontFamily: F.sans, fontSize: 13, color: "rgba(255,255,255,0.8)" }}>Day {day.day}: {day.title}</div>
            <div style={{ fontFamily: F.sans, fontSize: 12, color: GOLD }}>{bcProgress[day.day]?.quizScore || 0}/{day.quiz.length}</div>
          </div>
        ))}
        <div style={{ marginTop: 28, fontFamily: F.serif, fontSize: 16, color: "rgba(255,255,255,0.7)", fontStyle: "italic" }}>You represent IM8 in every interaction.</div>
        <button onClick={() => setBcView("overview")} style={{ marginTop: 24, background: "transparent", border: "1px solid rgba(255,255,255,0.4)", color: "rgba(255,255,255,0.7)", fontFamily: F.sans, fontSize: 13, padding: "10px 24px", borderRadius: 8, cursor: "pointer" }}>Back to Bootcamp</button>
      </div>
    );
  }

  // ── OVERVIEW ──────────────────────────────────────────────────────────────
  if (bcView === "overview") {
    return (
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "24px 20px" }}>
        <div style={{ fontFamily: F.sans, fontSize: 11, color: RED, textTransform: "uppercase", letterSpacing: 2, fontWeight: 700, marginBottom: 4 }}>5-Day Program</div>
        <div style={{ fontFamily: F.serif, fontSize: 24, color: BURG, fontWeight: 600, marginBottom: 4 }}>CS Agent Bootcamp</div>
        <div style={{ fontFamily: F.sans, fontSize: 14, color: "#666", marginBottom: 24 }}>Complete each day in order. Pass the day quiz to unlock the next day. Minimum 75% to pass.</div>
        {allDaysPassed() && (
          <div style={{ background: "linear-gradient(135deg,#A40011,#50000B)", borderRadius: 12, padding: "16px 20px", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div><div style={{ fontFamily: F.serif, fontSize: 16, color: GOLD, fontWeight: 600 }}>All 5 Days Complete!</div><div style={{ fontFamily: F.sans, fontSize: 13, color: "rgba(255,255,255,0.7)", marginTop: 2 }}>View your graduation certificate</div></div>
            <button onClick={() => setBcView("graduation")} style={{ background: GOLD, color: BURG, fontFamily: F.sans, fontWeight: 700, fontSize: 13, padding: "10px 20px", border: "none", borderRadius: 8, cursor: "pointer" }}>Graduate</button>
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {BOOTCAMP_DAYS.map(day => {
            const unlocked = isDayUnlocked(day.day);
            const pct = dayCompletionPct(day.day);
            const passed = isDayPassed(day.day);
            return (
              <div key={day.day} onClick={() => { if (!unlocked) return; setBcDay(day.day); setBcView("day"); }} style={{ background: W, border: "1px solid " + (passed ? "#2a7a2a" : unlocked ? "#ddd" : "#eee"), borderRadius: 12, padding: "18px 20px", cursor: unlocked ? "pointer" : "not-allowed", opacity: unlocked ? 1 : 0.6, position: "relative", overflow: "hidden" }}>
                {passed && <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: 4, background: "#2a7a2a" }} />}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                      <div style={{ fontFamily: F.sans, fontSize: 11, color: unlocked ? RED : "#aaa", textTransform: "uppercase", letterSpacing: 2, fontWeight: 700 }}>Day {day.day}</div>
                      {passed && <div style={{ fontFamily: F.sans, fontSize: 10, color: "#2a7a2a", fontWeight: 700, background: "#e8f5e8", padding: "2px 8px", borderRadius: 99 }}>COMPLETE</div>}
                      {!unlocked && <div style={{ fontFamily: F.sans, fontSize: 10, color: "#aaa", fontWeight: 700, background: "#f5f5f5", padding: "2px 8px", borderRadius: 99 }}>LOCKED</div>}
                    </div>
                    <div style={{ fontFamily: F.serif, fontSize: 16, fontWeight: 600, color: BURG, marginBottom: 2 }}>{day.title}</div>
                    <div style={{ fontFamily: F.sans, fontSize: 13, color: "#666", marginBottom: 8 }}>{day.subtitle}</div>
                    <div style={{ display: "flex", gap: 16 }}>
                      <div style={{ fontFamily: F.sans, fontSize: 12, color: "#888" }}>{day.lessons.length} lessons</div>
                      <div style={{ fontFamily: F.sans, fontSize: 12, color: "#888" }}>{day.duration}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    {unlocked && <div style={{ fontFamily: F.serif, fontSize: 20, color: pct === 100 ? "#2a7a2a" : GOLD, fontWeight: 700 }}>{pct}{"%"}</div>}
                    {!unlocked && <div style={{ fontSize: 20 }}>{"🔒"}</div>}
                  </div>
                </div>
                {unlocked && pct > 0 && (
                  <div style={{ background: "#f0ebe5", borderRadius: 99, height: 4, marginTop: 12 }}>
                    <div style={{ background: passed ? "#2a7a2a" : GOLD, width: pct + "%", height: "100%", borderRadius: 99, transition: "width 0.5s" }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── DAY VIEW ──────────────────────────────────────────────────────────────
  if (bcView === "day") {
    const day = BOOTCAMP_DAYS[bcDay - 1];
    const quizAvail = allLessonsDone(bcDay);
    const writingAvail = day.writing && isQuizDone(bcDay);
    return (
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "24px 20px" }}>
        <button onClick={() => setBcView("overview")} style={{ fontFamily: F.sans, fontSize: 13, color: RED, background: "none", border: "none", cursor: "pointer", marginBottom: 16, padding: 0 }}>{"← Back to Bootcamp"}</button>
        <div style={{ fontFamily: F.sans, fontSize: 11, color: RED, textTransform: "uppercase", letterSpacing: 2, fontWeight: 700, marginBottom: 2 }}>Day {bcDay}</div>
        <div style={{ fontFamily: F.serif, fontSize: 22, color: BURG, fontWeight: 600, marginBottom: 4 }}>{day.title}</div>
        <div style={{ fontFamily: F.sans, fontSize: 14, color: "#666", marginBottom: 20 }}>{day.subtitle}</div>

        <div style={{ fontFamily: F.sans, fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: 2, fontWeight: 700, marginBottom: 10 }}>Lessons</div>
        {day.lessons.map((lesson, i) => {
          const done = isLessonDone(bcDay, i);
          return (
            <div key={lesson.id} onClick={() => { setBcLesson(i); setBcQIdx(0); setBcChosen(null); setBcAnswers([]); setBcView("lesson"); }} style={{ background: W, border: "1px solid " + (done ? "#2a7a2a" : "#ddd"), borderRadius: 10, padding: "14px 16px", marginBottom: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontFamily: F.sans, fontSize: 11, color: done ? "#2a7a2a" : RED, textTransform: "uppercase", letterSpacing: 1, fontWeight: 700, marginBottom: 2 }}>{"Lesson " + (i + 1)}</div>
                <div style={{ fontFamily: F.serif, fontSize: 15, fontWeight: 600, color: BURG }}>{lesson.title}</div>
              </div>
              <div style={{ fontFamily: F.sans, fontSize: 18, color: done ? "#2a7a2a" : "#ccc" }}>{done ? "✓" : "→"}</div>
            </div>
          );
        })}

        <div style={{ fontFamily: F.sans, fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: 2, fontWeight: 700, marginTop: 20, marginBottom: 10 }}>Assessment</div>
        <div onClick={() => { if (!quizAvail) return; setBcQIdx(0); setBcChosen(null); setBcAnswers([]); setBcView(isQuizDone(bcDay) ? "quiz-result" : "quiz"); }} style={{ background: quizAvail ? W : "#f9f9f9", border: "1px solid " + (isQuizDone(bcDay) ? "#2a7a2a" : quizAvail ? "#ddd" : "#eee"), borderRadius: 10, padding: "14px 16px", marginBottom: 10, cursor: quizAvail ? "pointer" : "not-allowed", opacity: quizAvail ? 1 : 0.5, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontFamily: F.sans, fontSize: 11, color: isQuizDone(bcDay) ? "#2a7a2a" : quizAvail ? RED : "#aaa", textTransform: "uppercase", letterSpacing: 1, fontWeight: 700, marginBottom: 2 }}>Day {bcDay} Quiz</div>
            <div style={{ fontFamily: F.serif, fontSize: 15, fontWeight: 600, color: BURG }}>{day.quiz.length} questions {"· "} 75% to pass</div>
            {isQuizDone(bcDay) && <div style={{ fontFamily: F.sans, fontSize: 12, color: "#2a7a2a", marginTop: 2 }}>Score: {bcProgress[bcDay]?.quizScore}/{bcProgress[bcDay]?.quizTotal}</div>}
            {!quizAvail && <div style={{ fontFamily: F.sans, fontSize: 12, color: "#aaa", marginTop: 2 }}>Complete all lessons to unlock</div>}
          </div>
          <div style={{ fontFamily: F.sans, fontSize: 18, color: isQuizDone(bcDay) ? "#2a7a2a" : quizAvail ? GOLD : "#ccc" }}>{isQuizDone(bcDay) ? "✓" : "→"}</div>
        </div>

        {day.writing && (
          <div onClick={() => { if (!writingAvail) return; setBcWriteInput(""); setBcWriteFeedback(""); setBcWriteDone(!!(bcProgress[bcDay]?.writingDone)); setBcView("writing"); }} style={{ background: writingAvail ? W : "#f9f9f9", border: "1px solid " + ((bcProgress[bcDay]?.writingDone) ? "#2a7a2a" : writingAvail ? "#ddd" : "#eee"), borderRadius: 10, padding: "14px 16px", marginBottom: 10, cursor: writingAvail ? "pointer" : "not-allowed", opacity: writingAvail ? 1 : 0.5, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontFamily: F.sans, fontSize: 11, color: (bcProgress[bcDay]?.writingDone) ? "#2a7a2a" : writingAvail ? GOLD : "#aaa", textTransform: "uppercase", letterSpacing: 1, fontWeight: 700, marginBottom: 2 }}>Writing Exercise</div>
              <div style={{ fontFamily: F.serif, fontSize: 15, fontWeight: 600, color: BURG }}>AI-Graded Practice Response</div>
              {!writingAvail && <div style={{ fontFamily: F.sans, fontSize: 12, color: "#aaa", marginTop: 2 }}>Complete the quiz to unlock</div>}
            </div>
            <div style={{ fontFamily: F.sans, fontSize: 18, color: (bcProgress[bcDay]?.writingDone) ? "#2a7a2a" : writingAvail ? GOLD : "#ccc" }}>{(bcProgress[bcDay]?.writingDone) ? "✓" : "→"}</div>
          </div>
        )}
      </div>
    );
  }

  // ── LESSON VIEW ───────────────────────────────────────────────────────────
  if (bcView === "lesson") {
    const day = BOOTCAMP_DAYS[bcDay - 1];
    const lesson = day.lessons[bcLesson];
    return (
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "24px 20px" }}>
        <button onClick={() => setBcView("day")} style={{ fontFamily: F.sans, fontSize: 13, color: RED, background: "none", border: "none", cursor: "pointer", marginBottom: 16, padding: 0 }}>{"← Back to Day " + bcDay}</button>
        <div style={{ fontFamily: F.sans, fontSize: 11, color: RED, textTransform: "uppercase", letterSpacing: 2, fontWeight: 700, marginBottom: 2 }}>{"Day " + bcDay + " · Lesson " + (bcLesson + 1)}</div>
        <div style={{ fontFamily: F.serif, fontSize: 22, color: BURG, fontWeight: 600, marginBottom: 20 }}>{lesson.title}</div>
        <div>{lesson.content.map((block, i) => renderContentBlock(block, i))}</div>
        <button onClick={() => { setBcQIdx(0); setBcChosen(null); setBcAnswers([]); setBcView("check"); }} style={{ background: RED, color: W, fontFamily: F.sans, fontWeight: 700, fontSize: 14, padding: "14px 28px", border: "none", borderRadius: 8, cursor: "pointer", width: "100%", marginTop: 20 }}>Knowledge Check</button>
      </div>
    );
  }

  // ── LESSON CHECK ─────────────────────────────────────────────────────────
  if (bcView === "check") {
    const day = BOOTCAMP_DAYS[bcDay - 1];
    const lesson = day.lessons[bcLesson];
    const questions = lesson.check;
    // Completion screen — triggered when on last Q and answered
    if (bcQIdx === questions.length - 1 && bcChosen !== null) {
      const allAnswers = bcAnswers;
      const finalCorrect = allAnswers.filter(a => a.chosen === a.correct).length;
      const perfect = finalCorrect === questions.length;
      const emoji = perfect ? "\uD83D\uDD25" : finalCorrect >= questions.length - 1 ? "\u2713" : "\uD83D\uDCAA";
      const headline = perfect ? "Perfect score!" : finalCorrect >= questions.length - 1 ? "Well done!" : "Keep going!";
      const nextLesson = day.lessons[bcLesson + 1];
      return (
        <div style={{ maxWidth: 640, margin: "0 auto", padding: "24px 20px" }}>
          <div style={{ textAlign: "center", padding: "28px 20px", background: perfect ? "linear-gradient(135deg,#e8f5e8,#f0fff4)" : "linear-gradient(135deg,#fff8e8,#fffff0)", border: "2px solid " + (perfect ? "#2a7a2a" : GOLD), borderRadius: 14, marginBottom: 24 }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>{emoji}</div>
            <div style={{ fontFamily: F.serif, fontSize: 26, fontWeight: 700, color: perfect ? "#1a5a1a" : "#5a4000", marginBottom: 4 }}>{headline}</div>
            <div style={{ fontFamily: F.serif, fontSize: 40, fontWeight: 700, color: perfect ? "#2a7a2a" : GOLD }}>{finalCorrect} <span style={{ fontSize: 22, fontWeight: 400 }}>/ {questions.length}</span></div>
            <div style={{ fontFamily: F.sans, fontSize: 13, color: perfect ? "#2a7a2a" : "#5a4000", marginTop: 6 }}>{lesson.title}</div>
          </div>
          <div style={{ fontFamily: F.sans, fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: 2, fontWeight: 700, marginBottom: 12 }}>{"Review"}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
            {questions.map((qItem, qi) => {
              const ans = qi < questions.length - 1 ? bcAnswers[qi] : { chosen: bcChosen, correct: qItem.correct };
              const correct = ans && ans.chosen === ans.correct;
              return (
                <div key={qi} style={{ background: correct ? "#f0fff4" : "#fff8f0", border: "1px solid " + (correct ? "rgba(42,122,42,0.3)" : "rgba(200,151,58,0.4)"), borderRadius: 8, padding: "12px 14px" }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <div style={{ fontFamily: F.sans, fontSize: 14, color: correct ? "#2a7a2a" : GOLD, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>{correct ? "\u2713" : "\u2715"}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: F.sans, fontSize: 13, color: "#333", fontWeight: 600, marginBottom: 4 }}>{qItem.q}</div>
                      {!correct && <div style={{ fontFamily: F.sans, fontSize: 12, color: "#5a4000", lineHeight: 1.5 }}>{qItem.exp}</div>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button onClick={() => { completeLesson(bcDay, bcLesson); if (nextLesson) { setBcLesson(bcLesson + 1); setBcQIdx(0); setBcChosen(null); setBcAnswers([]); setBcView("lesson"); } else { setBcView("day"); } }} style={{ background: RED, color: W, fontFamily: F.sans, fontWeight: 700, fontSize: 14, padding: "14px 28px", border: "none", borderRadius: 8, cursor: "pointer", width: "100%" }}>
              {nextLesson ? "Next Lesson: " + nextLesson.title + " \u2192" : "Back to Day " + bcDay + " \u2192"}
            </button>
            <button onClick={() => { completeLesson(bcDay, bcLesson); setBcView("day"); }} style={{ background: "none", border: "1px solid #ddd", color: "#666", fontFamily: F.sans, fontSize: 13, padding: "10px 20px", borderRadius: 8, cursor: "pointer" }}>{"Back to Day Overview"}</button>
          </div>
        </div>
      );
    }
    const q = questions[bcQIdx];
    return (
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "24px 20px" }}>
        <button onClick={() => setBcView("lesson")} style={{ fontFamily: F.sans, fontSize: 13, color: RED, background: "none", border: "none", cursor: "pointer", marginBottom: 16, padding: 0 }}>{"← Back to Lesson"}</button>
        <div style={{ fontFamily: F.sans, fontSize: 11, color: RED, textTransform: "uppercase", letterSpacing: 2, fontWeight: 700, marginBottom: 4 }}>{"Knowledge Check " + (bcQIdx + 1) + " / " + questions.length}</div>
        <div style={{ background: "#f0ebe5", borderRadius: 99, height: 4, marginBottom: 20 }}><div style={{ background: RED, width: (((bcQIdx + 1) / questions.length) * 100) + "%", height: "100%", borderRadius: 99, transition: "width 0.4s" }} /></div>
        <div style={{ fontFamily: F.serif, fontSize: 18, color: BURG, fontWeight: 600, lineHeight: 1.5, marginBottom: 20 }}>{q.q}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {q.options.map((opt, i) => {
            let bg = W, border = "1px solid #ddd", color = BURG;
            if (bcChosen !== null) {
              if (i === q.correct)  { bg = "#e8f5e8"; border = "2px solid #2a7a2a"; color = "#1a5a1a"; }
              else if (i === bcChosen) { bg = "#fde8e8"; border = "2px solid " + RED; color = RED; }
            }
            return <button key={i} onClick={() => handleBcCheckAnswer(i, questions)} style={{ background: bg, border, color, fontFamily: F.sans, fontSize: 14, padding: "14px 16px", borderRadius: 8, textAlign: "left", cursor: bcChosen !== null ? "default" : "pointer", lineHeight: 1.4 }}><span style={{ fontWeight: 700, marginRight: 8 }}>{String.fromCharCode(65 + i) + "."}</span>{opt}</button>;
          })}
        </div>
        {bcChosen !== null && (
          <div style={{ background: bcChosen === q.correct ? "#e8f5e8" : "#fff8e8", border: "1px solid " + (bcChosen === q.correct ? "#2a7a2a" : GOLD), borderRadius: 8, padding: 16, marginTop: 20 }}>
            <div style={{ fontFamily: F.sans, fontSize: 12, fontWeight: 700, color: bcChosen === q.correct ? "#2a7a2a" : GOLD, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>{bcChosen === q.correct ? "Correct!" : "Not quite \u2014 here is why:"}</div>
            <div style={{ fontFamily: F.sans, fontSize: 13, color: "#444", lineHeight: 1.6 }}>{q.exp}</div>
            <button onClick={() => handleBcNext(questions, () => {})} style={{ background: BURG, color: W, fontFamily: F.sans, fontWeight: 700, fontSize: 13, padding: "10px 24px", border: "none", borderRadius: 6, cursor: "pointer", marginTop: 14 }}>
              {bcQIdx + 1 < questions.length ? "Next Question" : "See Results"}
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── DAY QUIZ ──────────────────────────────────────────────────────────────
  if (bcView === "quiz") {
    const day = BOOTCAMP_DAYS[bcDay - 1];
    const questions = day.quiz;
    const q = questions[bcQIdx];
    return (
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "24px 20px" }}>
        <button onClick={() => setBcView("day")} style={{ fontFamily: F.sans, fontSize: 13, color: RED, background: "none", border: "none", cursor: "pointer", marginBottom: 16, padding: 0 }}>{"← Back to Day " + bcDay}</button>
        <div style={{ fontFamily: F.sans, fontSize: 11, color: RED, textTransform: "uppercase", letterSpacing: 2, fontWeight: 700, marginBottom: 4 }}>Day {bcDay} Quiz</div>
        <div style={{ fontFamily: F.serif, fontSize: 20, color: BURG, fontWeight: 600, marginBottom: 4 }}>{day.title}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <div style={{ background: "#f0ebe5", borderRadius: 99, height: 6, flex: 1 }}><div style={{ background: RED, width: (((bcQIdx + 1) / questions.length) * 100) + "%", height: "100%", borderRadius: 99, transition: "width 0.4s" }} /></div>
          <div style={{ fontFamily: F.sans, fontSize: 13, color: "#888", flexShrink: 0 }}>{bcQIdx + 1} / {questions.length}</div>
        </div>
        <div style={{ fontFamily: F.serif, fontSize: 18, color: BURG, fontWeight: 600, lineHeight: 1.5, marginBottom: 20 }}>{q.q}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {q.options.map((opt, i) => {
            let bg = W, border = "1px solid #ddd", color = BURG;
            if (bcChosen !== null) {
              if (i === q.correct)  { bg = "#e8f5e8"; border = "2px solid #2a7a2a"; color = "#1a5a1a"; }
              else if (i === bcChosen) { bg = "#fde8e8"; border = "2px solid " + RED; color = RED; }
            }
            return <button key={i} onClick={() => { if (bcChosen !== null) return; setBcChosen(i); setBcAnswers(prev => [...prev, { chosen: i, correct: q.correct }]); }} style={{ background: bg, border, color, fontFamily: F.sans, fontSize: 14, padding: "14px 16px", borderRadius: 8, textAlign: "left", cursor: bcChosen !== null ? "default" : "pointer", lineHeight: 1.4 }}><span style={{ fontWeight: 700, marginRight: 8 }}>{String.fromCharCode(65 + i) + "."}</span>{opt}</button>;
          })}
        </div>
        {bcChosen !== null && (
          <div style={{ background: bcChosen === q.correct ? "#e8f5e8" : "#fff8e8", border: "1px solid " + (bcChosen === q.correct ? "#2a7a2a" : GOLD), borderRadius: 8, padding: 16, marginTop: 20 }}>
            <div style={{ fontFamily: F.sans, fontSize: 12, fontWeight: 700, color: bcChosen === q.correct ? "#2a7a2a" : GOLD, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>{bcChosen === q.correct ? "Correct!" : "Not quite"}</div>
            <div style={{ fontFamily: F.sans, fontSize: 13, color: "#444", lineHeight: 1.6, marginBottom: 14 }}>{q.exp}</div>
            <button onClick={() => {
              if (bcQIdx + 1 < questions.length) { setBcQIdx(q2 => q2 + 1); setBcChosen(null); }
              else {
                const allAns = [...bcAnswers];
                const finalScore = allAns.filter(a => a.chosen === a.correct).length;
                finishDayQuiz(bcDay, finalScore, questions.length);
              }
            }} style={{ background: BURG, color: W, fontFamily: F.sans, fontWeight: 700, fontSize: 13, padding: "10px 24px", border: "none", borderRadius: 6, cursor: "pointer" }}>
              {bcQIdx + 1 < questions.length ? "Next Question" : "See Results"}
            </button>
          </div>
        )}
      </div>
    );
  }

  // ── QUIZ RESULT ───────────────────────────────────────────────────────────
  if (bcView === "quiz-result") {
    const day = BOOTCAMP_DAYS[bcDay - 1];
    const prog = bcProgress[bcDay] || {};
    const score = prog.quizScore || 0;
    const total = prog.quizTotal || day.quiz.length;
    const passed = prog.passed;
    const pct = Math.round((score / total) * 100);
    return (
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "24px 20px", textAlign: "center" }}>
        <div style={{ fontFamily: F.sans, fontSize: 11, color: RED, textTransform: "uppercase", letterSpacing: 2, fontWeight: 700, marginBottom: 4 }}>Day {bcDay} Results</div>
        <div style={{ fontFamily: F.serif, fontSize: 22, color: BURG, fontWeight: 600, marginBottom: 20 }}>{day.title}</div>
        <div style={{ background: passed ? "#e8f5e8" : "#fff8e8", border: "2px solid " + (passed ? "#2a7a2a" : GOLD), borderRadius: 12, padding: "24px 32px", marginBottom: 24, display: "inline-block", minWidth: 200 }}>
          <div style={{ fontFamily: F.serif, fontSize: 48, color: passed ? "#2a7a2a" : GOLD, fontWeight: 700 }}>{pct}{"%"}</div>
          <div style={{ fontFamily: F.sans, fontSize: 14, color: passed ? "#2a7a2a" : GOLD, fontWeight: 700, marginTop: 4 }}>{score} / {total} correct</div>
          <div style={{ fontFamily: F.sans, fontSize: 13, color: passed ? "#2a7a2a" : "#a07000", marginTop: 6 }}>{passed ? "Day " + bcDay + " Complete!" : "Need 75% to pass"}</div>
        </div>
        {passed && bcDay < 5 && <div style={{ fontFamily: F.sans, fontSize: 14, color: "#2a7a2a", marginBottom: 20 }}>Day {bcDay + 1} is now unlocked!</div>}
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          {!passed && <button onClick={() => { setBcQIdx(0); setBcChosen(null); setBcAnswers([]); setBcView("quiz"); }} style={{ background: RED, color: W, fontFamily: F.sans, fontWeight: 700, fontSize: 14, padding: "12px 24px", border: "none", borderRadius: 8, cursor: "pointer" }}>Retry Quiz</button>}
          {passed && day.writing && !(bcProgress[bcDay]?.writingDone) && <button onClick={() => { setBcWriteInput(""); setBcWriteFeedback(""); setBcWriteDone(false); setBcView("writing"); }} style={{ background: GOLD, color: BURG, fontFamily: F.sans, fontWeight: 700, fontSize: 14, padding: "12px 24px", border: "none", borderRadius: 8, cursor: "pointer" }}>Writing Exercise</button>}
          <button onClick={() => setBcView("day")} style={{ background: "transparent", border: "1px solid " + BURG, color: BURG, fontFamily: F.sans, fontWeight: 700, fontSize: 14, padding: "12px 24px", borderRadius: 8, cursor: "pointer" }}>Back to Day</button>
          {passed && bcDay < 5 && <button onClick={() => { setBcDay(bcDay + 1); setBcView("day"); }} style={{ background: BURG, color: W, fontFamily: F.sans, fontWeight: 700, fontSize: 14, padding: "12px 24px", border: "none", borderRadius: 8, cursor: "pointer" }}>Day {bcDay + 1}</button>}
          {passed && bcDay === 5 && allDaysPassed() && <button onClick={() => setBcView("graduation")} style={{ background: GOLD, color: BURG, fontFamily: F.sans, fontWeight: 700, fontSize: 14, padding: "12px 24px", border: "none", borderRadius: 8, cursor: "pointer" }}>{"🎓 Graduate"}</button>}
        </div>
      </div>
    );
  }

  // ── WRITING EXERCISE ─────────────────────────────────────────────────────
  if (bcView === "writing") {
    const day = BOOTCAMP_DAYS[bcDay - 1];
    return (
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "24px 20px" }}>
        <button onClick={() => setBcView("day")} style={{ fontFamily: F.sans, fontSize: 13, color: RED, background: "none", border: "none", cursor: "pointer", marginBottom: 16, padding: 0 }}>{"← Back to Day " + bcDay}</button>
        <div style={{ fontFamily: F.sans, fontSize: 11, color: GOLD, textTransform: "uppercase", letterSpacing: 2, fontWeight: 700, marginBottom: 4 }}>Writing Exercise</div>
        <div style={{ fontFamily: F.serif, fontSize: 20, color: BURG, fontWeight: 600, marginBottom: 16 }}>AI-Graded Practice Response</div>
        <div style={{ background: "#f0e8e0", border: "1px solid #ddd", borderRadius: 8, padding: "14px 16px", marginBottom: 20 }}>
          <div style={{ fontFamily: F.sans, fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Customer Message</div>
          <div style={{ fontFamily: F.sans, fontSize: 14, color: "#333", lineHeight: 1.6 }}>{day.writing.scenario}</div>
        </div>
        {!bcWriteDone ? (
          <>
            <div style={{ fontFamily: F.sans, fontSize: 13, color: "#555", marginBottom: 10, lineHeight: 1.5 }}>Write your response in IM8 voice. Apply the policies and tone you have learned. Claude will grade it.</div>
            <textarea
              value={bcWriteInput}
              onChange={e => setBcWriteInput(e.target.value)}
              placeholder="Write your response here..."
              rows={8}
              style={{ width: "100%", fontFamily: F.sans, fontSize: 14, padding: "12px 14px", border: "2px solid #ddd", borderRadius: 8, resize: "vertical", lineHeight: 1.6, outline: "none", boxSizing: "border-box", marginBottom: 12 }}
            />
            <button onClick={submitWritingExercise} disabled={bcWriteLoading || !bcWriteInput.trim()} style={{ background: bcWriteLoading ? "#aaa" : RED, color: W, fontFamily: F.sans, fontWeight: 700, fontSize: 14, padding: "14px 28px", border: "none", borderRadius: 8, cursor: bcWriteLoading ? "not-allowed" : "pointer", width: "100%" }}>
              {bcWriteLoading ? "Grading..." : "Submit for AI Grading"}
            </button>
          </>
        ) : (
          <>
            <div style={{ fontFamily: F.sans, fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Your Response</div>
            <div style={{ background: "#f9f9f9", border: "1px solid #ddd", borderRadius: 8, padding: "12px 14px", marginBottom: 16, fontFamily: F.sans, fontSize: 14, color: "#333", lineHeight: 1.6 }}>{bcWriteInput}</div>
            <div style={{ background: "rgba(200,151,58,0.08)", border: "2px solid " + GOLD, borderRadius: 8, padding: 16, marginBottom: 20 }}>
              <div style={{ fontFamily: F.sans, fontSize: 11, fontWeight: 700, color: GOLD, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Coach Feedback</div>
              <div style={{ fontFamily: F.sans, fontSize: 14, color: "#333", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{bcWriteFeedback}</div>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => { setBcWriteInput(""); setBcWriteFeedback(""); setBcWriteDone(false); }} style={{ background: "transparent", border: "1px solid " + BURG, color: BURG, fontFamily: F.sans, fontWeight: 700, fontSize: 13, padding: "12px 20px", borderRadius: 8, cursor: "pointer", flex: 1 }}>Try Again</button>
              <button onClick={() => setBcView("day")} style={{ background: BURG, color: W, fontFamily: F.sans, fontWeight: 700, fontSize: 13, padding: "12px 20px", border: "none", borderRadius: 8, cursor: "pointer", flex: 1 }}>Back to Day {bcDay}</button>
            </div>
          </>
        )}
      </div>
    );
  }

  return null;
}

// ─── INSIGHTS TAB ─────────────────────────────────────────────────────────────
// Local-date YYYY-MM-DD. toISOString() would shift to UTC and display
// "yesterday" for users east of UTC (AU sees May 8 when it's locally May 9).
function ymd(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function presetRange(name) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  switch (name) {
    case "Today":      return { from: ymd(today), to: ymd(today) };
    case "Yesterday": { const y = new Date(today); y.setDate(y.getDate() - 1); return { from: ymd(y), to: ymd(y) }; }
    case "This week": { const w = new Date(today); w.setDate(w.getDate() - w.getDay()); return { from: ymd(w), to: ymd(today) }; }
    case "Last 7":    { const s = new Date(today); s.setDate(s.getDate() - 6); return { from: ymd(s), to: ymd(today) }; }
    case "Last 30":   { const s = new Date(today); s.setDate(s.getDate() - 29); return { from: ymd(s), to: ymd(today) }; }
    case "MTD":       { const m = new Date(today.getFullYear(), today.getMonth(), 1); return { from: ymd(m), to: ymd(today) }; }
    default:          return { from: ymd(today), to: ymd(today) };
  }
}

function formatDuration(seconds) {
  if (seconds == null) return "—";
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const m = seconds / 60;
  if (m < 60) return `${Math.round(m)}m`;
  const h = m / 60;
  if (h < 48) return `${h.toFixed(1)}h`;
  return `${(h / 24).toFixed(1)}d`;
}

function formatMoney(value, currency = "USD") {
  if (value == null || !Number.isFinite(value)) return "—";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `$${Math.round(value * 100) / 100}`;
  }
}

function InsightsTab({ role }) {
  const canSeeRefunds = role && ["Lead Agent", "Manager", "Admin", "Owner"].includes(role);
  const initial = presetRange("Today");
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const [activePreset, setActivePreset] = useState("Today");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // Trends state intentionally removed May 17 — see TrendsCard comment
  // below for re-enable instructions. Reports tab handles trends now.
  const [shop, setShop] = useState(null);
  const [shopLoading, setShopLoading] = useState(false);
  const [shopError, setShopError] = useState(null);
  const [skio, setSkio] = useState(null);
  const [skioLoading, setSkioLoading] = useState(false);
  const [skioError, setSkioError] = useState(null);
  const [loop, setLoop] = useState(null);
  const [loopLoading, setLoopLoading] = useState(false);
  const [loopError, setLoopError] = useState(null);
  // skio cancel reasons live at a separate endpoint than the main skio
  // metrics (it paginates Skio's V3Session.pathTaken). Fetched independently
  // so the page renders fast even when this one is on a cold cache.
  const [skioReasons, setSkioReasons] = useState(null);
  const [skioReasonsError, setSkioReasonsError] = useState(null);

  async function load(rangeFrom = from, rangeTo = to) {
    setLoading(true);
    setError(null);
    setData(null);
    setShop(null);
    setShopError(null);
    setSkio(null);
    setSkioError(null);
    setLoop(null);
    setLoopError(null);
    setSkioReasons(null);
    setSkioReasonsError(null);

    // Anchor date ranges to HKT (UTC+8) — Prenetics's Gorgias account
    // timezone. This way the same date range in the Hub matches the same
    // date range in Gorgias's dashboard, regardless of where the viewer
    // is sitting. HKT doesn't observe DST so +08:00 is always correct.
    const fromIso = new Date(rangeFrom + "T00:00:00+08:00").toISOString();
    const toIso = new Date(rangeTo + "T23:59:59+08:00").toISOString();

    // Fire integrations in parallel so one failing doesn't blank the rest.
    // Trends call removed May 17 — was the slow-LLM read of customer
    // messages. Reports tab still fetches it independently when opened.
    loadShop(fromIso, toIso);
    loadSkio(fromIso, toIso);
    loadSkioReasons(fromIso, toIso);
    if (canSeeRefunds) loadLoop(fromIso, toIso);

    try {
      const res = await fetch(`/api/insights/summary?from=${fromIso}&to=${toIso}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setData(json);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadShop(fromIso, toIso) {
    setShopLoading(true);
    setShopError(null);
    try {
      const res = await fetch(`/api/insights/shopify?from=${fromIso}&to=${toIso}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setShop(json);
    } catch (e) {
      setShopError(e.message);
    } finally {
      setShopLoading(false);
    }
  }

  async function loadLoop(fromIso, toIso) {
    setLoopLoading(true);
    setLoopError(null);
    try {
      const res = await fetch(`/api/insights/loop?from=${fromIso}&to=${toIso}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setLoop(json);
    } catch (e) {
      setLoopError(e.message);
    } finally {
      setLoopLoading(false);
    }
  }

  async function loadSkio(fromIso, toIso) {
    setSkioLoading(true);
    setSkioError(null);
    try {
      const res = await fetch(`/api/insights/skio?from=${fromIso}&to=${toIso}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setSkio(json);
    } catch (e) {
      setSkioError(e.message);
    } finally {
      setSkioLoading(false);
    }
  }

  // Skio cancel reasons live at a separate endpoint and feed the combined
  // RefundCancelReasonsPanel. Errors here just hide the cancel column —
  // the panel still renders refund data alone.
  async function loadSkioReasons(fromIso, toIso) {
    setSkioReasonsError(null);
    try {
      const res = await fetch(`/api/insights/skio/cancel-reasons?from=${fromIso}&to=${toIso}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setSkioReasons(json);
    } catch (e) {
      setSkioReasonsError(e.message);
    }
  }

  // loadTrends removed May 17 — too slow for the day-to-day Insights tab
  // (reads a sample of customer messages and runs them through Claude).
  // The /api/insights/trends endpoint is still live and used by the
  // Weekly Reports tab via its own fetch path.

  useEffect(() => { load(); }, []);

  function applyPreset(name) {
    const r = presetRange(name);
    setFrom(r.from);
    setTo(r.to);
    setActivePreset(name);
    load(r.from, r.to);
  }

  function onManualDateChange(setter) {
    return (e) => { setActivePreset(null); setter(e.target.value); };
  }

  const fmtPct = (n, total) => total ? `${Math.round((n / total) * 100)}%` : "0%";
  const sortEntries = (obj) => Object.entries(obj || {}).sort((a, b) => b[1] - a[1]);

  const presets = ["Today", "Yesterday", "WTD", "MTD"];

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
        <div>
          <div style={{ fontFamily: F.serif, fontSize: 26, fontWeight: 700, color: BURG }}>Insights</div>
          <div style={{ fontFamily: F.sans, fontSize: 12, color: INK, opacity: 0.55, marginTop: 4, lineHeight: 1.5 }}>Live snapshot of tickets, orders, subscriptions and customer sentiment for the selected period.</div>
          {data?.fromCache && (
            <div style={{ fontFamily: F.sans, fontSize: 11, color: "#aaa", marginTop: 4 }}>cached</div>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <input type="date" value={from} onChange={onManualDateChange(setFrom)} style={{ padding: "6px 10px", border: "1px solid #ddd", borderRadius: 6, fontFamily: F.sans, fontSize: 13 }} />
          <span style={{ color: "#999", fontFamily: F.sans, fontSize: 12 }}>to</span>
          <input type="date" value={to} onChange={onManualDateChange(setTo)} style={{ padding: "6px 10px", border: "1px solid #ddd", borderRadius: 6, fontFamily: F.sans, fontSize: 13 }} />
          <button onClick={() => load()} disabled={loading} style={{ background: BURG, color: W, border: "none", padding: "7px 16px", borderRadius: 6, fontFamily: F.sans, fontSize: 13, fontWeight: 600, cursor: loading ? "wait" : "pointer", opacity: loading ? 0.6 : 1 }}>
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 24 }}>
        {presets.map((p) => (
          <button key={p} onClick={() => applyPreset(p)} style={{
            background: activePreset === p ? BURG : W,
            color: activePreset === p ? W : BURG,
            border: "1px solid " + (activePreset === p ? BURG : "#ddd"),
            padding: "5px 12px", borderRadius: 6, fontFamily: F.sans, fontSize: 12, fontWeight: 600, cursor: "pointer",
          }}>{p}</button>
        ))}
      </div>

      {error && (
        <div style={{ background: "#fee", border: "1px solid " + RED, color: RED, padding: 12, borderRadius: 8, marginBottom: 16, fontFamily: F.sans, fontSize: 13 }}>
          Gorgias: {error}
        </div>
      )}

      {loading && !data && !shop && !skio && (
        <div style={{ textAlign: "center", padding: "40px 0", color: "#888", fontFamily: F.sans }}>Loading...</div>
      )}

      {data && (
        <>
          {/* Tiles trimmed to only the stats we can match Gorgias on
              cleanly. Resolution time and Messages/ticket use a different
              methodology (Gorgias filters to agent-replied tickets via a
              bulk lookup that's too slow to run inline) — pulled until we
              have a pre-warmed lookup. */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 24 }}>
            <KpiTile label="Tickets" value={data.volume?.toLocaleString() ?? "—"} hint={data.totalAcrossBrands ? `${data.totalAcrossBrands.toLocaleString()} across all brands` : null} />
            <KpiTile label="CSAT" value={data.csat?.average != null ? data.csat.average.toFixed(2) : "—"} hint={data.csat?.count ? `${data.csat.count} responses` : "no responses"} />
            <KpiTile label="Closed" value={(data.byStatus?.closed ?? 0).toLocaleString()} hint={fmtPct(data.byStatus?.closed ?? 0, data.volume)} />
            <KpiTile label="Open" value={(data.byStatus?.open ?? 0).toLocaleString()} hint={fmtPct(data.byStatus?.open ?? 0, data.volume)} />
            <KpiTile
              label="Trustpilot"
              value={TRUSTPILOT_STATS.trustScore.toFixed(1)}
              hint={
                <a href={TRUSTPILOT_STATS.url} target="_blank" rel="noreferrer" style={{ color: BURG, textDecoration: "underline" }}>
                  {TRUSTPILOT_STATS.totalReviews.toLocaleString()} reviews ↗
                </a>
              }
            />
          </div>
        </>
      )}

      {/* CS TLDR / 3 trends to watch — removed from Insights May 17.
          The /api/insights/trends call reads a sample of customer messages
          and runs them through Claude, which made the tab feel slow.
          Trends still render in the Weekly Reports tab (uses TrendsBlock
          off a separately-fired fetch). To re-enable here: restore the
          trends state + loadTrends + the <TrendsCard> render below. */}

      {(shop || shopLoading || shopError) && (
        <>
          <div style={{ fontFamily: F.sans, fontSize: 11, color: "#999", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8 }}>Shopify</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 24 }}>
            <KpiTile
              label="Orders"
              value={shopLoading ? "..." : (shop?.orders != null ? shop.orders.toLocaleString() : "—")}
              hint={shopError ? "error" : null}
            />
            <KpiTile
              label="Refund rate ($)"
              value={shopLoading ? "..." : (
                shop?.refundRateDollars != null
                  ? `${(shop.refundRateDollars * 100).toFixed(2)}%`
                  : (shop?.refundRate != null ? `${(shop.refundRate * 100).toFixed(2)}%` : "—")
              )}
              hint={(() => {
                const parts = [];
                if (shop?.refundRate != null) parts.push(`${(shop.refundRate * 100).toFixed(2)}% by count`);
                if (shop?.refunded != null) parts.push(`${shop.refunded.toLocaleString()} refunded (${shop.fullyRefunded ?? 0} full / ${shop.partiallyRefunded ?? 0} partial)`);
                return parts.length ? parts.join(" · ") : null;
              })()}
            />
            <KpiTile
              label="Cancel rate"
              value={shopLoading ? "..." : (shop?.cancelRate != null ? `${(shop.cancelRate * 100).toFixed(2)}%` : "—")}
              hint={shop?.cancelled != null ? `${shop.cancelled.toLocaleString()} cancelled` : null}
            />
          </div>
          {shopError && (
            <div style={{ background: "#fee", border: "1px solid " + RED, color: RED, padding: 8, borderRadius: 6, marginBottom: 16, fontFamily: F.sans, fontSize: 12 }}>
              Shopify: {shopError}
            </div>
          )}
        </>
      )}

      {canSeeRefunds && (loop || loopLoading || loopError) && (
        <LoopRefundsCard loop={loop} shop={shop} loading={loopLoading} error={loopError} />
      )}

      {/* Combined exit signals — one place to see what's making customers
          ask for their money back OR cancel. Combines return reasons
          (with $) + Skio cancellation reasons. */}
      {(loop || skioReasons) && (
        <RefundCancelReasonsPanel
          loop={loop}
          skioReasons={skioReasons}
          shop={shop}
        />
      )}


      {(skio || skioLoading || skioError) && (
        <>
          <div style={{ fontFamily: F.sans, fontSize: 11, color: "#999", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8 }}>Skio · Subscriptions</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 12 }}>
            <KpiTile
              label="Active subs"
              value={skioLoading ? "..." : (skio?.active != null ? skio.active.toLocaleString() : "—")}
              hint={skio?.paused != null ? `${skio.paused.toLocaleString()} paused` : null}
            />
            <KpiTile
              label="Churn rate"
              value={skioLoading ? "..." : (skio?.churnRate != null ? `${(skio.churnRate * 100).toFixed(2)}%` : "—")}
              hint={skio?.activeAtStart != null ? `${skio.cancelled?.toLocaleString() ?? 0} of ${skio.activeAtStart.toLocaleString()} at start` : null}
            />
            <KpiTile
              label="Cancellations"
              value={skioLoading ? "..." : (skio?.cancelled != null ? skio.cancelled.toLocaleString() : "—")}
              hint="in range"
            />
            <KpiTile
              label="New subs"
              value={skioLoading ? "..." : (skio?.created != null ? skio.created.toLocaleString() : "—")}
              hint={skio?.netChange != null ? `${skio.netChange >= 0 ? "+" : ""}${skio.netChange.toLocaleString()} net` : null}
            />
            <KpiTile
              label="Failed payments"
              value={skioLoading ? "..." : (skio?.failedPayments != null ? skio.failedPayments.toLocaleString() : "—")}
              hint="in range"
            />
          </div>
          {/* Skio "Top Cancel Reasons" removed — now consolidated with
              Loop refund reasons in the RefundCancelReasonsPanel above. */}
          {skioError && (
            <div style={{ background: "#fee", border: "1px solid " + RED, color: RED, padding: 8, borderRadius: 6, marginBottom: 16, fontFamily: F.sans, fontSize: 12 }}>
              Skio: {skioError}
            </div>
          )}
        </>
      )}

      {data && (
        <>
          <BreakdownCard title="Tix by Channel" entries={sortEntries(data.byChannel)} total={data.volume} />
          <BreakdownCard title="Tix by Tags" entries={sortEntries(data.topTags)} total={data.volume} />
        </>
      )}
    </div>
  );
}

function LoopRefundsCard({ loop, shop, loading, error }) {
  const ROWS = [
    { key: "Monthly",   label: "Hair Edit subscribers (monthly)" },
    { key: "Quarterly", label: "Bi-monthly / adjusted cadence" },
    { key: "Refills",   label: "Renewal orders" },
    { key: "OTP",       label: "One-time purchases" },
  ];
  const m = loop?.matrix ?? {};
  const directCount = shop?.refunded != null && loop?.count != null
    ? Math.max(0, shop.refunded - loop.count)
    : null;
  const directAmount = shop?.refundAmount != null && loop?.total != null
    ? Math.max(0, shop.refundAmount - loop.total)
    : null;
  const totalCount = shop?.refunded ?? loop?.count ?? 0;
  const totalAmount = shop?.refundAmount ?? loop?.total ?? 0;

  return (
    <div style={{ background: W, border: "1px solid " + SOFT_BORDER, borderRadius: 14, padding: "20px 24px", marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
        <div>
          <div style={{ fontFamily: F.sans, fontSize: 11, color: "#999", textTransform: "uppercase", letterSpacing: 1.5 }}>Refunds</div>
          <div style={{ fontFamily: F.serif, fontSize: 22, color: BURG, fontWeight: 700 }}>
            {loading ? "..." : formatMoney(totalAmount)}
            <span style={{ fontFamily: F.sans, fontSize: 12, color: INK, opacity: 0.6, fontWeight: 500, marginLeft: 10 }}>
              {loading ? "" : `· ${totalCount.toLocaleString()} cases`}
            </span>
          </div>
          {!loading && (loop?.count != null || directCount != null) && (
            <div style={{ fontFamily: F.sans, fontSize: 11, color: INK, opacity: 0.55, marginTop: 2 }}>
              {loop?.count ?? 0} customer-initiated ({formatMoney(loop?.total)}){directCount != null ? ` · ${directCount.toLocaleString()} direct in Shopify (${formatMoney(directAmount)})` : ""}
            </div>
          )}
          {/* When direct cases > 0 but direct $ is $0, the cases aren't
              actually refunds in the money-back sense — they're Shopify's
              internal refund-event records for payment-failure cancellations,
              store-credit refunds, or foreign-currency refunds where the USD
              value isn't directly available. Surface this so the number
              doesn't read as "6 real refunds for $0". */}
          {!loading && directCount != null && directCount > 0 && directAmount === 0 && (
            <div style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 11, color: INK, opacity: 0.55, marginTop: 6, maxWidth: 640, lineHeight: 1.4 }}>
              Some Shopify "refund" events recorded with $0 — typically orders cancelled due to payment failure, store-credit refunds, or foreign-currency refunds (where Shopify doesn't return a USD-normalised amount). Counted as cases but not added to the dollar total.
            </div>
          )}
        </div>
        {loop?.cutoff && (
          <div style={{ fontFamily: F.sans, fontSize: 11, color: INK, opacity: 0.5 }}>
            Excludes pre-{new Date(loop.cutoff).toLocaleDateString("en-US", { month: "short", day: "numeric" })} stale returns data
          </div>
        )}
      </div>
      {error && (
        <div style={{ background: "#fee", border: "1px solid " + RED, color: RED, padding: 8, borderRadius: 6, fontFamily: F.sans, fontSize: 12 }}>Returns: {error}</div>
      )}
      {!loading && !error && loop && (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: F.sans, fontSize: 12 }}>
            <thead>
              <tr style={{ background: CREAM }}>
                <th style={{ padding: "10px 12px", textAlign: "left", color: "#999", fontWeight: 600 }}>Category</th>
                <th style={{ padding: "10px 12px", textAlign: "right", color: "#999", fontWeight: 600 }}>Cases</th>
                <th style={{ padding: "10px 12px", textAlign: "right", color: "#999", fontWeight: 600 }}>Total $</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((r, i) => {
                const cell = m[r.key] ?? { count: 0, amount: 0 };
                return (
                  <tr key={r.key} style={{ background: i % 2 === 0 ? W : "#fdfbf9" }}>
                    <td style={{ padding: "10px 12px", color: BURG, fontWeight: 600 }}>{r.label}</td>
                    <td style={{ padding: "10px 12px", textAlign: "right", color: INK }}>{cell.count}</td>
                    <td style={{ padding: "10px 12px", textAlign: "right", color: BURG, fontWeight: 700 }}>{formatMoney(cell.amount)}</td>
                  </tr>
                );
              })}
              {directCount != null && (
                <tr style={{ background: "#fdfbf9" }}>
                  <td style={{ padding: "10px 12px", color: BURG, fontWeight: 600, fontStyle: "italic" }}>Processed directly in Shopify</td>
                  <td style={{ padding: "10px 12px", textAlign: "right", color: INK }}>{directCount}</td>
                  <td style={{ padding: "10px 12px", textAlign: "right", color: BURG, fontWeight: 700 }}>{formatMoney(directAmount)}</td>
                </tr>
              )}
              {shop?.refunded != null && (
                <tr style={{ background: BURG, color: CREAM }}>
                  <td style={{ padding: "10px 12px", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", fontSize: 11 }}>Total (all sources)</td>
                  <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700 }}>{shop.refunded.toLocaleString()}</td>
                  <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, color: GOLD }}>{formatMoney(totalAmount)}</td>
                </tr>
              )}
            </tbody>
          </table>
          {/* Loop topReasons removed — now consolidated into the
              RefundCancelReasonsPanel below this card, which combines
              Loop refund reasons + Skio cancel reasons into one view. */}
        </div>
      )}
    </div>
  );
}

// LUMÉ refund/cancel reason categories. Order matters — first match wins.
// Covers the main reasons customers contact CX about their serum subscription.
const REASON_CATEGORIES = [
  {
    key: "wrong-serums",
    label: "Wrong serums / doesn't suit hair type",
    match: (s) => /wrong (serum|product|box|one)|received the wrong|got the wrong|incorrect (serum|product)|sent the wrong|not what i ordered|not right for my hair|doesn'?t suit|not suited/i.test(s),
  },
  {
    key: "shipping",
    label: "Delivery / shipping issue",
    match: (s) => /shipp|delivery|deliver|tracking|haven'?t (received|got)|not received|never (received|arrived|got)|arrived late|stuck in transit|lost in (transit|mail)|missing (package|order)/i.test(s),
  },
  {
    key: "adverse-reaction",
    label: "Adverse reaction / skin concern",
    match: (s) => /reaction|allerg|rash|itch|burn|sting|irritat|red|sensitive|hives|swelling|side effect|scalp (pain|burn)|made me (sick|unwell)/i.test(s),
  },
  {
    key: "have-enough",
    label: "Not using fast enough / have excess",
    match: (s) => /have (enough|too much)|already have|not using|not finishing|building up|stockpile|pause|skip|taking a break|too many|overstocked|not finished|accumulating/i.test(s),
  },
  {
    key: "no-results",
    label: "No results seen yet",
    match: (s) => /not working|doesn'?t work|no (results|improvement|change|difference)|isn'?t helping|didn'?t (work|help|notice|see)|not seeing|can'?t see/i.test(s),
  },
  {
    key: "price",
    label: "Price / too expensive",
    match: (s) => /expensive|price|cost|afford|cheaper|too much money|budget|financial|(can'?t|cannot) afford/i.test(s),
  },
  {
    key: "subscription-confusion",
    label: "Subscription confusion / unauthorized",
    match: (s) => /didn'?t (mean|want|know|realize|intend|authori[sz]e)|surprise|unaware|unauthori[sz]ed|accidental|by mistake|signed up by|never (agreed|signed)|charged without/i.test(s),
  },
  {
    key: "quality",
    label: "Damaged / quality issue",
    match: (s) => /damaged|broken|leak|pump|bottle|packaging|seal|tamper|defect|opened|crushed/i.test(s),
  },
  {
    key: "personal",
    label: "Personal / life change",
    match: (s) => /moving|personal|life change|situation|abroad|overseas|break|pause/i.test(s),
  },
  {
    key: "plain-cancel",
    label: "Plain cancel — no reason given",
    match: (s) => /^cancel|cancel my|cancel sub|stop sub|end sub|just cancel|please cancel/i.test(s),
  },
];

function bucketReason(reason) {
  const s = String(reason || "");
  for (const c of REASON_CATEGORIES) {
    if (c.match(s)) return c;
  }
  return { key: "other", label: "Other / unspecified" };
}

// Combined refund+cancel reasons panel. Pulls Loop's refund reasons (with
// per-reason $) and Skio's cancel-flow reasons, buckets free text into
// canonical LUMÉ categories, and shows one row per category sorted by $
// impact. The % of gross sales column is the actual lever for the
// $-based refund rate — so this panel doubles as a roadmap to which
// fix moves the headline number most.
function RefundCancelReasonsPanel({ loop, skioReasons, shop }) {
  const buckets = useMemo(() => {
    const map = new Map();
    const ensure = (key, label) => {
      if (!map.has(key)) {
        map.set(key, {
          key, label,
          refundCount: 0,
          refundAmount: 0,
          cancelCount: 0,
          examples: new Set(),
        });
      }
      return map.get(key);
    };

    for (const r of loop?.topReasons ?? []) {
      const cat = bucketReason(r.reason);
      const b = ensure(cat.key, cat.label);
      b.refundCount += r.count || 0;
      b.refundAmount += r.amount || 0;
      b.examples.add(r.reason);
    }
    for (const r of skioReasons?.topCancelReasons ?? []) {
      const cat = bucketReason(r.reason);
      const b = ensure(cat.key, cat.label);
      b.cancelCount += r.count || 0;
      b.examples.add(r.reason);
    }

    return [...map.values()].sort((a, b) => {
      // $ impact first (the lever for the headline rate). Tie-break by
      // total signal volume so cancel-only categories still rank.
      const dDelta = b.refundAmount - a.refundAmount;
      if (dDelta !== 0) return dDelta;
      return (b.refundCount + b.cancelCount) - (a.refundCount + a.cancelCount);
    });
  }, [loop, skioReasons]);

  if (buckets.length === 0) return null;

  const grossSales = shop?.grossSales ?? null;

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontFamily: F.sans, fontSize: 11, color: "#999", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 4 }}>
        Refund & cancellation reasons
      </div>
      <div style={{ fontFamily: F.sans, fontSize: 11, color: "#aaa", marginBottom: 10 }}>
        Combined exit signals — customer returns + Skio cancellations. Sorted by $ impact (the lever for the headline refund rate).
      </div>
      <div style={{ background: "#FFF", border: "1px solid " + SOFT_BORDER, borderRadius: 10, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: F.sans, fontSize: 13 }}>
          <thead>
            <tr style={{ background: CREAM, color: "#666", fontSize: 10, textTransform: "uppercase", letterSpacing: 1.2 }}>
              <th style={{ textAlign: "left", padding: "8px 12px", fontWeight: 700 }}>Category</th>
              <th style={{ textAlign: "right", padding: "8px 12px", fontWeight: 700 }}>Refunds</th>
              <th style={{ textAlign: "right", padding: "8px 12px", fontWeight: 700 }}>Cancels</th>
              <th style={{ textAlign: "right", padding: "8px 12px", fontWeight: 700 }}>$ refunded</th>
              {grossSales != null && (
                <th style={{ textAlign: "right", padding: "8px 12px", fontWeight: 700 }}>% of gross</th>
              )}
            </tr>
          </thead>
          <tbody>
            {buckets.map((b, i) => {
              const pctGross = grossSales && grossSales > 0 ? (b.refundAmount / grossSales) * 100 : null;
              return (
                <tr key={b.key} style={{ borderTop: i > 0 ? "1px solid " + SOFT_BORDER : "none" }}>
                  <td style={{ padding: "10px 12px", color: INK, fontWeight: 600 }}>{b.label}</td>
                  <td style={{ padding: "10px 12px", textAlign: "right", color: b.refundCount > 0 ? BURG : "#bbb" }}>
                    {b.refundCount > 0 ? b.refundCount.toLocaleString() : "—"}
                  </td>
                  <td style={{ padding: "10px 12px", textAlign: "right", color: b.cancelCount > 0 ? BURG : "#bbb" }}>
                    {b.cancelCount > 0 ? b.cancelCount.toLocaleString() : "—"}
                  </td>
                  <td style={{ padding: "10px 12px", textAlign: "right", color: b.refundAmount > 0 ? GOLD : "#bbb", fontWeight: b.refundAmount > 0 ? 700 : 400 }}>
                    {b.refundAmount > 0 ? formatMoney(b.refundAmount) : "—"}
                  </td>
                  {grossSales != null && (
                    <td style={{ padding: "10px 12px", textAlign: "right", color: pctGross > 0 ? INK : "#bbb", fontWeight: pctGross > 0 ? 600 : 400 }}>
                      {pctGross > 0 ? `${pctGross.toFixed(2)}%` : "—"}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Manus-style CS TLDR. Header line shows ticket count + CSAT. Each trend
// renders title + estimated count/% + verbatim quote(s) + signal + action.
function TrendsCard({ trends, loading, error, gorgias }) {
  const items = trends?.trends ?? [];
  const csatAvg = gorgias?.csat?.average;
  const csatCount = gorgias?.csat?.count;
  const totalTickets = trends?.totalTickets ?? gorgias?.volume;
  return (
    <div style={{ background: "linear-gradient(160deg,#FFF 0%,#fbf6ef 100%)", border: "1px solid " + GOLD, borderRadius: 10, padding: "20px 24px", marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "baseline", flexWrap: "wrap", gap: 14, marginBottom: 14 }}>
        <span style={{ fontFamily: F.serif, fontSize: 20, fontWeight: 700, color: BURG }}>CS TLDR</span>
        {totalTickets != null && (
          <span style={{ fontFamily: F.sans, fontSize: 13, color: INK }}>
            <strong style={{ color: BURG }}>{totalTickets.toLocaleString()}</strong> tickets
          </span>
        )}
        {csatAvg != null && (
          <span style={{ fontFamily: F.sans, fontSize: 13, color: INK }}>
            <span style={{ color: INK, opacity: 0.45 }}>·</span>{" "}
            CSAT <strong style={{ color: BURG }}>{csatAvg.toFixed(1)}/5</strong> ⭐
            {csatCount ? <span style={{ color: INK, opacity: 0.5, marginLeft: 6 }}>({csatCount})</span> : null}
          </span>
        )}
      </div>

      {loading && <div style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 13, color: INK, opacity: 0.5 }}>Reading customer messages…</div>}
      {error && <div style={{ fontFamily: F.sans, fontSize: 12, color: RED }}>{error}</div>}

      {!loading && !error && items.length > 0 && (
        <>
          <div style={{ fontFamily: F.sans, fontSize: 12, color: BURG, fontWeight: 700, marginBottom: 10 }}>
            🚨 3 trends to watch:
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {items.map((t, i) => <TrendItem key={i} index={i + 1} trend={t} />)}
          </div>
        </>
      )}

      {!loading && !error && items.length === 0 && (
        <span style={{ fontFamily: F.sans, fontSize: 12, color: "#888" }}>No trends found in this range.</span>
      )}

      {trends?.sampleSize ? (
        <div style={{ fontFamily: F.sans, fontSize: 11, color: "#aaa", marginTop: 12 }}>
          {trends.readAll
            ? `Read every customer message: ${trends.sampleSize} of ${trends.totalTickets ?? "?"} tickets — counts are exact.`
            : `Read ${trends.sampleSize} customer messages of ${trends.totalTickets ?? "?"} total — counts are estimated from the sample.`}
        </div>
      ) : null}
    </div>
  );
}

function TrendItem({ index, trend }) {
  return (
    <div style={{ paddingLeft: 4 }}>
      <div style={{ fontFamily: F.sans, fontSize: 13, color: BURG, fontWeight: 700, lineHeight: 1.4 }}>
        {index}. {trend.title}
        {trend.estTotal > 0 && (
          <span style={{ fontWeight: 500, color: INK, opacity: 0.7, marginLeft: 6 }}>
            — ~{trend.estTotal.toLocaleString()} tickets
            {trend.estPct > 0 ? ` (~${trend.estPct}% of volume)` : ""}
          </span>
        )}
      </div>
      {(trend.quotes ?? []).map((q, j) => {
        const tid = trend.quoteTicketIds?.[j];
        return (
          <div key={j} style={{ fontFamily: F.serif, fontStyle: "italic", fontSize: 13, color: INK, lineHeight: 1.5, marginTop: 6, paddingLeft: 12, borderLeft: "2px solid " + GOLD }}>
            “{q}”
            {tid ? <GorgiasTicketLink id={tid} /> : null}
          </div>
        );
      })}
      {trend.signal && (
        <div style={{ fontFamily: F.sans, fontSize: 12, color: INK, lineHeight: 1.5, marginTop: 6 }}>
          <span style={{ color: BURG, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, fontSize: 10, marginRight: 6 }}>Signal</span>
          {trend.signal}
        </div>
      )}
      {trend.action && (
        <div style={{ fontFamily: F.sans, fontSize: 12, color: INK, lineHeight: 1.5, marginTop: 4 }}>
          <span style={{ color: BURG, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, fontSize: 10, marginRight: 6 }}>Action</span>
          {trend.action}
        </div>
      )}
    </div>
  );
}

// Inline link from a trend quote to its source ticket in Gorgias.
// Renders as a small "#1234 ↗" tag after the closing quote mark.
function GorgiasTicketLink({ id }) {
  const href = `https://prenetics.gorgias.com/app/ticket/${id}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        marginLeft: 6,
        fontFamily: F.sans,
        fontStyle: "normal",
        fontSize: 10,
        fontWeight: 600,
        color: BURG,
        textDecoration: "none",
        letterSpacing: 0.3,
        opacity: 0.8,
        whiteSpace: "nowrap",
      }}
      title="Open in Gorgias"
    >
      #{id} ↗
    </a>
  );
}

function KpiTile({ label, value, hint }) {
  return (
    <div style={{ background: W, border: "1px solid #e0d9d0", borderRadius: 10, padding: "16px 18px" }}>
      <div style={{ fontFamily: F.sans, fontSize: 10, color: "#999", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 6 }}>{label}</div>
      <div style={{ fontFamily: F.serif, fontSize: 30, fontWeight: 700, color: BURG, lineHeight: 1 }}>{value}</div>
      {hint && <div style={{ fontFamily: F.sans, fontSize: 11, color: "#888", marginTop: 6 }}>{hint}</div>}
    </div>
  );
}

function BreakdownCard({ title, entries, total }) {
  if (!entries?.length) return null;
  const max = entries[0]?.[1] ?? 1;
  return (
    <div style={{ background: W, border: "1px solid #e0d9d0", borderRadius: 10, padding: "16px 20px", marginBottom: 16 }}>
      <div style={{ fontFamily: F.serif, fontSize: 16, fontWeight: 700, color: BURG, marginBottom: 12 }}>{title}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {entries.map(([key, count]) => {
          const pct = total ? Math.round((count / total) * 100) : 0;
          const barWidth = Math.round((count / max) * 100);
          return (
            <div key={key} style={{ display: "grid", gridTemplateColumns: "180px 1fr 80px", alignItems: "center", gap: 12 }}>
              <div style={{ fontFamily: F.sans, fontSize: 12, color: BURG, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{key}</div>
              <div style={{ background: "#f0ebe5", borderRadius: 99, height: 8, position: "relative", overflow: "hidden" }}>
                <div style={{ background: "linear-gradient(90deg," + BURG + "," + GOLD + ")", width: barWidth + "%", height: "100%", borderRadius: 99, transition: "width 0.4s" }} />
              </div>
              <div style={{ fontFamily: F.sans, fontSize: 12, color: "#666", textAlign: "right" }}>
                {count.toLocaleString()} <span style={{ color: "#aaa" }}>· {pct}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
