
var Timeline = (function(dom_id) {
    this.dom_id = dom_id;
    function getSSDates_dummy(args_id, process_id) {
        var dates = [];
        for (var i = 0; i < 10; i++) {
            var id = i;
            dates.push({
                'startDate': '2012,1,' + (i + 1),
                'endDate': '2012,1,' + (i + 2),
                'headline': 'Commit ' + id,
                'text': '<p>hello, world</p>',
                'asset': {
                    'media':'',
                    'credit': 'Credit Name Goes Here',
                    'caption': 'Caption text goes here'
                }
            });
        }
        return dates;
    }
    function getSSDates(args_id, process_id) {
        var r = DCaseAPI.call('getSnapshotList', {
            BelongedArgumentId: args_id,
            ProcessId: process_id
        });
        var l = r.SnapshotList;
        var dates = [];
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
                    'media':'',
                    'credit': 'Credit Name Goes Here',
                    'caption': 'Caption text goes here'
                }
            });
        }
    };
    this.hideContent = function() {
        var contents = $('.slider-item');
        var nav_prev = $('.nav-previous');
        var nav_next = $('.nav-next');
        for (var i = 0; i < contents.length; i++) {
            $(contents[i]).css('display', 'none');
        }
        nav_prev.css('display', 'none');
        nav_next.css('display', 'none');
        $('.slider-container-mask').css('height', '0px');
        nav_prev.css('height', '0px');
        nav_next.css('height', '0px');
    }
    this.showTimeline = function(args_id, process_id) {
        var self = this;
        var dates = getSSDates_dummy(args_id, process_id);
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
            height: '30%',
            source: { timeline: timeline },
            embed_id: this.dom_id,
            css: 'lib/timeline.css',
            js: 'lib/timeline.js'
        });
        setTimeout(function() {
            self.hideContent();
        }, 100); // wait timeline loading
    }
});

