
var Timeline = (function(dom_id) {
    this.dom_id = dom_id;
    this.showTimeline = function(args_id, process_id) {
        var r = DCaseAPI.call('getSnapshotList', {
            BelongedArgumentId: args_id,
            ProcessId: process_id
        });
        var l = r.SnapshotList;

        console.log(l);
        var dates = [];
        for (var i = 0; i < l.length; i++) {
            var id = l[i].SnapshotId;
            dates.push({
                'startDate': '2012,1,' + (i + 1),
                'endDate': '2012,1,' + (i + 2),
                'headline': 'Commit ' + id,
                'text': '<p>hello, world</p>',
                'asset': {
                    'media':'http://youtu.be/u4XpeU9erbg',
                    'credit': 'Credit Name Goes Here',
                    'caption': 'Caption text goes here'
                }
            });
        }
        console.log(dates);
        var timeline = {
            'headline': '',
            'type': 'default',
            'text': '',
            //'asset': {
            //    'media': '',
            //    'credit': 'Credit Name Goes Here',
            //    'caption': 'Caption text goes here'
            //},
            'date': dates
        };

        createStoryJS({
            type: 'timeline',
            width: '100%',
            height: '110%',
            source: { timeline: timeline },
            embed_id: this.dom_id,
            css: 'lib/timeline.css',
            js: 'lib/timeline.js'
        });
    }
});

(function() {
    console.log('hello, timeline');
    var tl = new Timeline('timeline-embed');
    tl.showTimeline(1, 1);
});
