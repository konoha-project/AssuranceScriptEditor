
var Timeline = (function(dom_id) {
    this.dom_id = dom_id;
    this.$dom = $('#' + dom_id);
    var self = this;

    //this.$dom.hover(function() { // hover over
    //    self.showContent();
    //},function() { // hover out
    //    self.hideContent();
    //});

    function getSSDates(args_id, process_id) {
        var r = DCaseAPI.call('getSnapshotList', {
            BelongedArgumentId: args_id,
            ProcessId: process_id
        });
        var l = r.SnapshotList;
        var dates = [];
        for (var i = 0; i < l.length; i++) {
            var pid = l[i].SnapshotId;
            var res2 = DCaseAPI.call("getNodeTreeFromSnapshotId", {
                BelongedArgumentId: args_id,
                SnapshotId: pid,
            });
            console.log(res2);
            dates.push({
                'startDate': '2012,1,' + (i + 1),
                'endDate': '2012,1,' + (i + 2),
                'headline': 'Commit: ' + pid,
                'text': '',
                'asset': {
                    'media':'',
                    'credit': 'Credit Name Goes Here',
                    'caption': 'Caption text goes here'
                }
            });
        }
        return dates;
    };
    this.showContent = function() {
        var contents = $('.slider-item');
        var nav_prev = $('.nav-previous');
        var nav_next = $('.nav-next');
        for (var i = 0; i < contents.length; i++) {
            $(contents[i]).css('display', 'block');
        }
        nav_prev.css('display', 'block');
        nav_next.css('display', 'block');
        $('.slider-container-mask').css('height', '200px');
        nav_prev.css('height', '50px');
        nav_next.css('height', '50px');
    }

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
        var dates = getSSDates(args_id, process_id);
        var timeline = {
            'headline': '',
            'type': 'default',
            'text': '',
            'date': dates
        };

        createStoryJS({
            type: 'timeline',
            width: '100%',
            height: '28%',
            source: { timeline: timeline },
            embed_id: this.dom_id,
            start_at_end: true,
            css: 'lib/timeline.css',
            js: 'lib/timeline.js'
        });
        setTimeout(function() {
            self.hideContent();
        }, 100); // wait timeline loading
    }


});

