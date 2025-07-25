
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 6.6.0
 * Query Engine version: f676762280b54cd07c770017ed3711ddde35f37a
 */
Prisma.prismaVersion = {
  client: "6.6.0",
  engine: "f676762280b54cd07c770017ed3711ddde35f37a"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag.ts
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.AccountScalarFieldEnum = {
  id: 'id',
  userId: 'userId',
  type: 'type',
  provider: 'provider',
  providerAccountId: 'providerAccountId',
  refresh_token: 'refresh_token',
  access_token: 'access_token',
  expires_at: 'expires_at',
  token_type: 'token_type',
  scope: 'scope',
  id_token: 'id_token',
  session_state: 'session_state',
  createdAt: 'createdAt'
};

exports.Prisma.SessionScalarFieldEnum = {
  id: 'id',
  sessionToken: 'sessionToken',
  userId: 'userId',
  expires: 'expires'
};

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  email: 'email',
  emailVerified: 'emailVerified',
  image: 'image',
  firstName: 'firstName',
  lastName: 'lastName',
  username: 'username',
  bio: 'bio',
  ageGroup: 'ageGroup',
  country: 'country',
  city: 'city',
  workTypes: 'workTypes',
  expertiseAreas: 'expertiseAreas',
  organization: 'organization',
  position: 'position',
  workBio: 'workBio',
  personalWebsite: 'personalWebsite',
  linkedinProfile: 'linkedinProfile',
  twitterHandle: 'twitterHandle',
  role: 'role',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.CommunityScalarFieldEnum = {
  id: 'id',
  name: 'name',
  description: 'description',
  type: 'type',
  regionalName: 'regionalName',
  specialName: 'specialName',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.UserCommunityScalarFieldEnum = {
  userId: 'userId',
  communityId: 'communityId',
  role: 'role'
};

exports.Prisma.ContentScalarFieldEnum = {
  id: 'id',
  title: 'title',
  body: 'body',
  communityId: 'communityId',
  authorId: 'authorId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.RecentWorkScalarFieldEnum = {
  id: 'id',
  title: 'title',
  description: 'description',
  link: 'link',
  isOngoing: 'isOngoing',
  startDate: 'startDate',
  endDate: 'endDate',
  userId: 'userId',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};
exports.AgeGroup = exports.$Enums.AgeGroup = {
  UNDER_18: 'UNDER_18',
  ABOVE_18: 'ABOVE_18'
};

exports.Role = exports.$Enums.Role = {
  community_member: 'community_member',
  community_editor: 'community_editor',
  team_editor: 'team_editor',
  admin: 'admin'
};

exports.WorkType = exports.$Enums.WorkType = {
  RESEARCH: 'RESEARCH',
  POLICY: 'POLICY',
  LIVED_EXPERIENCE_EXPERT: 'LIVED_EXPERIENCE_EXPERT',
  NGO: 'NGO',
  COMMUNITY_ORGANIZATION: 'COMMUNITY_ORGANIZATION',
  EDUCATION_TEACHING: 'EDUCATION_TEACHING'
};

exports.ExpertiseArea = exports.$Enums.ExpertiseArea = {
  CLIMATE_CHANGE: 'CLIMATE_CHANGE',
  MENTAL_HEALTH: 'MENTAL_HEALTH',
  HEALTH: 'HEALTH'
};

exports.CommunityType = exports.$Enums.CommunityType = {
  REGIONAL: 'REGIONAL',
  SPECIAL: 'SPECIAL'
};

exports.RegionalCommunityName = exports.$Enums.RegionalCommunityName = {
  SUB_SAHARAN_AFRICA: 'SUB_SAHARAN_AFRICA',
  NORTHERN_AFRICA_AND_WESTERN_ASIA: 'NORTHERN_AFRICA_AND_WESTERN_ASIA',
  CENTRAL_AND_SOUTHERN_ASIA: 'CENTRAL_AND_SOUTHERN_ASIA',
  EASTERN_AND_SOUTH_EASTERN_ASIA: 'EASTERN_AND_SOUTH_EASTERN_ASIA',
  LATIN_AMERICA_AND_THE_CARIBBEAN: 'LATIN_AMERICA_AND_THE_CARIBBEAN',
  OCEANIA: 'OCEANIA',
  EUROPE_AND_NORTH_AMERICA: 'EUROPE_AND_NORTH_AMERICA'
};

exports.SpecialCommunityName = exports.$Enums.SpecialCommunityName = {
  YOUTH: 'YOUTH',
  INDIGENOUS: 'INDIGENOUS',
  FARMER_AND_FISHER: 'FARMER_AND_FISHER'
};

exports.Prisma.ModelName = {
  Account: 'Account',
  Session: 'Session',
  User: 'User',
  Community: 'Community',
  UserCommunity: 'UserCommunity',
  Content: 'Content',
  RecentWork: 'RecentWork'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }

        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
