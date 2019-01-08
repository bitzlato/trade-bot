// https://gist.github.com/earlonrails/f25ebd224ede7bc6338a839ec9469a53
class Graph {
    constructor(props) {
        this.neighbors = {};
    }

    addEdge(u, v) {
        if (!this.neighbors[u]) this.neighbors[u] = [];
        this.neighbors[u].push(v);
        if (!this.neighbors[v]) this.neighbors[v] = [];
        this.neighbors[v].push(u);
    }

    bfs(start) {
        if (!this.neighbors[start] || !this.neighbors[start].length) {
            return [start];
        }

        var results = { nodes: [] },
            queue = this.neighbors[start],
            count = 1;

        while (queue.length) {
            var node = queue.shift();
            if (!results[node] || !results[node].visited) {
                results[node] = { visited: true, steps: count };
                results['nodes'].push(node);
                if (this.neighbors[node]) {
                    if (this.neighbors[node].length) {
                        count++;
                        queue.push(...this.neighbors[node]);
                    } else {
                        continue;
                    }
                }
            }
        }
        return results;
    }

    shortestPath(start, end) {
        if (start == end) {
            return [start, end];
        }

        var queue = [start],
            visited = {},
            predecessor = {},
            tail = 0,
            path;

        while (tail < queue.length) {
            var u = queue[tail++];
            if (!this.neighbors[u]) {
                continue;
            }

            var neighbors = this.neighbors[u];
            for (var i = 0; i < neighbors.length; ++i) {
                var v = neighbors[i];
                if (visited[v]) {
                    continue;
                }
                visited[v] = true;
                if (v === end) {
                    // Check if the path is complete.
                    path = [v]; // If so, backtrack through the path.
                    while (u !== start) {
                        path.push(u);
                        u = predecessor[u];
                    }
                    path.push(u);
                    path.reverse();
                    return path;
                }
                predecessor[v] = u;
                queue.push(v);
            }
        }

        return path;
    }
}

function isPairsConnected(p1, p2) {
    const [base, quote] = p1.split('/');
    return p2.includes(base) || p2.includes(quote);
}

function tickersToGGraph(base, quote, tickers) {
    const graph = new Graph();
    const added = [base, quote];
    Object.keys(tickers).forEach(pair => {
        added.forEach(old => {
            if (pair.includes(old) || isPairsConnected(pair, old)) {
                graph.addEdge(pair, old);
            }
        });
        added.push(pair);
    });
    return graph;
}

function getCrossPrice(tickers, base, quote) {
    const graph = tickersToGGraph(base, quote, tickers);
    const path = graph.shortestPath(base, quote);
    if (path === undefined) throw new Error(`Can't calculate ${base} in ${quote}`);

    const res = { ask: 1, bid: 1, last: 1 };
    let current = path[path.length - 1];
    path.reverse()
        .slice(1, path.length - 1)
        .forEach(pair => {
            const [base, quote] = pair.split('/');
            if (current === base) {
                res.ask /= tickers[pair].ask;
                res.bid /= tickers[pair].bid;
                res.last /= tickers[pair].last;
                current = quote;
            } else {
                res.ask *= tickers[pair].ask;
                res.bid *= tickers[pair].bid;
                res.last *= tickers[pair].last;
                current = base;
            }
        });
    return res;
}

module.exports = {
    getCrossPrice,
    isPairsConnected
};
