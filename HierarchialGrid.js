Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    items:{ html:'<a href="https://help.rallydev.com/apps/2.0rc2/doc/">App SDK 2.0rc2 Docs</a>'},
    
    
    launch: function(){
        var that = this;
        var today = new Date().toISOString();
        var epics = Ext.create('Rally.data.wsapi.Store', {
            model: 'PortfolioItem/Epic',
            fetch: ['Children', 'c_TargetLaunch'],
            context: {
               workspace: '/workspace/1089940415',
                project: '/project/5825702196',    //testing it out for Kilobits project
                projectScopeUp: false,
                projectScopeDown: true
            }
        });
        epics.load().then({
            success: this.loadFeatures,
            scope: this
        }).then({
            success:function(results) {
                that.makeGrid(results);
            },
            failure: function(){
                console.log("oh noes!")
            }
        });
    },
    
    loadFeatures: function(epics){
        console.log("load features started");
        var promises = [];
        _.each(epics, function(epic){
            var features = epic.get('Children');
            if (features.Count > 0) {
                features.store = epic.getCollection('Children',{fetch:['Name', 'Project','State', 'FormattedID', 'Parent']});
                promises.push(features.store.load());
            }
        });
        console.log('get the all promises', promises);
        return Deft.Promise.all(promises);
    },
    
    makeGrid: function(results){
        console.log('results for grid', results);
        var features = _.flatten(results);
        var data = [];
        _.each(features, function(feature){
            data.push(feature.data);
        })

        _.each(data, function(record){
            record.Epic = record.Parent.FormattedID + " " + record.Parent.Name;;
        })


        this.add({
            xtype: 'rallygrid',
            showPagingToolbar: true,
            showRowActionsColumn: true,
            editable: false,
            store: Ext.create('Rally.data.custom.Store', {
                data: data,
                groupField: 'Epic',
            }),
            features: [{ftype:'groupingsummary'}],
            columnCfgs: [
                {
                    xtype: 'templatecolumn',
                    text: 'ID',
                    dataIndex: 'FormattedID',
                    width: 100,
                    tpl: Ext.create('Rally.ui.renderer.template.FormattedIDTemplate'),
                    summaryRenderer: function() {
                        return "Estimate Total"; 
                    }
                },
                {
                    text: 'Name',
                    dataIndex: 'Name',
                },
                {
                    text: 'State',
                    dataIndex: 'State',
                    xtype: 'templatecolumn',
                    tpl: Ext.create('Rally.ui.renderer.template.ScheduleStateTemplate',
                        {
                            states: ['On Ramp', 'Assessment', 'Break it Down', 'Prioritized Backlog', 'Started', 'Release Ready', 'Launch Ready', 'Launched'],
                            field: {
                                name: 'State' 
                            }
                    })
                },
                {
                    text: 'Parent',
                    dataIndex: 'Parent',
                    renderer: function(val, meta, record) {
                        return '<a href="https://rally1.rallydev.com/#/detail/portfolio/' + record.get('Parent').ObjectID + '" target="_blank">' + record.get('Parent').FormattedID + '</a>';
                    }
                },
            ]
        });

    }
});
