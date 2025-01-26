// queries/jobQueries.ts
import { SearchQuery } from '@localtypes/jobspikr'

export interface QueryDefinition {
  name: string
  description: string
  buildQuery: () => SearchQuery
}

export const jobQueries: Record<string, QueryDefinition> = {
  healthcareJobs: {
    name: 'Healthcare Jobs in US',
    description: 'Healthcare positions across the United States',
    buildQuery: () => ({
      format: "json",
      size: 100,
      dataset: ["job_board"],
      search_query_json: {
        bool: {
          must: [
            {
              query_string: {
                fields: ['job_title', 'inferred_job_title'],
                query: `
                  "physician" OR "Podiatrist" OR "Physician Assistant" OR 
                  "Certified Anesthesia Assistant" OR "Certified Clinical Perfusionist" OR 
                  "Certified Nurse Midwife" OR "Clinical Nurse Specialist" OR 
                  "Certified Registered Nurse Anesthetist" OR "Diagnostic Nurse Assistant" OR 
                  "Doctor of Nursing Practice" OR "Licensed Clinical Social Worker" OR 
                  "Licensed Marriage and Family Therapist" OR "Nurse Practitioner" OR 
                  "Researcher or Academic Expert" OR "PhD" OR "Doctor of Psychology" OR 
                  "Surgeon" OR "Dentist" OR "Medical Assistant" OR "Pharmacist" OR 
                  "Physical Therapist" OR "Occupational Therapist" OR 
                  "Speech-Language Pathologist" OR "Radiologic Technologist" OR 
                  "Medical Laboratory Technician" OR "Optometrist" OR "Clinical Psychologist" OR 
                  "Dietitian/Nutritionist" OR "Respiratory Therapist" OR "Anesthesiologist" OR 
                  "Cardiovascular Technologist" OR "Registered Nurse" OR "Healthcare Administrator" OR 
                  "Medical Billing Specialist" OR "Home Health Aide" OR "Paramedic/EMT" OR 
                  "Medical Records Specialist" OR "Cardiologist" OR "Psychiatrist" OR 
                  "Oncologist" OR "Orthopedic Surgeon" OR "Obstetrician" OR 
                  "General Practitioner" OR "Laboratory Technician" OR "Ultrasound Technician" OR 
                  "Infection Control Specialist" OR "Surgical Technician" OR "Chiropractor" OR 
                  "Veterinarian" OR "Medical Equipment Technician" OR "Palliative Care Specialist" OR 
                  "Hospice Care Nurse" OR "Telehealth Nurse" OR "Rehabilitation Counselor" OR 
                  "Medical Scribe"
                `
              }
            },
            {
              query_string: {
                default_field: 'category',
                query: 'physician OR nurse-practitioner OR physician-assistant OR crna OR assistant OR dnp OR other OR phd OR dna OR pa OR caa OR ccp OR cns OR psyd OR student OR lmft OR lcsw OR cnm'
              }
            },
            {
              query_string: {
                default_field: 'job_type',
                query: '*'
              }
            },
            {
              query_string: {
                default_field: 'company_name',
                query: '*'
              }
            },
            {
              bool: {
                should: [
                  {
                    bool: {
                      must: [
                        {
                          query_string: {
                            fields: ['inferred_country'],
                            query: '"United States" OR "USA" OR "US"'
                          }
                        }
                      ]
                    }
                  }
                ]
              }
            },
            {
              query_string: {
                fields: ['job_description'],
                query: `
                  Diagnoses and treats illnesses OR NPs can diagnose and prescribe OR 
                  Provides patient care OR administers treatments OR educates patients OR 
                  Supports healthcare providers OR Dispenses medications OR 
                  advises patients on proper use and potential side effects OR 
                  Helps patients improve mobility OR manage pain OR Prepares for surgeries OR 
                  sterilizes instruments OR assists surgeons OR Manages patient records OR 
                  ensures data accuracy OR Advises patients on healthy eating OR 
                  Treats breathing disorders using therapy OR 
                  Translates healthcare services into codes for insurance claims OR 
                  Oversees clinical trials OR Helps patients manage emotional OR 
                  Provides eye exams OR diagnoses vision problems OR prescribes corrective lenses OR 
                  Treats musculoskeletal issues OR spinal manipulation OR treating patients with mental health
                `
              }
            },
            {
              range: {
                post_date: {
                  gte: new Date(new Date().setDate(new Date().getDate() - 14))
                    .toISOString()
                    .split('T')[0],
                  lte: new Date().toISOString().split('T')[0],
                }
              }
            }
          ],
          must_not: [
            {
              query_string: {
                default_field: 'job_board',
                query: 'company_website'
              }
            },
            {
              query_string: {
                default_field: 'company_name',
                query: 'Unspecified'
              }
            }
          ]
        }
      }
    })
  }
}