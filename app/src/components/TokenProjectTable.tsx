interface TokenProject {
    id: number
    icon: string
    iconBg: string
    project: string
    mindshare: number
    launchDate: string
    platform: string
    twitter: string
  }
  
  interface TokenTableProps {
    projects: TokenProject[]
  }
  
  export default function TokenProjectTable({ projects }: TokenTableProps) {
    return (
      <div className="w-full  text-[13px]">
        <table className="w-full">
          <thead>
            <tr className="text-[#94A3B8]/75 ">
              <th className="py-4 px-6 text-left">#</th>
              <th className="py-4 px-6 text-left">Project</th>
              <th className="py-4 px-6 text-left">Mindshare</th>
              <th className="py-4 px-6 text-left">Launch Date</th>
              <th className="py-4 px-6 text-left">Platform</th>
              <th className="py-4 px-6 text-left">Twitter</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((project) => (
              <tr key={project.id} className="border-t border-gray-800 hover:bg-gray-800/30 transition-colors font-akshar text-sm">
                <td className="py-4 px-6 text-white/50">{project.id}</td>
                <td className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    <div className={`w-7 h-7  flex items-center justify-center text-white ${project.iconBg}`}>
                      {project.icon}
                    </div>
                    <span className="text-white/50">{project.project}</span>
                  </div>
                </td>
                <td className="py-4 px-6 font-roboto font-bold">
                  <span className={project.mindshare >= 0 ? "text-[#00A071]" : "text-[#EA3943]"}>
                    {project.mindshare >= 0 ? "+" : ""}
                    {project.mindshare}%
                  </span>
                </td>
                <td className="py-4 px-6 font-roboto font-bold">
                  <span className="text-[#c2c2c4]/90 font-mono">{project.launchDate}</span>
                </td>
                <td className="py-4 px-6 font-mono font-bold text-[#c2c2c4]/90">
                  <a
                    href={`https://${project.platform}`}
                    className="text-gray-300 hover:text-gray-100 underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {project.platform}
                  </a>
                </td>
                <td className="py-4 px-6 font-roboto font-bold">
                  <span className="text-[#c2c2c4]/90">{project.twitter}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }
  
  