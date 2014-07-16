Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    launch: function() {
        var today = new Date().toISOString();
        Ext.create('Rally.data.wsapi.Store', {
                model: 'UserStory',
                fetch: ['ObjectID', 'FormattedID', 'Name', 'ScheduleState', 'Feature'],
                autoLoad: true,
                context: {
                   workspace: '/workspace/1089940415',
                    project: '/project/1694641494',
                    projectScopeUp: true,
                    projectScopeDown: true
                },
                filters: [
                    {
                        property: 'Iteration.StartDate',
                        operator: '<=',
                        value: today
                    },
                    {
                        property: 'Iteration.EndDate',
                        operator: '>=',
                        value: today
                    },
                    {
                        property: 'Feature',
                        operator: '!=',
                        value: null
                    }
                ],
                listeners: {
                    load: this._onDataLoaded,
                    scope: this
                }
                });
    },
    _onDataLoaded: function(store, records){
        var that = this;
        var promises = [];
         _.each(records, function(story) {
            promises.push(that._getFeature(story, that));
        });

        Deft.Promise.all(promises).then({
            success: function(results) {
                that._stories = results;
                that._makeGrid();
            }
        });
    },

    _getFeature: function(story, scope) {
        var deferred = Ext.create('Deft.Deferred');
        var that = scope;
            var featureOid = story.get('Feature').ObjectID;
            var featureOName = story.get('Feature').Name;
            var featureOFomattedId = story.get('Feature').FormattedID;
            Rally.data.ModelFactory.getModel({
            type: 'PortfolioItem/Feature',
            scope: this,
            success: function(model, operation) {
                fetch: ['State'],
                model.load(featureOid, {
                    scope: this,
                    success: function(record, operation) {
                        var featureState = record.get('State') !== null? record.get('State')._refObjectName : 'Not Defined';
                        var storyRef = story.get('_ref');
                        var storyOid  = story.get('ObjectID');
                        var storyFid = story.get('FormattedID');
                        var storyName  = story.get('Name');
                        var storyState = story.get('ScheduleState');
                        var feature = story.get('Feature');

                        result = {
                                    "_ref"          : storyRef,
                                    "ObjectID"      : storyOid,
                                    "FormattedID"   : storyFid,
                                    "Name"          : storyName,
                                    "ScheduleState" : storyState,
                                    "Feature"       : feature,
                                    "FeatureState"  : featureState,
                                    "FeatureID"     : featureOid,
                                    "FeatureName"   : featureOName,
                                    "FeatureFormattedID" : featureOFomattedId
                                };
                        deferred.resolve(result);    
                    }
                });
            }
        });
        return deferred; 
    },

    _makeGrid: function() {
        var that = this;

        if (that._grid) {
            that._grid.destroy();
        }

        var gridStore = Ext.create('Rally.data.custom.Store', {
            data: that._stories,
            groupField: 'FeatureName',
            pageSize: 1000,
        });
        
        that._grid = Ext.create('Rally.ui.grid.Grid', {
            itemId: 'storyGrid',
            store: gridStore,
            features: {
                            ftype: 'grouping', 
                            groupHeaderTpl: Ext.create('Ext.XTemplate',
                            '<div>Feature: {name}</div>')
                      },
            width: 1000,
            columnCfgs: [
                {
                    text: 'Formatted ID', dataIndex: 'FormattedID', xtype: 'templatecolumn',
                    tpl: Ext.create('Rally.ui.renderer.template.FormattedIDTemplate')
                },

                {
                    text: 'Name', dataIndex: 'Name', 
                },
                {
                    text: 'ScheduleState', dataIndex: 'ScheduleState', 
                },
                {
                    text: 'Feature', dataIndex: 'Feature',
                    renderer: function(val, meta, record) {
                        return '<a href="https://rally1.rallydev.com/#/detail/portfolioitem/feature/' + record.get('Feature').ObjectID + '" target="_blank">' + record.get('Feature').FormattedID + '</a>';
                    }
                },
                {
                    text: 'Feature State', dataIndex: 'FeatureState',
                }
            ]
        });

        that.add(that._grid);
        that._grid.reconfigure(gridStore);
    },
    
    getFeatureFormattedId: function(records) {
        var record = records.getRecord();
        console.log('header record?', record);
        return record.getField('FeatureFormattedID') ? Rally.ui.renderer.RendererFactory.renderRecordField(record, 'FeatureFormattedID') : '';
    },
    
    getSeparator: function() {
        return this.getFeatureFormattedId() ? ': ' : '';
    }
});