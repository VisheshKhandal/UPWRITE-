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
  <Card className="overflow-hidden p-0">
    <div className="relative h-44 bg-gradient-to-r from-accent-500/20 via-ink-100 to-emerald-200 dark:from-accent-500/10 dark:via-ink-900 dark:to-emerald-950">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(59,130,246,0.15),_transparent_35%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.15),_transparent_35%)]" />
    </div>
    <div className="relative -mt-16 px-6 pb-6 sm:px-8">
      <div className="flex flex-col gap-5 rounded-[1.25rem] border border-ink-200 bg-white/95 px-6 py-5 shadow-panel dark:border-ink-800 dark:bg-ink-950/95 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <Avatar
            src={profile.avatar?.url}
            name={profile.name}
            size="xl"
            className="ring-4 ring-white shadow-xl dark:ring-ink-950"
          />

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-3xl font-semibold tracking-tight text-ink-950 dark:text-ink-50">
                {profile.name}
              </h1>
              {profile.verified ? (
                <Badge className="inline-flex items-center gap-1 border-accent-200 bg-accent-100 text-accent-700 dark:border-accent-700 dark:bg-accent-950/80 dark:text-accent-200">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Verified
                </Badge>
              ) : null}
            </div>
            <p className="mt-1 text-sm text-ink-500">@{profile.username}</p>
            <div className="mt-3 max-w-2xl rounded-lg border border-ink-200 bg-ink-50 px-4 py-3 dark:border-ink-800 dark:bg-ink-900/70">
              <p className="text-sm leading-6 text-ink-700 dark:text-ink-300">
                {profile.bio ?? "This creator is still shaping their Upwrite profile."}
              </p>
            </div>
            <div className="mt-4 flex flex-wrap gap-3 text-sm text-ink-500">
              {profile.location ? (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {profile.location}
                </span>
              ) : null}
              <span className="inline-flex items-center gap-1">
                <Globe className="h-4 w-4" />
                Joined {new Date(profile.createdAt ?? Date.now()).toLocaleDateString()}
              </span>
              {profile.socialLinks?.website ? (
                <a
                  href={profile.socialLinks.website}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-accent-700 hover:text-accent-900 dark:text-accent-300 dark:hover:text-accent-100"
                >
                  <ExternalLink className="h-4 w-4" />
                  Website
                </a>
              ) : null}
              {profile.socialLinks?.github ? (
                <a href={profile.socialLinks.github} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-ink-600 hover:text-ink-950 dark:text-ink-300 dark:hover:text-ink-50">
                  <Github className="h-4 w-4" /> GitHub
                </a>
              ) : null}
              {profile.socialLinks?.linkedin ? (
                <a href={profile.socialLinks.linkedin} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-ink-600 hover:text-ink-950 dark:text-ink-300 dark:hover:text-ink-50">
                  <Linkedin className="h-4 w-4" /> LinkedIn
                </a>
              ) : null}
              {profile.socialLinks?.twitter ? (
                <a href={profile.socialLinks.twitter} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-ink-600 hover:text-ink-950 dark:text-ink-300 dark:hover:text-ink-50">
                  <Twitter className="h-4 w-4" /> Twitter
                </a>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {isOwnProfile ? (
            <Button variant="secondary" onClick={onEdit}>Edit profile</Button>
          ) : (
            <FollowButton userId={profile._id} username={profile.username} following={following ?? profile.isFollowing} />
          )}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {profile.skills?.map((skill) => (
          <Badge key={skill}>{skill}</Badge>
        ))}
        {profile.interests?.map((interest) => (
          <Badge key={interest}>{interest}</Badge>
        ))}
      </div>
    </div>
  </Card>
);
