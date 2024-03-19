import {
  pgTable,
  foreignKey,
  pgEnum,
  serial,
  integer,
  date,
  text,
  unique,
  boolean,
  timestamp,
  bigint,
  uniqueIndex,
  varchar,
  uuid,
  real,
  numeric,
  char,
  doublePrecision,
} from "drizzle-orm/pg-core";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
export const keyStatus = pgEnum("key_status", [
  "default",
  "valid",
  "invalid",
  "expired",
]);
export const keyType = pgEnum("key_type", [
  "aead-ietf",
  "aead-det",
  "hmacsha512",
  "hmacsha256",
  "auth",
  "shorthash",
  "generichash",
  "kdf",
  "secretbox",
  "secretstream",
  "stream_xchacha20",
]);
export const factorType = pgEnum("factor_type", ["totp", "webauthn"]);
export const factorStatus = pgEnum("factor_status", ["unverified", "verified"]);
export const aalLevel = pgEnum("aal_level", ["aal1", "aal2", "aal3"]);
export const codeChallengeMethod = pgEnum("code_challenge_method", [
  "s256",
  "plain",
]);
export const classLanguageEnum280B61Bf = pgEnum(
  "class_language_enum_280b61bf",
  ["Spanish", "English", "Chinese", "French"]
);
export const classModalityEnum1Ce1Fab3 = pgEnum(
  "class_modality_enum_1ce1fab3",
  ["In Person", "Virtual-Online"]
);
export const classOfferingEnum9133E3F1 = pgEnum(
  "class_offering_enum_9133e3f1",
  [
    "Emotional Resilience",
    "EnglishConnect 1",
    "EnglishConnect 2",
    "Family History & Genealogy",
    "Personal Finance",
    "Emergency Preparedness",
    "Job Seeking Skills",
    "Business Skills",
  ]
);
export const curriculumTypeEnum45Fa7E02 = pgEnum(
  "curriculum_type_enum_45fa7e02",
  ["Life Help", "Self Reliance", "Individualized"]
);
export const regionEnum43F3E3E1 = pgEnum("region_enum_43f3e3e1", [
  "TEXAS_EAST",
  "TEXAS_WEST",
  "TEXAS_CENTRAL",
  "TEXAS_HOUSTON_SOUTH",
  "TEXAS_HOUSTON",
  "TEXAS_HOUSTON_EAST",
  "NEVADA",
  "ARIZONA",
]);
export const regionEnumC81B5A8E = pgEnum("region_enum_c81b5a8e", [
  "TEXAS_WEST",
  "TEXAS_EAST",
  "ARIZONA",
  "NEVADA",
]);

export const attendanceReports = pgTable("attendance_reports", {
  id: serial("id").primaryKey().notNull(),
  enrollmentId: integer("enrollment_id").references(() => enrollments.id),
  date: date("date").defaultNow(),
  entryType: text("entry_type"),
});

export const ccRepRelations = pgTable("cc_rep_relations", {
  id: serial("id").primaryKey().notNull(),
  ccId: integer("cc_id")
    .notNull()
    .references(() => coordinatingCouncils.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
  ccRepId: integer("cc_rep_id")
    .notNull()
    .references(() => ccRepresentatives.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
});

export const ccRepresentatives = pgTable("cc_representatives", {
  id: serial("id").primaryKey().notNull(),
  email: text("email"),
  firstName: text("first_name"),
  lastName: text("last_name"),
});

export const contacts = pgTable(
  "contacts",
  {
    id: serial("id").primaryKey().notNull(),
    firstName: text("first_name"),
    lastName: text("last_name"),
    email: text("email"),
    phone: text("phone"),
    over18: boolean("over18").default(false),
    zipcode: text("zipcode"),
    address: text("address"),
    createdAt: timestamp("created_at", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
    tags: text("tags"),
    message: text("message"),
    isMember: boolean("is_member").default(false),
    crmId: integer("crm_id"),
    // You can use { mode: "bigint" } if numbers are exceeding js number limitations
    stakeId: bigint("stake_id", { mode: "number" }),
  },
  (table) => {
    return {
      contactsCrmIdKey: unique("contacts_crm_id_key").on(table.crmId),
    };
  }
);

export const coordinatingCouncils = pgTable(
  "coordinating_councils",
  {
    id: serial("id").primaryKey().notNull(),
    name: text("name").notNull(),
  },
  (table) => {
    return {
      coordinatingCouncilsNameKey: unique("coordinating_councils_name_key").on(
        table.name
      ),
    };
  }
);

export const courseHist = pgTable(
  "course_hist",
  {
    id: integer("id").notNull(),
    wkDate: date("wk_date"),
    year: integer("year"),
    yweek: integer("yweek"),
    stakeId: integer("stake_id"),
    offeringId: integer("offering_id"),
    courseId: varchar("course_id"),
  },
  (table) => {
    return {
      yearIdx: uniqueIndex("course_hist_year_idx").on(
        table.wkDate,
        table.courseId
      ),
    };
  }
);

export const enrollments = pgTable(
  "enrollments",
  {
    id: serial("id").primaryKey().notNull(),
    contactId: integer("contact_id").references(() => contacts.id),
    findingSourceId: text("finding_source_id"),
    findingSourceType: text("finding_source_type"),
    findingSourceRaw: text("finding_source_raw"),
    stageId: integer("stage_id").default(0),
    activeTitle: text("active_title"),
    activeDescription: text("active_description"),
    status: text("status"),
    rawClassId: text("raw_class_id"),
    created: timestamp("created", {
      withTimezone: true,
      mode: "string",
    }).defaultNow(),
    fixed: boolean("fixed").default(false).notNull(),
    classId: uuid("class_id").references(() => masterCalendar.id, {
      onDelete: "set null",
      onUpdate: "set null",
    }),
    clickId: text("click_id"),
    ipAddress: text("ip_address"),
    crmId: integer("crm_id"),
    findsourceId: integer("findsource_id"),
    utmSource: text("utm_source"),
    utmMedium: text("utm_medium"),
    utmCampaign: text("utm_campaign"),
    utmAdset: text("utm_adset"),
    utmContent: text("utm_content"),
    url: text("url"),
    stage: text("stage").references(() => stages.status, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    utmId: text("utm_id"),
  },
  (table) => {
    return {
      enrollmentsCrmIdKey: unique("enrollments_crm_id_key").on(table.crmId),
    };
  }
);

export const failedLeads = pgTable(
  "failed_leads",
  {
    id: serial("id").primaryKey().notNull(),
    findingSourceType: text("finding_source_type"),
    findingSourceRaw: text("finding_source_raw"),
    firstName: text("first_name"),
    lastName: text("last_name"),
    over18: boolean("over18"),
    email: text("email"),
    phone: text("phone"),
    address: text("address"),
    zipcode: text("zipcode"),
    member: boolean("member"),
    classId: text("class_id"),
    shortString: text("short_string"),
    eventsString: text("events_string"),
    stageId: integer("stage_id"),
    findingSourceId: text("finding_source_id"),
    message: text("message"),
    contactId: integer("contact_id"),
    dealId: integer("deal_id"),
    classNotFound: boolean("class_not_found").default(false).notNull(),
    clickId: text("click_id"),
    ipAddress: text("ip_address"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    executionId: text("execution_id"),
    resolved: boolean("resolved").default(false).notNull(),
    skipCrm: boolean("skip_crm").default(false).notNull(),
    utmSource: text("utm_source"),
    utmMedium: text("utm_medium"),
    utmCampaign: text("utm_campaign"),
    utmAdset: text("utm_adset"),
    utmContent: text("utm_content"),
    url: text("url"),
    stage: text("stage").references(() => stages.status, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    utmId: text("utm_id"),
  },
  (table) => {
    return {
      failedLeadsExecutionIdKey: unique("failed_leads_execution_id_key").on(
        table.executionId
      ),
    };
  }
);

export const fbAdcampaignTaxonomy = pgTable(
  "fb_adcampaign_taxonomy",
  {
    campaignName: varchar("campaign_name"),
    cId: varchar("c_id"),
    adSet: varchar("ad_set"),
    asId: varchar("as_id"),
    zip: varchar("zip"),
  },
  (table) => {
    return {
      cIdIdx: uniqueIndex("fb_adcampaign_taxonomy_c_id_idx").on(
        table.cId,
        table.asId,
        table.zip
      ),
    };
  }
);

export const fbAdsetWeights = pgTable(
  "fb_adset_weights",
  {
    adsetId: varchar("adset_id"),
    stakeId: integer("stake_id").default(0),
    mindist: real("mindist"),
    costwt: real("costwt"),
  },
  (table) => {
    return {
      adsetIdIdx: uniqueIndex("fb_adset_weights_adset_id_idx").on(
        table.adsetId,
        table.stakeId
      ),
    };
  }
);

export const fbCampaignWeights = pgTable(
  "fb_campaign_weights",
  {
    campaignId: varchar("campaign_id"),
    stakeId: integer("stake_id").default(0),
    mindist: real("mindist"),
    costwt: real("costwt"),
  },
  (table) => {
    return {
      campaignIdIdx: uniqueIndex("fb_campaign_weights_campaign_id_idx").on(
        table.campaignId,
        table.stakeId
      ),
    };
  }
);

export const fbResultsHist = pgTable(
  "fb_results_hist",
  {
    wkStart: date("wk_start"),
    repYear: integer("rep_year"),
    repWeek: integer("rep_week"),
    campaign: varchar("campaign"),
    cId: varchar("c_id"),
    adset: varchar("adset"),
    asId: varchar("as_id"),
    reach: integer("reach").default(0),
    impres: integer("impres").default(0),
    freq: real("freq"),
    curr: varchar("curr"),
    spend: real("spend"),
  },
  (table) => {
    return {
      wkStartIdx: uniqueIndex("fb_results_hist_wk_start_idx").on(
        table.wkStart,
        table.cId,
        table.asId
      ),
    };
  }
);

export const generalAttendance = pgTable("general_attendance", {
  id: serial("id").primaryKey().notNull(),
  classTitle: text("class_title"),
  numberMembers: integer("number_members").default(0),
  numberNonmembers: integer("number_nonmembers").default(0),
  date: date("date").defaultNow(),
  classId: uuid("class_id").references(() => masterCalendar.id),
  wyear: integer("wyear"),
  wweek: integer("wweek"),
});

export const googAdgrp = pgTable(
  "goog_adgrp",
  {
    wkStart: date("wk_start").notNull(),
    repYear: integer("rep_year").notNull(),
    repWeek: integer("rep_week").notNull(),
    campaign: varchar("campaign").notNull(),
    adGroup: varchar("ad_group").notNull(),
    status: varchar("status"),
    statusReason: varchar("status_reason"),
    agType: varchar("ag_type"),
    currency: varchar("currency"),
    cost: real("cost"),
    clicks: integer("clicks"),
    impressions: integer("impressions"),
    ctr: real("ctr"),
    avgCpc: real("avg_cpc"),
  },
  (table) => {
    return {
      wkStartIdx: uniqueIndex("goog_adgrp_wk_start_idx").on(
        table.wkStart,
        table.campaign,
        table.adGroup
      ),
    };
  }
);

export const googlawResultsHist = pgTable(
  "googlaw_results_hist",
  {
    wkStart: date("wk_start"),
    repYear: integer("rep_year"),
    repWeek: integer("rep_week"),
    stakeId: integer("stake_id"),
    advertBenefit: real("advert_benefit"),
    totclicks: integer("totclicks"),
    totimpr: integer("totimpr"),
    ctr: real("ctr"),
    waCpc: real("wa_cpc"),
    numAdLocs: integer("num_ad_locs"),
  },
  (table) => {
    return {
      wkStartIdx: uniqueIndex("googlaw_results_hist_wk_start_idx").on(
        table.wkStart,
        table.stakeId
      ),
    };
  }
);

export const googlocAdWords = pgTable(
  "googloc_ad_words",
  {
    wkStart: date("wk_start"),
    repYear: integer("rep_year"),
    repWeek: integer("rep_week"),
    miles: real("miles"),
    latitude: real("latitude"),
    longitude: real("longitude"),
    zipcode: integer("zipcode"),
    location: varchar("location"),
    campaign: varchar("campaign"),
    currency: varchar("currency"),
    // TODO: failed to parse database type 'money'
    cost: real("cost"),
    clicks: integer("clicks"),
    impressions: integer("impressions"),
    ctr: real("ctr"),
    // TODO: failed to parse database type 'money'
    avgCpc: real("avg_cpc"),
    stkid1: integer("stkid1").default(0),
    stkid2: integer("stkid2").default(0),
    stkid3: integer("stkid3").default(0),
    stkid4: integer("stkid4").default(0),
    stkid5: integer("stkid5").default(0),
    stkdist1: real("stkdist1"),
    stkdist2: real("stkdist2"),
    stkdist3: real("stkdist3"),
    stkdist4: real("stkdist4"),
    stkdist5: real("stkdist5"),
    stkwt1: real("stkwt1"),
    stkwt2: real("stkwt2"),
    stkwt3: real("stkwt3"),
    stkwt4: real("stkwt4"),
    stkwt5: real("stkwt5"),
  },
  (table) => {
    return {
      wkStartIdx: uniqueIndex("googloc_ad_words_wk_start_idx").on(
        table.wkStart,
        table.location,
        table.campaign
      ),
    };
  }
);

export const i18N = pgTable("i18n", {
  key: text("key").primaryKey().notNull(),
  english: text("english"),
  spanish: text("spanish"),
  chinese: text("chinese"),
  french: text("french"),
});

export const leadStageHist = pgTable(
  "lead_stage_hist",
  {
    id: integer("id").notNull(),
    contactId: integer("contact_id").notNull(),
    stageId: integer("stage_id").notNull(),
    firstAt: timestamp("first_at", { mode: "string" }),
    lastAt: timestamp("last_at", { mode: "string" }).defaultNow().notNull(),
  },
  (table) => {
    return {
      contactIdIdx: uniqueIndex("lead_stage_hist_contact_id_idx").on(
        table.contactId,
        table.stageId
      ),
    };
  }
);

export const masterCalendar = pgTable("master_calendar", {
  id: uuid("id").defaultRandom().primaryKey().notNull(),
  active: boolean("active").default(false),
  stake: text("stake"),
  shortString: text("short_string"),
  stakeRepresentativeName: text("stake_representative_name").default(""),
  stakeRepresentativeCalling: text("stake_representative_calling").default(""),
  stakeRepresentativeEmail: text("stake_representative_email").default(""),
  stakeRepresentativePhone: text("stake_representative_phone").default(""),
  classOffering: classOfferingEnum9133E3F1("class_offering"),
  curriculumType: curriculumTypeEnum45Fa7E02("curriculum_type").notNull(),
  classModality: classModalityEnum1Ce1Fab3("class_modality"),
  virtualLink: text("virtual_link"),
  classLanguage: classLanguageEnum280B61Bf("class_language"),
  startDate: timestamp("start_date", { mode: "string" }).defaultNow().notNull(),
  endDate: timestamp("end_date", { mode: "string" }).notNull(),
  datesNotHeld: text("dates_not_held").default("").notNull(),
  daysClassHeld: text("days_class_held"),
  startTime: text("start_time"),
  classEnd: text("class_end"),
  locationAddress: text("location_address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code").notNull(),
  teacher1FirstName: text("teacher_1_first_name").notNull(),
  teacher1LastName: text("teacher_1_last_name").notNull(),
  teacher1Email: text("teacher_1_email").notNull(),
  teacher1Phone: text("teacher_1_phone").notNull(),
  teacher2FirstName: text("teacher_2_first_name"),
  teacher2LastName: text("teacher_2_last_name"),
  teacher2Email: text("teacher_2_email"),
  teacher2Phone: text("teacher_2_phone"),
  eventsString: text("events_string").default("").notNull(),
  created: timestamp("created", {
    withTimezone: true,
    mode: "string",
  }).defaultNow(),
  lat: numeric("lat", { precision: 15, scale: 10 }).default("UL"),
  lng: numeric("lng", { precision: 15, scale: 10 }).default("UL"),
  mapsLink: text("maps_link"),
  addressFormatted: text("address_formatted"),
  region: regionEnumC81B5A8E("region"),
  stakeId: integer("stake_id").references(() => stakes.id),
  correctionNeeded: text("correction_needed"),
  offeringId: integer("offering_id"),
  virtualMeetingId: text("virtual_meeting_id"),
  virtualPasscode: text("virtual_passcode"),
  notes: text("notes"),
});

export const programResultsHist = pgTable(
  "program_results_hist",
  {
    wkStart: date("wk_start"),
    entity: varchar("entity"),
    totenroll: integer("totenroll").default(0),
    totattrept: integer("totattrept").default(0),
    totmembatt: integer("totmembatt").default(0),
    totnonmembatt: integer("totnonmembatt").default(0),
    emergencypreparedness: integer("emergencypreparedness").default(0),
    emotionalresilience: integer("emotionalresilience").default(0),
    englishconnect1: integer("englishconnect1").default(0),
    englishconnect2: integer("englishconnect2").default(0),
    familyhistorygenealogy: integer("familyhistorygenealogy").default(0),
    personalfinance: integer("personalfinance").default(0),
    fbReach: integer("fb_reach").default(0),
    fbImpress: integer("fb_impress").default(0),
    fbSpend: real("fb_spend"),
    googSpend: real("goog_spend"),
    googClicks: integer("goog_clicks"),
    googImpress: integer("goog_impress"),
    facebook: integer("facebook"),
    google: integer("google"),
    localad: integer("localad"),
    churchMember: integer("church_member"),
    other: integer("other"),
    notKnown: integer("not_known"),
    website: integer("website"),
    lastWritten: timestamp("last_written", { mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => {
    return {
      wkStartIdx: uniqueIndex("program_results_hist_wk_start_idx").on(
        table.wkStart,
        table.entity
      ),
    };
  }
);

export const stakeParticHist = pgTable(
  "stake_partic_hist",
  {
    wkStart: date("wk_start"),
    numStakes: integer("num_stakes").default(0),
    numCourses: integer("num_courses").default(0),
    s001: integer("s001").default(0),
    s002: integer("s002").default(0),
    s003: integer("s003").default(0),
    s004: integer("s004").default(0),
    s005: integer("s005").default(0),
    s006: integer("s006").default(0),
    s007: integer("s007").default(0),
    s008: integer("s008").default(0),
    s009: integer("s009").default(0),
    s010: integer("s010").default(0),
    s011: integer("s011").default(0),
    s012: integer("s012").default(0),
    s013: integer("s013").default(0),
    s014: integer("s014").default(0),
    s015: integer("s015").default(0),
    s016: integer("s016").default(0),
    s017: integer("s017").default(0),
    s018: integer("s018").default(0),
    s019: integer("s019").default(0),
    s020: integer("s020").default(0),
    s021: integer("s021").default(0),
    s022: integer("s022").default(0),
    s023: integer("s023").default(0),
    s024: integer("s024").default(0),
    s025: integer("s025").default(0),
    s026: integer("s026").default(0),
    s027: integer("s027").default(0),
    s028: integer("s028").default(0),
    s029: integer("s029").default(0),
    s030: integer("s030").default(0),
    s031: integer("s031").default(0),
    s032: integer("s032").default(0),
    s033: integer("s033").default(0),
    s034: integer("s034").default(0),
    s035: integer("s035").default(0),
    s036: integer("s036").default(0),
    s037: integer("s037").default(0),
    s038: integer("s038").default(0),
    s039: integer("s039").default(0),
    s040: integer("s040").default(0),
    s041: integer("s041").default(0),
    s042: integer("s042").default(0),
    s043: integer("s043").default(0),
    s044: integer("s044").default(0),
    s045: integer("s045").default(0),
    s046: integer("s046").default(0),
    s047: integer("s047").default(0),
    s048: integer("s048").default(0),
    s049: integer("s049").default(0),
    s050: integer("s050").default(0),
    s051: integer("s051").default(0),
    s052: integer("s052").default(0),
    s053: integer("s053").default(0),
    s054: integer("s054").default(0),
  },
  (table) => {
    return {
      wkStartIdx: uniqueIndex("stake_partic_hist_wk_start_idx").on(
        table.wkStart
      ),
    };
  }
);

export const stakes = pgTable(
  "stakes",
  {
    id: integer("id").primaryKey().notNull(),
    stake: text("stake").default("").notNull(),
    stakeRepresentativeName: text("stake_representative_name")
      .default("")
      .notNull(),
    stakeRepresentativeCalling: text("stake_representative_calling")
      .default("")
      .notNull(),
    stakeRepresentativeEmail: text("stake_representative_email")
      .default("")
      .notNull(),
    stakeRepresentativePhone: text("stake_representative_phone")
      .default("")
      .notNull(),
    locationAddress: text("location_address"),
    city: text("city"),
    state: text("state").default("").notNull(),
    zipCode: text("zip_code"),
    lat: numeric("lat", { precision: 15, scale: 10 }).default("0"),
    lng: numeric("lng", { precision: 15, scale: 10 }).default("0"),
    mapsLink: text("maps_link"),
    addressFormatted: text("address_formatted"),
    region: regionEnum43F3E3E1("region").notNull(),
    notes: text("notes"),
    ccId: integer("cc_id").references(() => coordinatingCouncils.id),
  },
  (table) => {
    return {
      stakeIdx: uniqueIndex("stakes_stake_idx").on(table.stake),
    };
  }
);

export const ziptogps = pgTable("ziptogps", {
  zip: char("zip", { length: 6 }),
  lat: doublePrecision("lat"),
  lng: doublePrecision("lng"),
});

export const stages = pgTable(
  "stages",
  {
    stageId: integer("stage_id").notNull(),
    stageText: varchar("stage_text"),
    status: text("status").primaryKey().notNull(),
  },
  (table) => {
    return {
      stagesStageIdKey: unique("stages_stage_id_key").on(table.stageId),
      stagesStatusKey: unique("stages_status_key").on(table.status),
    };
  }
);

const postgresUrl =
  "postgresql://retool:Nf6qlw4FRjCi@ep-empty-salad-797560.us-west-2.retooldb.com/retool?sslmode=require";

const client = postgres(postgresUrl);

export const db = drizzle(client, {
  schema: {
    masterCalendar,
  },
});
