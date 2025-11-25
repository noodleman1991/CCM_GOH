import fs from 'fs';

const users = JSON.parse(fs.readFileSync('supabase-users.json', 'utf-8'));

console.log('📊 User Data Analysis\n');
console.log(`Total users: ${users.length}`);

const withImages = users.filter(u => u.avatar_url || u.profile_pic).length;
const withOnboarding = users.filter(u => u.has_onboarded === true).length;
const withWorkTypes = users.filter(u => u.types_of_work && u.types_of_work.length > 0).length;
const withExpertise = users.filter(u => u.expertise && u.expertise.length > 0).length;
const withFirstName = users.filter(u => u.first_name || u.raw_user_meta_data?.first_name).length;
const withCountry = users.filter(u => u.country).length;

console.log(`Users with profile images: ${withImages}`);
console.log(`Users who completed onboarding: ${withOnboarding}`);
console.log(`Users with work types: ${withWorkTypes}`);
console.log(`Users with expertise: ${withExpertise}`);
console.log(`Users with first name: ${withFirstName}`);
console.log(`Users with country: ${withCountry}`);

// Find a complete user
const completeUser = users.find(u =>
  u.types_of_work && u.types_of_work.length > 0 &&
  u.expertise && u.expertise.length > 0 &&
  (u.avatar_url || u.profile_pic)
);

if (completeUser) {
  console.log('\n📝 Sample complete user profile:');
  console.log(JSON.stringify(completeUser, null, 2));
}
