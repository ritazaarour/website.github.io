import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';


// read csv 
// row conversion function
async function loadData() {
const data = await d3.csv('loc.csv', (row) => ({
    ...row,
    line: Number(row.line),
    depth: Number(row.depth),
    length: Number(row.length),
    date: new Date(row.date + 'T00:00' + row.timezone),
    datetime: new Date(row.datetime),
}));

  return data;
}

function processCommits(data) {
  return d3
    .groups(data, (d) => d.commit)
    .map(([commit, lines]) => {
      let first = lines[0];
      let { author, date, time, timezone, datetime } = first;
      let ret = {
        id: commit,
        url: 'https://github.com/website.github.io/commit/' + commit,
        author,
        date,
        time,
        timezone,
        datetime,
        hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
        totalLines: lines.length,
      };

      Object.defineProperty(ret, 'lines', {
        value: lines,
        writable: false,
        enumerable: false
      });

      return ret;
    });
}

//add commit info to the page
function renderCommitInfo(data, commits) {
  const dl = d3.select('#stats').append('dl').attr('class', 'stats');

  // Add total commits
  dl.append('dt').text('Total commits');
  dl.append('dd').text(commits.length);

  // Add day of week with most commits
  let dayOfWeekCounts = d3.rollup(
    data,
    (v) => v.length,
    (d) => d.datetime.getDay()
  );
  let maxDay = Array.from(dayOfWeekCounts).reduce((a, b) =>
    a[1] > b[1] ? a : b
  )[0];
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  dl.append('dt').text('Day with most commits');
  dl.append('dd').text(dayNames[maxDay]);

  //Add time of day with most commits
  let hourCounts = d3.rollup(
    data,
    (v) => v.length,
    (d) => d.datetime.getHours()
  );
  let maxHour = Array.from(hourCounts).reduce((a, b) =>
    a[1] > b[1] ? a : b
  )[0];
  let ampm = maxHour >= 12 ? 'PM' : 'AM';
  let displayHour = maxHour % 12 || 12;

  dl.append('dt').text('Hour with most commits');
  dl.append('dd').text(`${displayHour}:00 ${ampm} - ${displayHour}:59 ${ampm}`);
}

//commits by time of day plot
function renderScatterPlot(data, commits) {
    //define dimensions
    const width = 1000;
    const height = 600;
    const margin = { top: 10, right: 10, bottom: 30, left: 20 };
    const svg = d3
    .select('#chart')
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('overflow', 'visible');

    //define scales
    const xScale = d3
    .scaleTime()
    .domain(d3.extent(commits, (d) => d.datetime))
    .range([0, width])
    .nice();

    const yScale = d3.scaleLinear().domain([0, 24]).range([height, 0]);

    //define usable area
    const usableArea = {
        top: margin.top,
        right: width - margin.right,
        bottom: height - margin.bottom,
        left: margin.left,
        width: width - margin.left - margin.right,
        height: height - margin.top - margin.bottom,
    };
    // Update scales with new ranges
    xScale.range([usableArea.left, usableArea.right]);
    yScale.range([usableArea.bottom, usableArea.top]);

    // create gridlines
    const gridlines = svg
    .append('g')
    .attr('class', 'gridlines')
    .attr('transform', `translate(${usableArea.left}, 0)`);

    // create gridlines as an axis with no labels and full-width ticks
    gridlines.call(d3.axisLeft(yScale).tickFormat('').tickSize(-usableArea.width));

    // create the axes
    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3
    .axisLeft(yScale)
    .tickFormat((d) => String(d % 24).padStart(2, '0') + ':00');

    // add x axis
    svg
    .append('g')
    .attr('transform', `translate(0, ${usableArea.bottom})`)
    .call(xAxis);

    // add y axis
    svg
    .append('g')
    .attr('transform', `translate(${usableArea.left}, 0)`)
    .call(yAxis);

    //adding circles for scatter plot
    const dots = svg.append('g').attr('class', 'dots');

    dots
    .selectAll('circle')
    .data(commits)
    .join('circle')
    .attr('cx', (d) => xScale(d.datetime))
    .attr('cy', (d) => yScale(d.hourFrac))
    .attr('r', 5)
    .attr('fill', 'steelblue')
    .on('mouseenter', (event, commit) => {
        renderTooltipContent(commit);
    })
    .on('mouseleave', () => {
        renderTooltipContent({});
    });
}

function renderTooltipContent(commit) {
  const link = document.getElementById('commit-link');
  const date = document.getElementById('commit-date');

  if (Object.keys(commit).length === 0) return;

  link.href = commit.url;
  link.textContent = commit.id;
  date.textContent = commit.datetime?.toLocaleString('en', {
    dateStyle: 'full',
  });
  const time = document.getElementById('commit-time');
  time.textContent = commit.time;

  const author = document.getElementById('commit-author');
  author.textContent = commit.author;

  const linesEdited = document.getElementById('commit-lines-edited');
  linesEdited.textContent = commit.linesEdited;
}

let data = await loadData();
let commits = processCommits(data);
console.log(commits);
renderCommitInfo(data, commits);
renderScatterPlot(data, commits);

