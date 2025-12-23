"use client";

import { useState, useEffect } from "react";
import ProjectView from "@/components/(dashboard)/projects/project-view";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { toast } from "sonner";
import { Plus, Loader2 } from "lucide-react";

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  async function fetchProjects() {
    setIsLoading(true);
    try {
      const { data } = await axios.get("/api/project", {
        withCredentials: true,
      });
      setProjects(data.projects);
    } catch (error) {
      toast.error("Failed to load projects");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAddProject() {
    setIsCreating(true);
    try {
      const { data } = await axios.post(
        "/api/project",
        {},
        { withCredentials: true }
      );
      setProjects((prev) => [data.project, ...prev]);
      toast.success(`Created "${data.project.name}"`);
    } catch (error) {
      toast.error("Failed to create project");
    } finally {
      setIsCreating(false);
    }
  }

  async function handleDeleteProject(projectId: string) {
    const project = projects.find((p) => p.id === projectId);
    try {
      await axios.delete(`/api/project/${projectId}`, {
        withCredentials: true,
      });
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
      toast.success(`Deleted "${project?.name}"`);
    } catch (error) {
      toast.error("Failed to delete project");
    }
  }

  const addButton = (
    <Button
      onClick={handleAddProject}
      disabled={isCreating}
      className="rounded-full border border-white/[0.12] bg-white/[0.08] backdrop-blur-xl text-zinc-400 hover:bg-white/[0.12] hover:text-white gap-2"
    >
      {isCreating ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Plus className="h-4 w-4" />
      )}
      New Project
    </Button>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    );
  }

  return (
    <ProjectView
      projects={projects}
      action={addButton}
      onDelete={handleDeleteProject}
    />
  );
}
