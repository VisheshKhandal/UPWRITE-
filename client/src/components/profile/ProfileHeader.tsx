import { CheckCircle2, ExternalLink, Github, Globe, Linkedin, MapPin, Twitter } from "lucide-react";
import type { User } from "../../types/models";
import { Avatar } from "../ui/Avatar";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { FollowButton } from "./FollowButton";

export const ProfileHeader = ({
  profile,
  isOwnProfile,
  onEdit,
  following
}: {
  profile: User;
  isOwnProfile?: boolean;
  onEdit?: () => void;
  following?: boolean;
}) => (
  <Card className="p-6 sm:p-8">
    <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <Avatar
          src={profile.avatar?.url}
          name={profile.name}
          size="xl"
        />

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="type-page-title truncate">
              {profile.name}
            </h1>
            {profile.verified ? (
              <Badge className="border-accent bg-accent-subtle text-content-accent">
                <CheckCircle2 className="h-3.5 w-3.5" /> Verified
              </Badge>
            ) : null}
          </div>
          <p className="type-meta mt-0.5">@{profile.username}</p>
          <p className="type-body mt-3 max-w-2xl">
            {profile.bio ?? "This creator is still shaping their Upwrite profile."}
          </p>
          <div className="type-meta mt-4 flex flex-wrap gap-4">
            {profile.location ? (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                {profile.location}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1.5">
              <Globe className="h-4 w-4" />
              Joined {new Date(profile.createdAt ?? Date.now()).toLocaleDateString()}
            </span>
            {profile.socialLinks?.website ? (
              <a
                href={profile.socialLinks.website}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-content-accent hover:underline"
              >
                <ExternalLink className="h-4 w-4" />
                Website
              </a>
            ) : null}
            {profile.socialLinks?.github ? (
              <a href={profile.socialLinks.github} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-content-secondary hover:text-content-primary">
                <Github className="h-4 w-4" /> GitHub
              </a>
            ) : null}
            {profile.socialLinks?.linkedin ? (
              <a href={profile.socialLinks.linkedin} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-content-secondary hover:text-content-primary">
                <Linkedin className="h-4 w-4" /> LinkedIn
              </a>
            ) : null}
            {profile.socialLinks?.twitter ? (
              <a href={profile.socialLinks.twitter} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-content-secondary hover:text-content-primary">
                <Twitter className="h-4 w-4" /> Twitter
              </a>
            ) : null}
          </div>
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap gap-2">
        {isOwnProfile ? (
          <Button variant="secondary" onClick={onEdit}>Edit profile</Button>
        ) : (
          <FollowButton userId={profile._id} username={profile.username} following={following ?? profile.isFollowing} />
        )}
      </div>
    </div>

    {(profile.skills?.length || profile.interests?.length) ? (
      <div className="mt-5 flex flex-wrap gap-2 border-t border-subtle pt-4">
        {profile.skills?.map((skill) => (
          <Badge key={skill}>{skill}</Badge>
        ))}
        {profile.interests?.map((interest) => (
          <Badge key={interest}>{interest}</Badge>
        ))}
      </div>
    ) : null}
  </Card>
);
