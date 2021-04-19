const width = 1000;
const barWidth = 500;
const height = 500;
const margin = 30;

const yearLable = d3.select('#year');
const countryName = d3.select('#country-name');

const barChart = d3.select('#bar-chart')
    .attr('width', barWidth)
    .attr('height', height);

const scatterPlot = d3.select('#scatter-plot')
    .attr('width', width)
    .attr('height', height).append('g');

const lineChart = d3.select('#line-chart')
    .attr('width', width)
    .attr('height', height);

let xParam = 'fertility-rate';
let yParam = 'child-mortality';
let rParam = 'gdp';
let year = '2000';
let param = 'child-mortality';
let lineParam = 'child-mortality';
let highlighted = '';
let selected = null;

const x = d3.scaleLinear().range([margin * 2, width - margin]);
const y = d3.scaleLinear().range([height - margin, margin]);

const xBar = d3.scaleBand().range([margin * 2, barWidth - margin]).padding(0.1);
const yBar = d3.scaleLinear().range([height - margin, margin])

const xAxis = scatterPlot.append('g').attr('transform', `translate(0, ${height - margin})`);
const yAxis = scatterPlot.append('g').attr('transform', `translate(${margin * 2}, 0)`);

const xLineAxis = lineChart.append('g').attr('transform', `translate(0, ${height - margin})`);
const yLineAxis = lineChart.append('g').attr('transform', `translate(${margin * 2}, 0)`);

const xBarAxis = barChart.append('g').attr('transform', `translate(0, ${height - margin})`);
const yBarAxis = barChart.append('g').attr('transform', `translate(${margin * 2}, 0)`);

const colorScale = d3.scaleOrdinal().range(['#DD4949', '#39CDA1', '#FD710C', '#A14BE5']);
const radiusScale = d3.scaleSqrt().range([10, 30]);

loadData().then(data => {

    colorScale.domain(d3.set(data.map(d => d.region)).values());

    d3.select('#range').on('change', function () {
        year = d3.select(this).property('value');
        yearLable.html(year);
        updateScatterPlot();
        updateBar();
    });

    d3.select('#radius').on('change', function () {
        rParam = d3.select(this).property('value');
        updateScatterPlot();
    });

    d3.select('#x').on('change', function () {
        xParam = d3.select(this).property('value');
        updateScatterPlot();
    });

    d3.select('#y').on('change', function () {
        yParam = d3.select(this).property('value');
        updateScatterPlot();
    });

    d3.select('#param').on('change', function () {
        param = d3.select(this).property('value');
        updateBar();
    });

    d3.select('#p').on('change', function () {
        lineParam = d3.select(this).property('value');
        updateLineChart();
    });

    function updateBar() {
        let regions = d3.map(data, d => d['region']).keys();

        let avg = regions.map(
            baseRegion => (
                d3.mean(
                    data.filter(d => d['region'] === baseRegion)
                        .flatMap(d => d[param][year])
                )
            )
        );

        let region_avg = [];
        regions.forEach((key, i) => {
            region_avg.push({"region": key, "avg": avg[i]});
        });

        xBar.domain(regions);
        xBarAxis.call(d3.axisBottom(xBar));
        yBar.domain([0, d3.max(avg)]).range([500, 0]);
        yBarAxis.call(d3.axisLeft(yBar));

        let u = barChart.selectAll("rect")
            .data(region_avg);

        u.enter()
            .append("rect")
            .merge(u)
            .transition()
            .duration(1000)
            .attr('width', xBar.bandwidth())
            .attr('height', d => 500 - yBar(d['avg']))
            .attr('x', d => xBar(d['region']))
            .attr('y', d => yBar(d['avg']) - 30)
            .attr("fill", d => colorScale(d['region']));

        d3.selectAll('rect').on('click', function (actual) {
            if (d3.select(this).attr('opacity') !== '1') {
                d3.selectAll('rect').attr('opacity', 0.5);
                d3.select(this).attr('opacity', 1);
                scatterPlot.selectAll('circle').attr('opacity', 0);
                scatterPlot.selectAll('circle').style('opacity', 0);
                scatterPlot.selectAll('circle').filter(d => d['region'] === actual.region).style('opacity', 1);
            } else {
                d3.selectAll('rect').attr('opacity', null);
                scatterPlot.selectAll('circle').style('opacity', 0.7);
            }
        });
    }

    function updateScatterPlot() {
        d3.select('.year').text(year);

        let xRange = data.map(d => +d[xParam][year]);
        x.domain([d3.min(xRange), d3.max(xRange)]);
        xAxis.call(d3.axisBottom(x));

        let yRange = data.map(d => +d[yParam][year]);
        y.domain([d3.min(yRange), d3.max(yRange)]);
        yAxis.call(d3.axisLeft(y));

        let rRange = data.map(d => +d[rParam][year]);
        radiusScale.domain([d3.min(rRange), d3.max(rRange)]);

        scatterPlot.selectAll('circle').data(data)
            .enter()
            .append('circle');

        scatterPlot.selectAll('circle').data(data)
            .attr("cx", d => x(d[xParam][year]))
            .attr("cy", d => y(d[yParam][year]))
            .attr("r", d => radiusScale(d[rParam][year]))
            .attr("fill", d => colorScale(d['region']))
            .attr('opacity', 0.7);

        scatterPlot.selectAll('circle').on('click', function (actual) {
            selected = actual['country'];
            if (d3.select(this).attr('stroke-width') !== '3') {
                d3.selectAll('circle').attr('stroke-width', null);
                this.parentNode.appendChild(this);
                d3.select(this).attr('stroke-width', 3);
                updateLineChart();
            } else {
                d3.selectAll('circle').attr('stroke-width', null);
                d3.select('#line-chart-container').style('visibility', 'hidden');
            }
        });
    }

    function updateLineChart() {
        if (selected) {
            d3.select('#line-chart-container').style('visibility', 'visible');
            d3.select('.country-name').text(selected);

            let countryData = data.filter(d => d['country'] === selected).map(d => d[lineParam])[0];
            let xy = [];
            for (let i = 1800; i < 2021; i++)
                xy.push({"x": i, "y": parseFloat(countryData[i])})

            x.domain([1800, 2020]);
            xLineAxis.call(d3.axisBottom(x));

            let yRange = d3.values(xy).map(d => +d.y);
            y.domain([d3.min(yRange), d3.max(yRange)]);
            yLineAxis.call(d3.axisLeft(y));

            lineChart.append('path').attr('class', 'line').datum(xy).enter().append('path');

            lineChart.selectAll('.line').datum(xy)
                .attr("stroke", "steelblue")
                .attr("fill", "none")
                .attr("stroke-width", 1.5)
                .attr("d", d3.line()
                    .x(d => x(d.x))
                    .y(d => y(d.y)));
        }
    }

    updateBar();
    updateScatterPlot();
    updateLineChart();
});

async function loadData() {
    const data = {
        'population': await d3.csv('data/population.csv'),
        'gdp': await d3.csv('data/gdp.csv'),
        'child-mortality': await d3.csv('data/cmu5.csv'),
        'life-expectancy': await d3.csv('data/life_expectancy.csv'),
        'fertility-rate': await d3.csv('data/fertility-rate.csv')
    };

    return data.population.map(d => {
        const index = data.gdp.findIndex(item => item.geo == d.geo);
        return {
            country: d.country,
            geo: d.geo,
            region: d.region,
            population: d,
            'gdp': data['gdp'][index],
            'child-mortality': data['child-mortality'][index],
            'life-expectancy': data['life-expectancy'][index],
            'fertility-rate': data['fertility-rate'][index]
        }
    })
}