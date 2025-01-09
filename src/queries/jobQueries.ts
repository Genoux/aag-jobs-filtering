// queries/jobQueries.ts
import { SearchQuery } from '@localtypes/JobsPikr';

export interface QueryDefinition {
  name: string;
  description: string;
  buildQuery: () => SearchQuery;
}

export const jobQueries: Record<string, QueryDefinition> = {
  healthcareJobs: {
    name: "Healthcare Jobs in US",
    description: "Healthcare positions across the United States filtered by state and job title",
    buildQuery: () => ({
      size: 10,
      search_query_json: {
        bool: {
          must: [
            {
              query_string: {
                fields: ["job_title", "inferred_job_title"],
                query: `
                  "Nurse Practitioner" OR "Registered Nurse" OR "Physician" OR 
                  "Surgeon" OR "Pharmacist" OR "Medical Assistant" OR 
                  "Physical Therapist" OR "Occupational Therapist" OR 
                  "Healthcare Administrator" OR "Medical Billing Specialist" OR 
                  "Radiologic Technologist" OR "Clinical Laboratory Technician" OR 
                  "Respiratory Therapist" OR "Speech-Language Pathologist" OR 
                  "Nutritionist" OR "Dietitian" OR "Certified Nursing Assistant (CNA)" OR 
                  "Home Health Aide" OR "Paramedic/EMT" OR "Medical Records Specialist" OR 
                  "Cardiologist" OR "Psychiatrist" OR "Oncologist" OR "Orthopedic Surgeon" OR 
                  "Obstetrician" OR "General Practitioner" OR "Medical Assistant" OR 
                  "Laboratory Technician" OR "Ultrasound Technician" OR 
                  "Clinical Nurse Specialist" OR "Infection Control Specialist" OR 
                  "Surgical Technician" OR "Chiropractor" OR "Optometrist" OR "Dentist" OR 
                  "Veterinarian" OR "EMT" OR "Medical Equipment Technician" OR 
                  "Palliative Care Specialist" OR "Hospice Care Nurse" OR 
                  "Telehealth Nurse" OR "Rehabilitation Counselor" OR 
                  "Medical Scribe"
                `,
              },
            },
            {
              query_string: {
                default_field: "has_expired",
                query: "false",
              },
            },
            {
              bool: {
                should: [
                  {
                    exists: {
                      field: "contact_email",
                    },
                  },
                  {
                    exists: {
                      field: "apply_url",
                    },
                  },
                ],
              },
            },
            {
              range: {
                post_date: {
                  gte: new Date(new Date().setDate(new Date().getDate() - 14)).toISOString().split("T")[0],
                  lte: new Date().toISOString().split("T")[0],
                },
              },
            },
            // {
            //   exists: {
            //     field: "inferred_salary_from",
            //   },
            // },
            {
              bool: {
                should: [
                  ...[
                    "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado",
                    "Connecticut", "Delaware", "Florida", "Georgia", "Hawaii", "Idaho",
                    "Illinois", "Indiana", "Iowa", "Kansas", "Kentucky", "Louisiana",
                    "Maine", "Maryland", "Massachusetts", "Michigan", "Minnesota", "Mississippi",
                    "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire", "New Jersey",
                    "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio", "Oklahoma",
                    "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota",
                    "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington",
                    "West Virginia", "Wisconsin", "Wyoming"
                  ].map((state) => ({
                    bool: {
                      must: [
                        {
                          query_string: {
                            fields: ["inferred_country"],
                            query: `"United States" OR "USA" OR "US"`,
                          },
                        },
                        {
                          query_string: {
                            fields: ["inferred_state"],
                            query: `"${state}" OR "${state.slice(0, 2).toLowerCase()}"`,
                          },
                        },
                      ],
                    },
                  })),
                ],
              },
            },
          ],
        },
      },
    }),
  },
};
