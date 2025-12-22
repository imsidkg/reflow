"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { useMemo } from "react";
import { generateGradientThumbnail } from "@/lib/project-thumbnail";

interface ProjectViewProps {
  projects: Project[];
}

export default function ProjectView({ projects }: ProjectViewProps) {
  const projectThumbnails = useMemo(() => {
    return projects.reduce((acc, project) => {
      acc[project.id] = generateGradientThumbnail();
      return acc;
    }, {} as Record<string, string>);
  }, [projects]);

  return (
    <div className="p-8 pt-24">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-white">Your Projects</h1>
        <p className="text-sm text-zinc-400 mt-1">
          Manage your design projects and continue where you left off.
        </p>
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <p className="text-zinc-400">No projects yet.</p>
          <p className="text-zinc-500 text-sm mt-1">
            Create your first project to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/dashboard/canvas?project=${project.id}`}
              className="group"
            >
              <div className="relative aspect-[3/2] rounded-lg overflow-hidden border border-white/[0.08] transition-all duration-200 group-hover:border-white/[0.2] group-hover:scale-[1.02]">
                <img
                  src={projectThumbnails[project.id]}
                  alt={project.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="mt-3">
                <h3 className="text-sm font-medium text-white group-hover:text-zinc-200 transition-colors">
                  {project.name}
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  {formatDistanceToNow(new Date(project.updatedAt), {
                    addSuffix: true,
                  })}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
