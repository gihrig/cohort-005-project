import { LessonBreadcrumb } from "~/components/lesson-breadcrumb";
import { CurriculumSidebar } from "~/components/lesson-curriculum-sidebar";

type SidebarProps = Parameters<typeof CurriculumSidebar>[0];
type BreadcrumbProps = Parameters<typeof LessonBreadcrumb>[0];

export function LessonLayout({
  sidebar,
  breadcrumb,
  children,
}: {
  sidebar: SidebarProps;
  breadcrumb: BreadcrumbProps;
  children: React.ReactNode;
}) {
  return (
    <div className="flex">
      <CurriculumSidebar {...sidebar} />

      <div className="flex-1 p-6 lg:p-8">
        <LessonBreadcrumb {...breadcrumb} />

        <div className="mx-auto max-w-4xl">{children}</div>
      </div>
    </div>
  );
}
