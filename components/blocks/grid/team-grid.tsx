import { cn } from "@/lib/utils";
import Image from "next/image";
import { urlFor } from "@/sanity/lib/image";
import PortableText from "@/components/portable-text-renderer";
import { fetchRegionalCommunityTeamMembers } from "@/sanity/queries/regional-community-team";

interface TeamMember {
  _id: string;
  name: string;
  slug?: { current: string };
  image?: {
    asset?: {
      _id: string;
      metadata?: {
        lqip?: string;
        dimensions?: {
          width: number;
          height: number;
        };
      };
    };
    alt?: string;
  };
  organizationalAffiliation?: string;
  communityMemberships?: Array<{
    community: {
      _id: string;
      name?: { [key: string]: string };
    };
    role?: string;
  }>;
}

// Props when used as a block in contentFlow
interface TeamGridBlockProps {
  _type: 'team-grid';
  _key: string;
  mode?: 'manual' | 'dynamic';
  manualMembers?: TeamMember[];
  regionalCommunity?: {
    _id: string;
    name: any;
    slug: { current: string };
  };
  gridColumns?: string;
  showTitle?: boolean;
  title?: string;
  showDescription?: boolean;
  description?: any;
  displayRole?: boolean;
  displayAffiliation?: boolean;
  locale?: string;
  isRTL?: boolean;
  userId?: string;
}

// Props when used in template (legacy)
interface TeamGridTemplateProps {
  teamGrid?: {
    mode?: "manual" | "dynamic";
    manualMembers?: TeamMember[];
    gridColumns?: string;
    showTitle?: boolean;
    title?: string;
    showDescription?: boolean;
    description?: any;
    displayRole?: boolean;
    displayAffiliation?: boolean;
  };
  members?: TeamMember[];
  regionalCommunityId?: string;
  locale?: string;
}

type TeamGridProps = TeamGridBlockProps | TeamGridTemplateProps;

// Type guard to check if props are block props
function isBlockProps(props: TeamGridProps): props is TeamGridBlockProps {
  return '_type' in props && props._type === 'team-grid';
}

export default async function TeamGrid(props: TeamGridProps) {
  let members: TeamMember[] = [];
  let gridColumns = "grid-cols-4";
  let showTitle = true;
  let title = "Our Team";
  let showDescription = false;
  let description: any = null;
  let displayRole = true;
  let displayAffiliation = true;
  let regionalCommunityId: string | undefined;
  let mode: 'manual' | 'dynamic' = 'manual';

  // Extract values based on prop type
  if (isBlockProps(props)) {
    // Block props (from contentFlow)
    mode = props.mode || 'manual';
    gridColumns = props.gridColumns || 'grid-cols-4';
    showTitle = props.showTitle ?? true;
    title = props.title || 'Our Team';
    showDescription = props.showDescription ?? false;
    description = props.description;
    displayRole = props.displayRole ?? true;
    displayAffiliation = props.displayAffiliation ?? true;
    regionalCommunityId = props.regionalCommunity?._id;

    // Get members based on mode
    if (mode === 'manual') {
      members = props.manualMembers || [];
    } else if (mode === 'dynamic' && props.regionalCommunity?._id) {
      // Fetch dynamic members (Server Component - Next.js 15)
      try {
        const dynamicMembers = await fetchRegionalCommunityTeamMembers({
          communityId: props.regionalCommunity._id,
          limit: 20
        });
        members = dynamicMembers || [];
      } catch (error) {
        console.error('Error fetching team members:', error);
        members = [];
      }
    }
  } else {
    // Template props (legacy)
    const { teamGrid, members: templateMembers, regionalCommunityId: templateRegionalId } = props;

    if (!teamGrid) return null;

    mode = teamGrid.mode || 'manual';
    gridColumns = teamGrid.gridColumns || 'grid-cols-4';
    showTitle = teamGrid.showTitle ?? true;
    title = teamGrid.title || 'Our Team';
    showDescription = teamGrid.showDescription ?? false;
    description = teamGrid.description;
    displayRole = teamGrid.displayRole ?? true;
    displayAffiliation = teamGrid.displayAffiliation ?? true;
    regionalCommunityId = templateRegionalId;

    members = mode === 'manual'
      ? teamGrid.manualMembers || []
      : templateMembers || [];
  }

  // Don't render if no members
  if (!members || members.length === 0) {
    return null;
  }

  // Get role for a specific community
  const getMemberRole = (member: TeamMember) => {
    if (!displayRole || !member.communityMemberships || !regionalCommunityId) {
      return null;
    }

    const membership = member.communityMemberships.find(
      (m) => m.community._id === regionalCommunityId
    );

    return membership?.role;
  };

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        {showTitle && (
          <div className="mb-10 sm:mb-12 lg:mb-16 text-center">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
              {title}
            </h2>
            {showDescription && description && (
              <div className="prose prose-lg max-w-3xl mx-auto text-muted-foreground">
                <PortableText value={description} />
              </div>
            )}
          </div>
        )}

        {/* Team Grid */}
        <div
          className={cn(
            "grid gap-6 sm:gap-8 lg:gap-10",
            gridColumns === "grid-cols-2" && "grid-cols-1 sm:grid-cols-2",
            gridColumns === "grid-cols-3" && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
            gridColumns === "grid-cols-4" && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
            gridColumns === "grid-cols-5" && "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
          )}
        >
          {members.map((member) => {
            const role = getMemberRole(member);

            return (
              <div
                key={member._id}
                className="flex flex-col items-center text-center group"
              >
                {/* Avatar */}
                <div className="mb-4 relative">
                  <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden bg-muted ring-4 ring-background shadow-lg transition-all duration-300 group-hover:ring-primary group-hover:shadow-xl">
                    {member.image?.asset?._id ? (
                      <Image
                        src={urlFor(member.image).url()}
                        alt={member.image.alt || member.name}
                        placeholder={member.image?.asset?.metadata?.lqip ? "blur" : undefined}
                        blurDataURL={member.image?.asset?.metadata?.lqip || ""}
                        width={160}
                        height={160}
                        className="object-cover w-full h-full"
                        sizes="(min-width: 1280px) 160px, (min-width: 640px) 160px, 128px"
                        quality={90}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-primary/10">
                        <span className="text-4xl sm:text-5xl font-bold text-primary">
                          {member.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Name */}
                <h3 className="text-lg sm:text-xl font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
                  {member.name}
                </h3>

                {/* Role */}
                {displayRole && role && (
                  <p className="text-sm sm:text-base font-medium text-primary mb-1">
                    {role}
                  </p>
                )}

                {/* Affiliation */}
                {displayAffiliation && member.organizationalAffiliation && (
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {member.organizationalAffiliation}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
