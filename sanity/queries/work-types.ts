import { groq } from 'next-sanity'

// Query for work types with field-level internationalization
export const workTypesQuery = groq`
  *[_type == "workType" && isActive == true] | order(order asc, key asc) {
    _id,
    key,
    "label": label[_key == $locale][0].value,
    "labelFallback": coalesce(label[_key == $locale][0].value, label[_key == "en"][0].value, key),
    "description": description[_key == $locale][0].value,
    "descriptionFallback": coalesce(description[_key == $locale][0].value, description[_key == "en"][0].value, ""),
    order,
    isActive
  }
`

// Query for expertise areas with field-level internationalization
export const expertiseAreasQuery = groq`
  *[_type == "expertiseArea" && isActive == true] | order(order asc, key asc) {
    _id,
    key,
    "label": label[_key == $locale][0].value,
    "labelFallback": coalesce(label[_key == $locale][0].value, label[_key == "en"][0].value, key),
    "description": description[_key == $locale][0].value,
    "descriptionFallback": coalesce(description[_key == $locale][0].value, description[_key == "en"][0].value, ""),
    order,
    isActive
  }
`

// Combined query for both work types and expertise areas
export const userManagementOptionsQuery = groq`
{
  "workTypes": *[_type == "workType" && isActive == true] | order(order asc, key asc) {
    _id,
    key,
    "label": coalesce(label[_key == $locale][0].value, label[_key == "en"][0].value, key),
    "description": coalesce(description[_key == $locale][0].value, description[_key == "en"][0].value, ""),
    order
  },
  "expertiseAreas": *[_type == "expertiseArea" && isActive == true] | order(order asc, key asc) {
    _id,
    key,
    "label": coalesce(label[_key == $locale][0].value, label[_key == "en"][0].value, key),
    "description": coalesce(description[_key == $locale][0].value, description[_key == "en"][0].value, ""),
    order
  }
}`

// Query to get all work types and expertise areas for synchronization
export const allUserManagementOptionsQuery = groq`
{
  "workTypes": *[_type == "workType"] | order(order asc, key asc) {
    _id,
    key,
    label,
    description,
    order,
    isActive
  },
  "expertiseAreas": *[_type == "expertiseArea"] | order(order asc, key asc) {
    _id,
    key,
    label,
    description,
    order,
    isActive
  }
}`