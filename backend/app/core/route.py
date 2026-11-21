"""
Dijkstra route planner on simulated junction network.
Edge weight = road_length / speed (travel time in seconds).
"""
import heapq
from typing import Dict, List, Optional, Tuple


class RouteFinder:
    def __init__(self, junctions: List[int], roads: List[Dict]):
        """
        junctions: list of junction IDs
        roads: list of dicts with keys: from_junction_id, to_junction_id, length_m, avg_speed_kmh
        """
        self.junctions = set(junctions)
        self.adj: Dict[int, List[Tuple[int, float, float]]] = {j: [] for j in self.junctions}
        for r in roads:
            u = r["from_junction_id"]
            v = r["to_junction_id"]
            length = float(r.get("length_m", 300.0))
            speed_kmh = float(r.get("avg_speed_kmh", 30.0))
            if speed_kmh <= 0:
                speed_kmh = 10.0
            speed_mps = speed_kmh * (1000.0 / 3600.0)
            time_s = length / speed_mps
            if u in self.adj and v in self.adj:
                self.adj[u].append((v, time_s, length))
                # Bidirectional road
                self.adj[v].append((u, time_s, length))

    def find_shortest_path(self, origin: int, destination: int) -> Tuple[List[int], float, float]:
        """
        Returns: (junction_path: List[int], total_time_s: float, total_distance_m: float)
        """
        if origin not in self.junctions or destination not in self.junctions:
            raise ValueError(f"Origin {origin} or Destination {destination} not found in network.")

        distances: Dict[int, float] = {j: float("inf") for j in self.junctions}
        distances_m: Dict[int, float] = {j: 0.0 for j in self.junctions}
        predecessors: Dict[int, Optional[int]] = {j: None for j in self.junctions}

        distances[origin] = 0.0
        pq = [(0.0, origin)]

        while pq:
            curr_dist, u = heapq.heappop(pq)
            if curr_dist > distances[u]:
                continue
            if u == destination:
                break

            for v, time_s, length_m in self.adj.get(u, []):
                new_dist = curr_dist + time_s
                if new_dist < distances[v]:
                    distances[v] = new_dist
                    distances_m[v] = distances_m[u] + length_m
                    predecessors[v] = u
                    heapq.heappush(pq, (new_dist, v))

        if distances[destination] == float("inf"):
            raise ValueError(f"No connected path from {origin} to {destination}")

        path = []
        curr = destination
        while curr is not None:
            path.append(curr)
            curr = predecessors[curr]
        path.reverse()

        return path, distances[destination], distances_m[destination]

    def validate_manual_path(self, path: List[int]) -> bool:
        if len(path) < 2:
            return True
        for i in range(len(path) - 1):
            u, v = path[i], path[i + 1]
            connected = any(neighbor == v for neighbor, _, _ in self.adj.get(u, []))
            if not connected:
                return False
        return True
