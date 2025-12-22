import ProjectView from "@/components/(dashboard)/projects/project-view";

const page = () => {
  const projectArray = [
    {
      id: "f",
      name: "sid",
      description: "erff",
      createdAt: "2025-12-24T00:00:00.000Z",
      updatedAt: "2025-12-24T00:00:00.000Z",
     
    },
  ];
  return (
    <div>
      <ProjectView projects={projectArray} />
    </div>
  );
};

export default page;
