import { getMyClassesAction } from "@/actions/class.actions";
import { StudentClassesTable } from "@/components/student/class/student-classes-table";

export default async function StudentClassesPage() {
  const classes = await getMyClassesAction();

  // Calculate statistics for the student
  const now = new Date();
  const stats = {
    total: classes.length,
    live: classes.filter((cls) => {
      const start = new Date(cls.startsAt);
      const end = new Date(cls.endsAt);
      return now >= start && now <= end;
    }).length,
    upcoming: classes.filter((cls) => new Date(cls.startsAt) > now).length,
    completed: classes.filter((cls) => new Date(cls.endsAt) < now).length,
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Classes</h1>
          <p className="text-sm text-gray-500 mt-1">
            View and join your scheduled classes
          </p>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Total Classes</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">
            {stats.total}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Live Now</p>
          <p className="text-2xl font-semibold text-green-600 mt-1">
            {stats.live}
          </p>
          {stats.live > 0 && (
            <span className="inline-flex items-center gap-1 mt-2 text-xs text-green-600">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              Join now
            </span>
          )}
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Upcoming</p>
          <p className="text-2xl font-semibold text-blue-600 mt-1">
            {stats.upcoming}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <p className="text-sm text-gray-500">Completed</p>
          <p className="text-2xl font-semibold text-gray-600 mt-1">
            {stats.completed}
          </p>
        </div>
      </div>

      {/* Classes Table */}
      <StudentClassesTable initialClasses={classes} />
    </div>
  );
}
