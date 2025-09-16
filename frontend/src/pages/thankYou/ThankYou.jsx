import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import Loader from "../../components/Loader";
import axiosApi from "../../api/AxiosApi";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const ThankYou = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [role, setRole] = useState(location.state?.role || "");
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState([]);
  const [download, setDownload] = useState(false);

  const statusColor = (score) => {
    if (score >= 75) return "bg-green-500";
    if (score >= 40) return "bg-yellow-500";
    return "bg-red-500";
  };

  const pretty = (iso) => {
    return new Date(iso).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Kolkata",
    });
  };

  
  const { head, body } = useMemo(() => {
    const head = [
      "No",
      "Username",
      "Start Time",
      "End Time",
      "Duration",
      "Final Score",
      "Focus Lost",
      "Suspicious Events",
      "Created At",
      "Updated At / _id",
    ];

    const body = (Array.isArray(reports) ? reports : []).map((r, i) => {
      const susp =
        Array.isArray(r.suspiciousEvents) && r.suspiciousEvents.length > 0
          ? r.suspiciousEvents
              .map((ev) => {
                const ts = ev.timestamp ? pretty(ev.timestamp) : "";
                const details = ev.details ?? "";
                return `${ev.eventType}${ts ? ` @ ${ts}` : ""}${
                  details ? ` | ${details}` : ""
                }`;
              })
              .join("; ")
          : "None";

      return [
        i + 1,
        r.username ?? "",
        pretty(r.startTime),
        pretty(r.endTime),
        r.interviewDuration ?? "",
        String(r.finalScore ?? ""),
        String(r.focusLostCount ?? ""),
        susp,
        pretty(r.createdAt),
        r.updatedAt ? pretty(r.updatedAt) : r._id ?? "",
      ];
    });

    return { head, body };
  }, [reports]);

  const handleFetchReports = async () => {
    setLoading(true);
    try {
      const res = await axiosApi.get("/fetch-all-reports");
      if (res.status == 200) {
        const data = res.data;
        console.log(data);
        setReports(data);
        setDownload(true);
        setLoading(false);
      }
    } catch (e) {
      console.log(e);
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
    });

    doc.setFontSize(16);
    doc.text("Interview Reports", doc.internal.pageSize.getWidth() / 2, 14, {
      align: "center",
    });

    autoTable(doc, {
      head: [
        [
          "#",
          "Username",
          "Duration",
          "Times focus lost",
          "Suspicious events",
          "Score",
        ],
      ],
      body: reports.map((r, i) => [
        i + 1,
        r.username,
        r.interviewDuration,
        r.focusLostCount,
        r.suspiciousEvents && r.suspiciousEvents.length > 0
          ? r.suspiciousEvents.map((e) => e.eventType).join(", ")
          : "None",
        r.finalScore,
      ]),
      startY: 20,
      styles: { fontSize: 10, cellPadding: 3 },
    });

    doc.save("interview_reports.pdf");
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-r from-gray-900 via-black to-gray-900 text-white px-4">
      <div className="flex flex-col items-center justify-center">
        <motion.h1
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-4xl md:text-6xl font-bold mb-4 drop-shadow-xl"
        >
          Thank You!
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
          className="text-lg md:text-2xl text-gray-300 text-center max-w-xl"
        >
          Your interview has been recorded successfully.
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.8 }}
        className="mt-8 flex gap-6"
      >
        <button
          onClick={() => navigate("/")}
          className="px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-lg transition cursor-pointer"
        >
          Back to Home
        </button>
        {role === "interviewer" ? (
          <button
            onClick={handleFetchReports}
            className="px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-lg transition cursor-pointer"
          >
            Fetch Reports
          </button>
        ) : (
          ""
        )}
        {download === true ? (
          <button
            onClick={handleDownloadPDF}
            className="px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-lg transition cursor-pointer"
          >
            Download pdf
          </button>
        ) : (
          ""
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.8 }}
        className="mt-4"
      >
        {loading && <Loader size="xl" />}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6, duration: 0.8 }}
        className="mt-4 flex flex-col max-w-4xl w-full max-h-[45vh] md:max-h-[60vh] overflow-auto space-y-6 scrollbar-custom "
      >
        {reports.map((report) => (
          <div
            key={report._id}
            className="w-full max-w-full mx-auto p-6 rounded-2xl bg-gradient-to-b from-white/3 via-white/4 to-white/2 shadow-2xl backdrop-blur-md text-white"
          >
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
            >
              <div>
                <h2 className="text-2xl font-semibold">Interview Report</h2>
                <p className="text-sm text-gray-300 mt-1">
                  Recorded on {pretty(report.createdAt)}
                </p>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-xs text-gray-400">Candidate</p>
                  <p className="font-medium">{report.username}</p>
                </div>

                <div className="w-36">
                  <p className="text-xs text-gray-400">Score</p>
                  <div className="w-full h-3 bg-white/10 rounded-full mt-1 overflow-hidden">
                    <div
                      className={`${statusColor(
                        report.finalScore
                      )} h-full rounded-full transition-all duration-500`}
                      style={{
                        width: `${Math.max(
                          0,
                          Math.min(100, report.finalScore)
                        )}%`,
                      }}
                    />
                  </div>
                  <p className="text-sm text-gray-200 mt-1">
                    {report.finalScore}%
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.08, duration: 0.5 }}
              className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4"
            >
              <div className="col-span-1 bg-black/30 p-4 rounded-lg">
                <p className="text-xs text-gray-400">Start Time</p>
                <p className="mt-1 text-sm">{pretty(report.starTime)}</p>

                <p className="text-xs text-gray-400 mt-4">End Time</p>
                <p className="mt-1 text-sm">{pretty(report.endTime)}</p>

                <p className="text-xs text-gray-400 mt-4">Duration</p>
                <p className="mt-1 text-sm">{report.interviewDuration}</p>
              </div>

              <div className="col-span-1 md:col-span-2 bg-black/30 p-4 rounded-lg">
                <p className="text-xs text-gray-400">Summary</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="px-3 py-1 rounded-full bg-indigo-600/30 text-sm">
                    Focus lost: {report.focusLostCount}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-rose-600/30 text-sm">
                    Events: {report.focusLostCount}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-sky-600/30 text-sm">
                    Duration: {report.interviewDuration}
                  </span>
                </div>

                <div className="mt-4">
                  <p className="text-xs text-gray-400">Suspicious Events</p>
                  {report.suspiciousEvents.length === 0 ? (
                    <p className="mt-2 text-sm text-gray-300">
                      No suspicious events detected.
                    </p>
                  ) : (
                    <ul className="mt-2 space-y-2 max-h-48 overflow-auto pr-2">
                      {report.suspiciousEvents.map((ev) => {
                        return (
                          <li
                            key={ev._id?._id ?? ev._id}
                            className="flex items-start gap-3"
                          >
                            <div className="w-2 h-2 mt-2 rounded-full bg-amber-500/80" />
                            <div>
                              <div className="text-sm font-medium">
                                {ev.eventType.replaceAll("_", " ")}
                              </div>
                              <div className="text-xs text-gray-400 break-words">
                                {pretty(ev.timestamp)} • {String(ev.details)}
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.12, duration: 0.5 }}
              className="mt-6 flex items-center justify-between text-sm text-gray-400"
            >
              <div>Interview ID: {report._id}</div>
              <div>Updated: {pretty(report.updatedAt)}</div>
            </motion.div>
          </div>
        ))}
      </motion.div>
    </div>
  );
};

export default ThankYou;
