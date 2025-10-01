import React, { useState, useEffect, useRef } from "react";
import { Play, RotateCcw, Pause, SkipForward } from "lucide-react";

const cityGraph = {
  A: {
    neighbors: [
      ["B", 4],
      ["C", 3],
      ["D", 5],
    ],
    x: 50,
    y: 200,
    name: "Lokasi Ambulans",
  },
  B: {
    neighbors: [
      ["A", 4],
      ["E", 6],
      ["F", 3],
    ],
    x: 120,
    y: 150,
    name: "Jl. Sudirman",
  },
  C: {
    neighbors: [
      ["A", 3],
      ["F", 4],
      ["G", 5],
    ],
    x: 120,
    y: 250,
    name: "Jl. Thamrin",
  },
  D: {
    neighbors: [
      ["A", 5],
      ["E", 3],
      ["H", 4],
    ],
    x: 120,
    y: 50,
    name: "Jl. Gatot Subroto",
  },
  E: {
    neighbors: [
      ["B", 6],
      ["D", 3],
      ["I", 5],
    ],
    x: 200,
    y: 100,
    name: "Jl. Rasuna Said",
  },
  F: {
    neighbors: [
      ["B", 3],
      ["C", 4],
      ["J", 6],
    ],
    x: 200,
    y: 200,
    name: "Jl. HR Rasuna",
  },
  G: {
    neighbors: [
      ["C", 5],
      ["J", 3],
      ["K", 4],
    ],
    x: 200,
    y: 300,
    name: "Jl. Kuningan",
  },
  H: {
    neighbors: [
      ["D", 4],
      ["I", 5],
      ["L", 3],
    ],
    x: 200,
    y: 30,
    name: "Jl. Casablanca",
  },
  I: {
    neighbors: [
      ["E", 5],
      ["H", 5],
      ["M", 4],
    ],
    x: 280,
    y: 80,
    name: "Jl. MT Haryono",
  },
  J: {
    neighbors: [
      ["F", 6],
      ["G", 3],
      ["N", 5],
    ],
    x: 280,
    y: 250,
    name: "Jl. Mampang",
  },
  K: {
    neighbors: [
      ["G", 4],
      ["N", 6],
      ["O", 5],
    ],
    x: 280,
    y: 350,
    name: "Jl. Pancoran",
  },
  L: {
    neighbors: [
      ["H", 3],
      ["M", 4],
      ["P", 6],
    ],
    x: 280,
    y: 20,
    name: "Jl. Cikini",
  },
  M: {
    neighbors: [
      ["I", 4],
      ["L", 4],
      ["P", 3],
      ["Q", 5],
    ],
    x: 330,
    y: 120,
    name: "Jl. Salemba",
  },
  N: {
    neighbors: [
      ["J", 5],
      ["K", 6],
      ["R", 4],
    ],
    x: 360,
    y: 280,
    name: "Jl. Tebet",
  },
  O: {
    neighbors: [
      ["K", 5],
      ["R", 3],
      ["S", 6],
    ],
    x: 480,
    y: 350,
    name: "Jl. Pasar Minggu",
  },
  P: {
    neighbors: [
      ["L", 6],
      ["M", 3],
      ["Q", 4],
      ["S", 7],
      ["T", 5],
    ],
    x: 400,
    y: 80,
    name: "Jl. Matraman",
  },
  Q: {
    neighbors: [
      ["M", 5],
      ["P", 4],
      ["T", 3],
    ],
    x: 350,
    y: 190,
    name: "Jl. Cawang",
  },
  R: {
    neighbors: [
      ["N", 4],
      ["O", 3],
      ["S", 5],
    ],
    x: 430,
    y: 320,
    name: "Jl. Ragunan",
  },
  S: {
    neighbors: [
      ["O", 6],
      ["P", 7],
      ["R", 5],
      ["T", 4],
    ],
    x: 450,
    y: 240,
    name: "Jl. Kalibata",
  },
  T: {
    neighbors: [
      ["P", 5],
      ["Q", 3],
      ["S", 4],
    ],
    x: 480,
    y: 200,
    name: "Rumah Sakit",
  },
  Z: { neighbors: [], x: 550, y: 250, name: "Kota Lain" },
};

const AmbulancePathfinding = () => {
  const [openList, setOpenList] = useState([]);
  const [visitedList, setVisitedList] = useState([]);
  const [currentNode, setCurrentNode] = useState(null);
  const [currentNeighbors, setCurrentNeighbors] = useState([]);
  const [path, setPath] = useState([]);
  const [parentMap, setParentMap] = useState({});
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [stepLog, setStepLog] = useState([]);
  const [stats, setStats] = useState({ nodesExpanded: 0, totalDistance: 0 });
  const [startNode, setStartNode] = useState("A");
  const [goalNode, setGoalNode] = useState("T");
  const [showLegend, setShowLegend] = useState(true);

  // --- Zoom & Pan state ---
  const [zoom, setZoom] = useState(1); // 1 = 100%
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const svgRef = useRef(null);
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0 });
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

  const handleWheel = (e) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 0.9 : 1.1; // scroll down: zoom out, scroll up: zoom in
    setZoom((z) => clamp(z * factor, 0.4, 4));
  };

  const toSvgPoint = (e) => {
    const pt = svgRef.current.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    return pt.matrixTransform(svgRef.current.getScreenCTM().inverse());
  };

  const handleMouseDown = (e) => {
    setIsPanning(true);
    const p = toSvgPoint(e);
    panStart.current = { x: p.x - offset.x, y: p.y - offset.y };
  };

  const handleMouseMove = (e) => {
    if (!isPanning) return;
    const p = toSvgPoint(e);
    setOffset({ x: p.x - panStart.current.x, y: p.y - panStart.current.y });
  };

  const endPan = () => setIsPanning(false);

  const zoomIn = () => setZoom((z) => clamp(z * 1.2, 0.4, 4));
  const zoomOut = () => setZoom((z) => clamp(z / 1.2, 0.4, 4));
  const resetView = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  // Logika GBFS
  const heuristic = (node, goal = null) => {
    const targetGoal = goal || goalNode;
    const n = cityGraph[node];
    const g = cityGraph[targetGoal];
    const dx = n.x - g.x;
    const dy = n.y - g.y;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const reset = () => {
    setOpenList([{ node: startNode, h: heuristic(startNode), g: 0 }]);
    setVisitedList([]);
    setCurrentNode(null);
    setCurrentNeighbors([]);
    setPath([]);
    setParentMap({});
    setIsRunning(false);
    setIsComplete(false);
    setStepLog([
      `Greedy-Best First Search dimulai. Node ${startNode} (${cityGraph[startNode].name}) sebagai start node ditambahkan ke open list.`,
    ]);
    setStats({ nodesExpanded: 0, totalDistance: 0 });
    resetView();
  };

  const reconstructPath = (parents, goal) => {
    const pathNodes = [];
    let current = goal;
    let totalDist = 0;

    while (current) {
      pathNodes.unshift(current);
      if (parents[current]) {
        const parent = parents[current];
        const edge = cityGraph[parent].neighbors.find((n) => n[0] === current);
        if (edge) totalDist += edge[1];
        current = parent;
      } else {
        break;
      }
    }
    return { pathNodes, totalDist };
  };

  const step = () => {
    if (openList.length === 0) {
      setStepLog((prev) => [
        ...prev,
        "❌ GAGAL: Open list kosong, tidak ada solusi!",
      ]);
      setIsRunning(false);
      setIsComplete(true);
      return;
    }

    const sorted = [...openList].sort((a, b) => a.h - b.h);
    const current = sorted[0];
    const remaining = sorted.slice(1);

    setCurrentNode(current.node);

    const newVisitedList = [...visitedList, current.node];
    setVisitedList(newVisitedList);

    setStepLog((prev) => [
      ...prev,
      `🔍 Ekspansi: ${current.node} (${
        cityGraph[current.node].name
      }) - h(n) = ${current.h.toFixed(2)}`,
    ]);

    if (current.node === goalNode) {
      setOpenList([]);
      const { pathNodes, totalDist } = reconstructPath(parentMap, goalNode);
      setPath(pathNodes);
      setCurrentNeighbors([]);
      setStats((prev) => ({ ...prev, totalDistance: totalDist }));
      setStepLog((prev) => [
        ...prev,
        `✅ GOAL DITEMUKAN!`,
        `📍 Path: ${pathNodes.join(" → ")}`,
        `📏 Total Jarak: ${totalDist.toFixed(2)} km`,
      ]);
      setIsRunning(false);
      setIsComplete(true);
      return;
    }

    const newParentMap = { ...parentMap };
    const newOpenList = [...remaining];
    const newNeighbors = [];
    let expanded = 0;

    cityGraph[current.node].neighbors.forEach(([neighbor, distance]) => {
      const alreadyVisited = newVisitedList.includes(neighbor);
      const alreadyInOpenList = newOpenList.some((n) => n.node === neighbor);

      if (!alreadyVisited && !alreadyInOpenList) {
        const h = heuristic(neighbor);
        newOpenList.push({ node: neighbor, h, g: current.g + distance });
        newParentMap[neighbor] = current.node;
        newNeighbors.push(neighbor);
        expanded++;
      }
    });

    setParentMap(newParentMap);
    setOpenList(newOpenList);
    setCurrentNeighbors(newNeighbors);
    setStats((prev) => ({ nodesExpanded: prev.nodesExpanded + 1 }));

    if (expanded > 0) {
      setStepLog((prev) => [
        ...prev,
        `  ➕ Menambahkan ${expanded} tetangga ke open list: ${newNeighbors.join(
          ", "
        )}`,
      ]);
    } else {
      setStepLog((prev) => [
        ...prev,
        `  ℹ️  Tidak ada tetangga baru yang ditambahkan (semua sudah dikunjungi/di open list)`,
      ]);
    }
  };

  useEffect(() => {
    if (isRunning && !isComplete) {
      const timer = setTimeout(step, 1000);
      return () => clearTimeout(timer);
    }
  }, [isRunning, isComplete, openList, visitedList]);

  useEffect(() => {
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startNode, goalNode]);

  return (
    <div className="w-full max-w-7xl mx-auto p-6 bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="bg-white rounded-lg shadow-xl p-6 mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          🚑 Sistem Navigasi Ambulans
        </h1>
        <p className="text-gray-600 mb-4">
          Implementasi Greedy Best-First Search
        </p>

        <div className="grid md:grid-cols-2 gap-4 mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              🚩 Start Node (Initial State)
            </label>
            <select
              value={startNode}
              onChange={(e) => setStartNode(e.target.value)}
              disabled={isRunning || isComplete}
              className="w-full px-4 py-2 border-2 border-blue-300 rounded-lg focus:outline-none focus:border-blue-500 disabled:bg-gray-200 disabled:cursor-not-allowed"
            >
              {Object.keys(cityGraph).map((nodeId) => (
                <option
                  key={nodeId}
                  value={nodeId}
                  disabled={nodeId === goalNode}
                >
                  {nodeId} - {cityGraph[nodeId].name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              🎯 Goal Node (Goal State)
            </label>
            <select
              value={goalNode}
              onChange={(e) => setGoalNode(e.target.value)}
              disabled={isRunning || isComplete}
              className="w-full px-4 py-2 border-2 border-red-300 rounded-lg focus:outline-none focus:border-red-500 disabled:bg-gray-200 disabled:cursor-not-allowed"
            >
              {Object.keys(cityGraph).map((nodeId) => (
                <option
                  key={nodeId}
                  value={nodeId}
                  disabled={nodeId === startNode}
                >
                  {nodeId} - {cityGraph[nodeId].name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setIsRunning(!isRunning)}
            disabled={isComplete}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isRunning ? <Pause size={20} /> : <Play size={20} />}
            {isRunning ? "Pause" : "Start"}
          </button>

          <button
            onClick={step}
            disabled={isRunning || isComplete}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            <SkipForward size={20} />
            Step
          </button>

          <button
            onClick={reset}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <RotateCcw size={20} />
            Reset
          </button>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-100 p-4 rounded-lg">
            <div className="text-sm text-gray-600">Nodes Diekspansi</div>
            <div className="text-2xl font-bold text-blue-700">
              {stats.nodesExpanded}
            </div>
          </div>
          <div className="bg-green-100 p-4 rounded-lg">
            <div className="text-sm text-gray-600">Ukuran Open List</div>
            <div className="text-2xl font-bold text-green-700">
              {openList.length}
            </div>
          </div>
          <div className="bg-purple-100 p-4 rounded-lg">
            <div className="text-sm text-gray-600">Nodes Dikunjungi</div>
            <div className="text-2xl font-bold text-purple-700">
              {visitedList.length}
            </div>
          </div>
        </div>

        <div
          className="bg-gray-50 rounded-lg p-4 mb-6 relative"
          style={{ height: "450px" }}
        >
          <svg
            ref={svgRef}
            width="100%"
            height="100%"
            viewBox="0 0 530 400"
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={endPan}
            onMouseLeave={endPan}
            onDoubleClick={resetView}
            style={{
              cursor: isPanning ? "grabbing" : "grab",
              touchAction: "none",
            }}
          >
            {/* Semua elemen digambar di dalam <g> dengan transform pan/zoom */}
            <g
              className="select-none"
              transform={`translate(${offset.x}, ${offset.y}) scale(${zoom})`}
            >
              {/* Edges dengan bobot */}
              {Object.entries(cityGraph).map(([nodeId, nodeData]) =>
                nodeData.neighbors.map(([neighborId, distance]) => {
                  const neighbor = cityGraph[neighborId];
                  const isInPath =
                    path.length > 0 &&
                    path.includes(nodeId) &&
                    path.includes(neighborId) &&
                    Math.abs(
                      path.indexOf(nodeId) - path.indexOf(neighborId)
                    ) === 1;

                  const midX = (nodeData.x + neighbor.x) / 2;
                  const midY = (nodeData.y + neighbor.y) / 2;

                  return (
                    <g key={`${nodeId}-${neighborId}`}>
                      <line
                        x1={nodeData.x}
                        y1={nodeData.y}
                        x2={neighbor.x}
                        y2={neighbor.y}
                        stroke={isInPath ? "#10b981" : "#d1d5db"}
                        strokeWidth={isInPath ? 4 : 2}
                        opacity={0.6}
                        vectorEffect="non-scaling-stroke"
                      />
                      <rect
                        x={midX - 12}
                        y={midY - 8}
                        width="24"
                        height="16"
                        fill={isInPath ? "#10b981" : "#ffffff"}
                        stroke={isInPath ? "#059669" : "#9ca3af"}
                        strokeWidth="1"
                        rx="3"
                        opacity="0.95"
                        vectorEffect="non-scaling-stroke"
                      />
                      <text
                        x={midX}
                        y={midY + 4}
                        textAnchor="middle"
                        fill={isInPath ? "#ffffff" : "#374151"}
                        fontSize="8"
                        fontWeight="bold"
                      >
                        {distance} km
                      </text>
                    </g>
                  );
                })
              )}

              {/* Nodes */}
              {Object.entries(cityGraph).map(([nodeId, nodeData]) => {
                const isStart = nodeId === startNode;
                const isGoal = nodeId === goalNode;
                const isCurrent = currentNode === nodeId;
                const isVisited = visitedList.includes(nodeId);
                const isCurrentNeighbor = currentNeighbors.includes(nodeId);
                const isInPath = path.includes(nodeId);

                let fillColor = "#9ca3af";
                if (isStart) fillColor = "#3b82f6";
                else if (isGoal) fillColor = "#ef4444";
                else if (isCurrent) fillColor = "#f59e0b";
                else if (isInPath) fillColor = "#10b981";
                else if (isCurrentNeighbor) fillColor = "#8b5cf6";
                else if (isVisited) fillColor = "#00bcd4";

                return (
                  <g key={nodeId}>
                    <circle
                      cx={nodeData.x}
                      cy={nodeData.y}
                      r={isCurrent ? 18 : 14}
                      fill={fillColor}
                      stroke={isCurrent ? "#fbbf24" : "#fff"}
                      strokeWidth={isCurrent ? 4 : 2}
                      vectorEffect="non-scaling-stroke"
                    />
                    <text
                      x={nodeData.x}
                      y={nodeData.y + 5}
                      textAnchor="middle"
                      fill="white"
                      fontSize="14"
                      fontWeight="bold"
                    >
                      {nodeId}
                    </text>
                    <text
                      x={nodeData.x}
                      y={nodeData.y + 32}
                      textAnchor="middle"
                      fill="#374151"
                      fontSize="10"
                    >
                      h={heuristic(nodeId).toFixed(0)}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>

          {/* Kontrol Zoom */}
          <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-white/90 rounded-lg shadow p-2">
            <button onClick={zoomOut} className="px-3 py-1 border rounded">
              –
            </button>
            <div className="text-sm w-16 text-center">
              {Math.round(zoom * 100)}%
            </div>
            <button onClick={zoomIn} className="px-3 py-1 border rounded">
              +
            </button>
            <button
              onClick={resetView}
              className="px-3 py-1 border rounded ml-1"
            >
              Reset
            </button>
          </div>

          {/* Toggle Legend */}
          <button
            onClick={() => setShowLegend((prev) => !prev)}
            className="absolute top-4 left-4 bg-gray-600 p-2 rounded text-white text-xs font-semibold"
          >
            {showLegend ? "Hide" : "Show"}
          </button>

          {showLegend ? (
            <div className="absolute top-4 right-4 bg-white p-3 rounded-lg shadow-md text-sm">
              <div className="font-semibold mb-2">Keterangan:</div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-4 h-4 rounded-full bg-blue-600"></div>
                <span>Start</span>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-4 h-4 rounded-full bg-red-600"></div>
                <span>Goal</span>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-4 h-4 rounded-full bg-orange-500"></div>
                <span>Node saat ini</span>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-4 h-4 rounded-full bg-purple-600"></div>
                <span>Tetangga Baru</span>
              </div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-4 h-4 rounded-full bg-cyan-500"></div>
                <span>Dikunjungi</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-green-600"></div>
                <span>Jalur</span>
              </div>
            </div>
          ) : null}
        </div>

        <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm h-64 overflow-y-auto">
          {stepLog.map((log, idx) => (
            <div key={idx} className="mb-1">
              {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AmbulancePathfinding;
