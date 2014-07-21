/*global Rally Ext Deft _ describe it before*/
var Lumenize = require('./lumenize');
var NOW = new Date();

Ext.define('Rally.ui.tree.PortfolioForecastTreeItem', {
    extend: 'Rally.ui.tree.TreeItem',
    alias: 'widget.rallyportfolioforecasttreeitem',

    getContentTpl: function(){
        var me = this;
        return Ext.create('Ext.XTemplate',
            '<div class="textContent ellipses">{[this.getFormattedId()]} {[this.getSeparator()]}{Name}</div>',
            '<div class="textContent {[this.getClass()]}">',
                '{[this.getSummary()]}',
            '</div>',
            '<div class="textContent">',
                '{[this.getTargetLaunch()]}',
            '</div>',
            '<div class="textContent">',
                '{[this.getPlannedStartDate()]}',
            '</div>',
            '<div class="textContent">',
                '{[this.getPlannedEndDate()]}',
            '</div>',
            '<div class="rightSide">',
                '{[this.getPercentDone()]}',
            '</div>',
            {
                getPercentDone: function() {
                    var record = me.getRecord();
                    return record.getField('PercentDoneByStoryCount') ? Rally.ui.renderer.RendererFactory.renderRecordField(me.getRecord(), 'PercentDoneByStoryCount') : '';
                },
                getTargetLaunch: function() {
                    var record = me.getRecord();
                    return record.data.c_TargetLaunch? record.getField('c_TargetLaunch').displayName +": " + Rally.ui.renderer.RendererFactory.renderRecordField(me.getRecord(), 'c_TargetLaunch') : '';
                },
                getPlannedStartDate: function() {
                    var record = me.getRecord();
                    return record.data.PlannedStartDate? record.getField('PlannedStartDate').displayName +": " + Rally.ui.renderer.RendererFactory.renderRecordField(me.getRecord(), 'PlannedStartDate') : '';
                },
                getPlannedEndDate: function() {
                    var record = me.getRecord();
                    return record.data.PlannedEndDate? record.getField('PlannedEndDate').displayName +": " + Rally.ui.renderer.RendererFactory.renderRecordField(me.getRecord(), 'PlannedEndDate') : '';
                },
                getFormattedId: function() {
                    var record = me.getRecord();
                    return record.getField('FormattedID') ? Rally.ui.renderer.RendererFactory.renderRecordField(record, 'FormattedID') : '';
                },
                getSeparator: function() {
                    return this.getFormattedId() ? '- ' : '';
                },
                getClass: function() {
                    var record = me.getRecord();
                    return record.data.AtRisk ? 'atRisk' : 'notAtRisk';
                },
                getSummary: function() {
                    var record = me.getRecord();
                    var daysToCompletion = record.data.DaysToCompletion;
                    var workdaysRemaining = record.data.WorkdaysRemaining;
                    var out = '';
                    
                    if (daysToCompletion !== null && workdaysRemaining !== null) {
                        out = '(' + daysToCompletion.toFixed(1) + ' days for Stories needed / ' + workdaysRemaining + ' days left)';
                    } 
                    
                    if (typeof record.data.HistoricalThroughput !== 'undefined') {
                        out+='</div><div class="textContent">Throughput: ' + Math.round(record.data.HistoricalThroughput * 30) + ' Stories / month</div>';
                    }
                    
                    return out;
            
                }
            }
        );
    }
});

Ext.define('Rally.ui.tree.PortfolioForecastTree', {
    extend: 'Rally.ui.tree.PortfolioTree',
    alias: 'widget.portfolioforecasttree',

    requires: [
        'Rally.data.lookback.SnapshotStore'
    ],

    handleParentItemStoreLoad: function(store, records) {
        //Compute risk (should always be a portfolio item)
        var originalArguments = arguments;
        this.loadStoriesRemainingByFeatureAndProject(Ext.bind(function() {
            this.computePortfolioItemRisk(store);
            this.superclass.handleParentItemStoreLoad.apply(this, originalArguments);
        }, this));
    },
    childItemsStoreConfigForParentRecordFn: function(){
        return {fetch: true};
    },

    handleChildItemStoreLoad: function(store, records, parentTreeItem) {
        this.computePortfolioItemRisk(store);
        this.callParent(arguments);
    },

    drawChildItems: function (parentTreeItem) {
        var record = parentTreeItem.getRecord();
        if (this._isRecordBottomPortfolioLevel(record)) {
            //If parent is the lowest level PI, fetch projects and augment with project breakdown
            this.drawChildProjects(parentTreeItem);
        } else {
            this.callParent(arguments);
        }
    },

    canExpandItem: function(record) {
        return !!_.keys(record.data.Projects).length;
    },

    computePortfolioItemRisk: function(store) {
        var storiesRemainingByFeatureAndProject = this.storiesRemainingByFeatureAndProject;
        var historicalThroughput = this.config.historicalThroughputByProject;
        store.each(function(portfolioItem) {
            var objectId = portfolioItem.data.ObjectID;
            var workdaysRemaining = '?';

            if (portfolioItem.data.PlannedEndDate) {
                var startOn = Ext.Date.format(new Date(), "Y-m-d");
                var endBefore = Ext.Date.format(portfolioItem.data.PlannedEndDate, "Y-m-d");

                //If endBefore < startOn, we need Infinity throughput to finish on time, so those
                //features will still display as "at risk" (since we already blew the planned end date)
                var timeline = new Lumenize.Timeline({
                    startOn: startOn,
                    endBefore: endBefore,
                    granularity: Lumenize.Time.DAY
                });
                workdaysRemaining = timeline.getAll().length;
            }

            portfolioItem.data.Projects = {};

            //Count stories remaining by project id
            _.each(storiesRemainingByFeatureAndProject[objectId], function(count, projectOid) {
                portfolioItem.data.Projects[projectOid] = { StoriesRemaining: count };
            });

            //Normalize story count by workdays remaining
            _.each(portfolioItem.data.Projects, function(project, projectOid) {
                project.WorkdaysRemaining = workdaysRemaining;
                project.DaysToCompletion = project.StoriesRemaining * historicalThroughput[projectOid];
                project.HistoricalThroughput = historicalThroughput[projectOid];
                project.AtRisk = project.DaysToCompletion > workdaysRemaining;
            });

            //Determine if project is at risk (required throughput > historical throughput)
            portfolioItem.data.AtRisk = _.any(portfolioItem.data.Projects, function(project) {
                return project.AtRisk;
            });

            portfolioItem.data.WorkdaysRemaining = workdaysRemaining;
            portfolioItem.data.DaysToCompletion = _.max(portfolioItem.data.Projects, 'DaysToCompletion').DaysToCompletion;
        });
    },

    drawChildProjects: function(parentTreeItem) {
        var filter;
        var record = parentTreeItem.getRecord();
        var ids = _.keys(record.data.Projects);

        _.each(ids, function(id) {
            var filterItem = Ext.create('Rally.data.QueryFilter', 
            {
                property: 'ObjectID',
                operator: '=',
                value: id
            });

            filter = filter ? filter.or(filterItem) : filterItem;
        });

        var childStore = Ext.create('Rally.data.WsapiDataStore', {
            autoLoad: true,
            limit: 'Infinity',
            model: 'Project',
            filters: filter,
            listeners: {
                load: Ext.bind(function(store, records, success) {
                    _.each(records, function(project) {
                        _.each(record.data.Projects, function(projectRisk, projectOid) {
                            if (projectOid == project.data.ObjectID) {
                                _.merge(project.data, projectRisk);
                            }
                        });
                    });
                    this.renderChildRecords(Ext.clone(records), parentTreeItem);
                }, this)
            }
        });

        parentTreeItem.store = childStore;
    },
    loadStoriesRemainingByFeatureAndProject: function(callback) {
        Ext.create('Rally.data.lookback.SnapshotStore', {
            // TODO - account for > 20k results
            autoLoad: true,
            fetch: ['_ProjectHierarchy', '_ItemHierarchy'],
            findConfig: {
                "_TypeHierarchy": "HierarchicalRequirement",
                "__At": "current",
                "ScheduleState": {
                    "$lt": "Accepted"
                },
                "Feature": {//TODO - will this always work?
                    "$exists": true
                }
            },
            listeners: {
                load: Ext.bind(function(store, data, success) {
                    var stories = _.pluck(data, 'raw');

                    //Count stories remaining by project id
                    var storiesRemainingByFeatureAndProject = {};
                    _.each(stories, function(story) {
                        _.each(story._ItemHierarchy, function(objectId) {
                            var projects = storiesRemainingByFeatureAndProject[objectId] = storiesRemainingByFeatureAndProject[objectId] || {};
                            projects[story.Project] = projects[story.Project] || 0;
                            projects[story.Project]++;
                        });
                    });

                    this.storiesRemainingByFeatureAndProject = storiesRemainingByFeatureAndProject;

                    callback();
                }, this)
            }
        });
    },

    treeItemConfigForRecordFn: function(record) {
        return { xtype: 'rallyportfolioforecasttreeitem' };
    }
});

Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    launch: function() {
        var me = this;
        this.lastHistoricalTPStart = false;
        this.lastHistoricalTPEnd = false;
        this.add({
            xtype: 'form',
            title: 'Configuration',
            frame: true,
            collapsible: true,
            collapsed: false,
            bodyStyle: 'padding:5px 5px 0',
            layout: 'column',
            items: [
                {
                    xtype: 'fieldset',
                    fieldLabel: 'Type',
                    cls: 'confFieldset',
                    items: [{
                        xtype: 'rallyportfolioitemtypecombobox',
                        id: 'portfolioItemType',
                        itemId: 'portfolioItemType',
                        hideLabel: true
                    }]
                },
                {
                    xtype: 'fieldset',
                    title: 'Select Planned Start and End Dates',
                    id: 'fldPlannedDates',
                    itemId: 'fldPlannedDates',
                    cls: 'confFieldset',
                    checkboxToggle: true,
                    columnWidth: 0.2,
                    items: [
                        {
                            xtype: 'datefield',
                            id: 'portfolioItemsStart',
                            itemId: 'portfolioItemsStart',
                            fieldLabel: 'Start',
                            cls: 'left',
                            value: (new Lumenize.Time(NOW)).add(-3, Lumenize.Time.MONTH).getJSDate('UTC') // 3 months ago
                        },
                        {
                            xtype: 'datefield',
                            id: 'portfolioItemsEnd',
                            itemId: 'portfolioItemsEnd',
                            fieldLabel: 'End',
                            value: (new Lumenize.Time(NOW)).add(3, Lumenize.Time.MONTH).getJSDate('UTC') // 3 months from now
                        }
                    ]
                },
                {
                    xtype: 'fieldset',
                    title: 'Tags',
                    cls: 'confFieldset',
                    columnWidth: 0.2,
                    items: [
                        {
                            xtype: 'rallytagpicker',
                            id: 'tagpicker',
                            itemId: 'tagpicker',
                            storeConfig: {autoLoad: true}
                        }
                    ]
                },
                {
                    xtype: 'fieldset',
                    title: 'Target Launch',
                    cls: 'confFieldset',
                    columnWidth: 0.2,
                    items: [
                        {
                            xtype: 'rallyfieldvaluecombobox',
                            id: 'portfolioItemsTargetLaunch',
                            itemId: 'portfolioItemsTargetLaunch',
                            model: 'PortfolioItem',
                            field: 'c_TargetLaunch',
                            fieldLabel: 'Target Launch'
                        }
                    ]
                },
                {
                    xtype: 'fieldset',
                    title: 'Sample historical throughput between',
                    columnWidth: 0.2,
                    cls: 'confFieldset',
                    items: [
                        {
                            xtype: 'datefield',
                            id: 'historicalThroughputStart',
                            itemId: 'historicalThroughputStart',
                            fieldLabel: 'Start',
                            maxValue: NOW,
                            value: (new Lumenize.Time(NOW)).add(-3, Lumenize.Time.MONTH).getJSDate('UTC')
                        },
                        {
                            xtype: 'datefield',
                            id: 'historicalThroughputEnd',
                            itemId: 'historicalThroughputEnd',
                            fieldLabel: 'End',
                            maxValue: NOW,
                            value: NOW
                        }
                    ]
                },
                 {
                    xtype: 'rallybutton',
                    text: 'Submit',
                    handler: function() {
                        me.loadThroughputByProjectAndPortfolioItems();
                    }
                }
            ]
        });
      
        //this.loadThroughputByProjectAndPortfolioItems();
    },
    
    getSnapshots: function(config) {
        var workspaceOid = this.context.getWorkspace().ObjectID;
        var deferred = new Deft.Deferred();
        Ext.create('Rally.data.lookback.SnapshotStore', _.merge({
            // TODO - account for > 20k results
            autoLoad: true,
            context: {
                workspace: '/workspace/' + workspaceOid
            },
            listeners: {
                load: function(store, data, success) {
                    deferred.resolve(_.pluck(data, 'raw'));
                }
            }
        }, config));

        return deferred.getPromise();
    },
    getWorkingDays: function(startDate, endDate){
         var result = 0;
    
        var currentDate = startDate;
        while (currentDate <= endDate)  {  
    
            var weekDay = currentDate.getDay();
            if (weekDay !== 0 && weekDay != 6)
                result++;
    
             currentDate.setDate(currentDate.getDate()+1); 
        }
    
        return result;
    },
    throughputByProject: function() {
        var start = Ext.Date.format(Ext.getCmp('historicalThroughputStart').getValue(), "Y-m-d");
        var end = Ext.Date.format(Ext.getCmp('historicalThroughputEnd').getValue(), "Y-m-d");

        var timeline = new Lumenize.Timeline({
            startOn: start,
            endBefore: end,
            granularity: Lumenize.Time.DAY
        });
        var workdays = timeline.getAll().length;

        //Stories transitioned from <Accepted to >=Accepted
        var forwardThroughput = this.getSnapshots({
            fetch: ['_ProjectHierarchy'],
            findConfig: {
                "_TypeHierarchy": "HierarchicalRequirement",
                "_PreviousValues.ScheduleState": {
                    "$exists": true,
                    "$lt": "Accepted"
                },
                "ScheduleState": {
                    "$gte": "Accepted"
                },
                "_ValidFrom": {
                    "$lt": end,
                    "$gte": start
                }
            }
        });

        //Stories transitioned from >=Accepted to <Accepted
        var backwardThroughput = this.getSnapshots({
            fetch: ['_ProjectHierarchy'],
            findConfig: {
                "_TypeHierarchy": "HierarchicalRequirement",
                "_PreviousValues.ScheduleState": {
                    "$exists": true,
                    "$gte": "Accepted"
                },
                "ScheduleState": {
                    "$lt": "Accepted"
                },
                "_ValidFrom": {
                    "$lt": end,
                    "$gte": start
                }
            }
        });
        var me = this;
        //Group into lookup table by project oid
        return Deft.Promise.all([ forwardThroughput, backwardThroughput ]).then(function(results) {
            var forward = results[0];
            var backward = results[1];
            var throughput = {};
            
            // Add forward throughput
            _.each(forward, function(snapshot) {
                debugger;
                console.log(me.getWorkingDays(snapshot._ValidFrom, snapshot._ValidTo));
                _.each(snapshot._ProjectHierarchy, function(projectOid) {
                    throughput[projectOid] = throughput[projectOid] || 0;
                    throughput[projectOid]++;
                });
            });

            //Subtract backward throughput
            _.each(backward, function(snapshot) {
                _.each(snapshot._ProjectHierarchy, function(projectOid) {
                    throughput[projectOid] = throughput[projectOid] || 0;
                    throughput[projectOid]--;
                });
            });

            //Normalize the throughput by workday
            return _.transform(throughput, function(result, num, key) {
                result[key] = num/workdays;
            });
        });
    },

    loadThroughputByProjectAndPortfolioItems: function() {
        Ext.getBody().mask('Report creation in progress...');
         
        var start = Ext.getCmp('historicalThroughputStart').getRawValue();
        var end = Ext.getCmp('historicalThroughputEnd').getRawValue();
        
        //cache Throughputs
        if (start !== this.lastHistoricalTPStart || end !== this.lastHistoricalTPEnd) {
            this.historicalThroughputByProject = this.throughputByProject();        
            this.lastHistoricalTPStart = start;
            this.lastHistoricalTPEnd = end;
        }
        
        this.loadPortfolioItems();
    },

    loadPortfolioItems: function() {
        var portfolioItemType = Ext.getCmp('portfolioItemType').getRawValue();
        
        if (!portfolioItemType) {
            Ext.getBody().unmask();
            return;
        }
        
        var filter = this.getPortfolioTreeFilter();

        this.historicalThroughputByProject.then(Ext.bind(function(historicalThroughputByProject) {
            if (this.portfolioTree) {
                this.remove(this.portfolioTree);
            }
            
            this.portfolioTree = this.add({
                xtype: 'portfolioforecasttree',
                id: 'portfoliotree',
                itemId: 'portfoliotree',
                cls: 'portfolioTree',
                enableDragAndDrop: false,
                historicalThroughputByProject: historicalThroughputByProject,
                topLevelModel: 'portfolioitem/' + portfolioItemType.toLowerCase(),
                topLevelStoreConfig: {
                    filters: filter,
                    fetch: true
                },
                listeners: {
                    initialload: function(){Ext.getBody().unmask();}
                }
            });
        }, this));
    },
   getPortfolioTreeFilter: function() {
        var portfolioItemsStart = Ext.Date.format(Ext.getCmp('portfolioItemsStart').getValue(), "Y-m-d");
        var portfolioItemsEnd = Ext.Date.format(Ext.getCmp('portfolioItemsEnd').getValue(), "Y-m-d");
        var targetLaunch = Ext.getCmp('portfolioItemsTargetLaunch').getValue();

        var filter = [ {
            property: 'LeafStoryCount', //Only show PIs that have user stories
            operator: '>',
            value: 0
        }, {
            property: 'PercentDoneByStoryCount', //Do not show completed PIs
            operator: '<',
            value: 1
        }];
        
        //Add Tags
        _.map(Ext.getCmp('tagpicker')._getRecordValue(), function(tag){
            filter.push({property: 'Tags.Name', operator: '=', value: tag.data.Name});
        });
        
        if (Ext.getCmp('fldPlannedDates').checkboxCmp.getValue() === true) { //use Planned start Dates
            filter.push(
                {
                    property: 'PlannedStartDate',
                    operator: '>',
                    value: portfolioItemsStart
                }, 
                {
                    property: 'PlannedEndDate',
                    operator: '<',
                    value: portfolioItemsEnd
                }
            );
        }
        
        if (targetLaunch) {
            filter.push(
                {
                    property: 'c_TargetLaunch',
                    operator: '=',
                    value: targetLaunch
                }
            );
        }
        return filter;
    }
});