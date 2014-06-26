Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    items:[
        //Adding containers
        {
            xtype: 'container',
            itemId: 'top',
            style:{ 
                type: 'hbox',
                align: 'fit',
                padding: 10
                }
        },
        {
            xtype: 'container',
            itemId: 'middle',
            style:{ 
                type: 'hbox',
                align: 'fit',
                padding: 20,
                marginBottom:'10px'
                }
        },
        {
            xtype: 'container',
            itemId: 'bottom',
            style:{ 
                type: 'hbox',
                align: 'fit',
                padding: 10
                }
        }],
    layout:{
        type:'vbox',
        align:'stretch',
        padding:10
    },
    
    //declaring all global variables.
    industryEpicStore : undefined,          //stores all epics of Industry Solutions.
    epicComboStore : undefined,             //store all data to be displayed in Epic Combo.
    selectedIndustryEpicID: undefined,      //contains selected Industry Epic ID
    selectedIndustryEpicData: undefined,    //contains selected Industry Epic data
    epicCheckBoxChecked: false,             //captures the current check box checked value.
    filteredEpicDataForCombo: undefined,    //contains all the filtered epics for combo.
    
    totalAcceptedLeafStoryCount: 0,
    totalLeafStoryCount: 0,
    consolidatedPercentDoneByStoryCount: 0,
    
    launch: function() {
        
        this.comboFilterContainer = Ext.create('Ext.container.Container',{
            layout: {
                type: 'hbox',
                align: 'left',
                padding: 5
            }
        });
        
        this.down('#top').add(this.comboFilterContainer);
        
         this.comboBoxContainer = Ext.create('Ext.container.Container',{
            layout: {
                type: 'hbox',
                align: 'left',
                padding: 5
            }
        });
        this.comboFilterContainer.add(this.comboBoxContainer);
        //this.topContainer.add(this.comboBoxContainer);
        
        this.filterContainer = Ext.create('Ext.container.Container',{
            layout: {
                type: 'hbox',
                align: 'left',
                padding: 5
            }
        });
        this.comboFilterContainer.add(this.filterContainer);
        //this.topContainer.add(this.filterContainer);
        
        this._loadEpicFilterControl();
        this._loadIndustryEpicDataStore();
    },
    
    _loadEpicFilterControl: function(){
        console.log('adding check box control.');
        this.epicFilter = Ext.create( 'Ext.form.field.Checkbox', {
                renderTo: Ext.getBody(),
                id: 'industryEpicFilterCheck',
                boxLabel: 'Exclude all "No Entry" or "Launched" Epics. ', 
                name: 'epicFilterCheckBox', 
                inputValue: 'PortfolioItems/Epic ', 
                checked: false,
                width: 250,
                listerners:{
                    change: function(){
                        console.log('checkbox check change event is fired!');
                    },
                    click: function(){
                        console.log('ckeckbox clicked event is fired.!');
                    },
                    scope: this
                }
            });
            
        this.epicFilterButton = Ext.create('Rally.ui.Button',{
            text: 'Filter',
            renderTo: Ext.getBody(),
            handler: this._epicFilterButtonClicked,
            scope: this
        });
        
        //add the check box control to the app container.
        this.filterContainer.add(this.epicFilter);
        this.filterContainer.add(this.epicFilterButton);
    },
    
    _epicFilterButtonClicked: function(){
        
        console.log('Filter Button is clicked!');
        this.epicCheckBoxChecked = this.down('#industryEpicFilterCheck').getValue();
        console.log('The checked value is?', this.epicCheckBoxChecked);
        this._loadIndustryEpicDataStore();
    },
    
    _loadIndustryEpicDataStore: function(){
            
            // If the store exists, just reload data
            if(this.industryEpicStore){
                this.industryEpicStore.load();
            }
            // else create the store
            else{
                    this.industryEpicStore = Ext.create('Rally.data.wsapi.Store', {
                    model: 'PortfolioItem/Epic',
                    fetch: ['Name', 'State', 'FormattedID', 'Owner', 'Tags', 'RefinedEstimate', 'c_TargetLaunch'],
                    autoLoad: true,
                    context: {
                        workspace: '/workspace/1089940415',
                        project: '/project/11656855707',
                        projectScopeUp: false,
                        projectScopeDown: true
                    },
                    listeners: {
                        load: function(myStore, data, success) {
                             this._loadEpicComboBox();
                        },
                        scope:this
                    },
                    sorters: [
                                {
                                    property: 'FormattedID',
                                    direction: 'ASC'
                                }
                            ]
                });
            }
            
        },
        
        _loadEpicComboBox: function(){
            if(this.industryEpicStore)
            {
                //prepare the filtered Epic Data.
                this._createFilteredEpicData();
                
                //get all the epic data for populating combobox.
                this._createAllEpicComboStore();
                
                if(this.epicComboStore)
                {
                    if(this.epicDetailPanel)
                    {
                        this.selectedIndustryEpicID = 0;
                        this.selectedIndustryEpicData = null;
                        this._loadGridData();
                    }
                    
                    //if the combo selectorexists. dispose it off.
                    if(this.epicSelector)
                        this.epicSelector.destroy();
                        
                    //create the combo dropdown list control.
                    this.epicSelector = Ext.create('Ext.form.ComboBox',{
                        fieldLabel:'Select Epics: ',
                        itemId:'industryEpicCombobox',
                        store: this.epicComboStore,
                        queryMode: 'local',
                        displayField: 'Name',
                        valueField: 'ID',
                        width: 600,
                        listeners: {
                            select: this._onEpicComboBoxSelect,
                            ready: this._onEpicComboBoxLoad, //need to revisit why this is not firing
                            scope: this}
                    });
                    
                    //add the combo box control to the app container.
                    this.comboBoxContainer.add(this.epicSelector);
                }
            }
        },
        
        _createFilteredEpicData: function(){
            this.filteredEpicDataForCombo = [];
            
            if(this.epicCheckBoxChecked)
            {
                var epicDataCol = [];
                //fetch the epic data for Combo list.
                Ext.Array.each(this.industryEpicStore.getRecords(),function(thisIndustryEpic){
                    var epicState = thisIndustryEpic.get('State');
                    if(epicState!==null)
                    {
                        var epicStateName = epicState.Name;
                        if(epicStateName!==null && epicStateName !== 'Launched')
                            epicDataCol.push(thisIndustryEpic);
                    }
                });
                
                this.filteredEpicDataForCombo = epicDataCol;
            }
            else
                this.filteredEpicDataForCombo = this.industryEpicStore.getRecords();
            
        },
        
        _onEpicFilterClick:function(){
            console.log('checkbox event fired!!!');
        },
        
        _onEpicComboBoxLoad: function(){
            console.log('On combo box load....');
        },
        
        _onEpicComboBoxSelect: function(){
            
            //retrive all epic info for selected item.
            this.selectedIndustryEpicID = this.down('#industryEpicCombobox').getValue();
            console.log('Selected value?', this.selectedIndustryEpicID);
            this._loadSelectedEpicDetailsFromStore();
            this._loadGridData();
        },
        
        _loadSelectedEpicDetailsFromStore: function(){
            
            if(this.industryEpicStore && this.selectedIndustryEpicID){
                var records = this.industryEpicStore.getRecords();
                var index = this.industryEpicStore.find('FormattedID', this.selectedIndustryEpicID);
                this.selectedIndustryEpicData = records[index];
            }
        },
        
        _createAllEpicComboStore: function(){
            
            if(this.filteredEpicDataForCombo)
            {
                //define the custom model for combo box data.
                Ext.define('Epic', {
                            extend: 'Ext.data.Model',
                            fields: [
                                {name: 'ID',  type: 'string'},
                                {name: 'Name', type: 'string'}
                            ]
                        });
                
                //fetch the epic data for Combo list.
                var epicDataCol = [];
                        
                Ext.Array.each(this.filteredEpicDataForCombo,function(thisIndustryEpic){
                    var epicName = thisIndustryEpic.get('Name');
                    var epicId = thisIndustryEpic.get('FormattedID');
                    var epicComboName = epicId + ': ' + epicName;
                    //console.log('Industry Epic = ', epicComboName);
                    
                    var epicData = Ext.create('Epic',{
                        ID: epicId,
                        Name: epicComboName
                    });
                    
                    epicDataCol.push(epicData);
                });
                
                //create the store for the combo list.            
                this.epicComboStore = Ext.create('Ext.data.Store',{
                    model: 'Epic',
                    data: epicDataCol,
                    autoLoad: true,
                    listeners: {
                        scope:this
                    }
                });
            }
        },
        
    _createGrid: function(){
        this.myGrid = Ext.create('Rally.ui.grid.Grid', {
                    store:this.myStore,
                    columnCfgs: [
                        'FormattedID',
                         'Name',
                         'PercentDoneByStoryCount',
                         'Owner',
                         'Project',
                         'PlannedStartDate',
                         'PlannedEndDate',
                         'RefinedEstimate',
                         'State',
                         'Tags'
                         
                     ]
                    });
 
        this.panelGrid=Ext.create('Ext.form.Panel', {
                        renderTo: Ext.getBody(),
                        layout: {
                            type: 'vbox',
                            align: 'stretch',
                            padding: 10
                        },
                        
                        items: [this.myGrid]
                       
                    });
        this.down('#bottom').add(this.panelGrid);
    },
   

    _loadGridData: function(){
        
        console.log('loading grid');
        // If the store exists, just reload data
        var thisFilter = {
                property: 'Tags.Name',
                value: this.selectedIndustryEpicID
            };
        
        if(this.myStore){
            console.log('myStore exists');
            this.myStore.setFilter(thisFilter);
            this.myStore.load();
        }
        // else create the store
        else{
        
                this.myStore = Ext.create('Rally.data.wsapi.Store', {
                model: 'PortfolioItem',
                fetch: ['Name', 'Project','State', 'FormattedID', 'Owner','Parent', 'Estimate','Tags','PlannedStartDate','PlannedEndDate','PercentDoneByStoryCount'],
                autoLoad: true,
                context: {
                   workspace: '/workspace/1089940415',
                    project: '/project/11656852180',
                    projectScopeUp: false,
                    projectScopeDown: true
                },
                filters:[
                    thisFilter
                    ],
                listeners: {
                    load: function(myStore, data, success) {
                        this._loadEpicConsolidatePanel();
                        if (!this.myGrid) {
                            this._createGrid();
                        }
                    },
                    scope:this
                }
                
            });
        }
           
    },
    
    _loadEpicConsolidatePanel: function(){
        
        this._loadAllEpicDetailsData();
        this._loadEpicPercentageDoneData();
        
        if(this.epicDetailPanel)
        {
            this.epicDetailPanel.removeAll(true);
            this.epicDetailPanel.add(this.leftContainer, this.rightContainer);
        }
        else{
             this.epicDetailPanel = Ext.create('Ext.form.Panel', {
                    renderTo: Ext.getBody(),
                    width: 700,
                    height: 175,
                    layout: {
                        type: 'hbox',
                        align: 'left',
                        padding: 10
                    },
                    title: 'Epic Summary',
                    items: [this.leftContainer, this.rightContainer]
                });
                
             //add the panel to the container.
             this.down('#middle').add(this.epicDetailPanel);
             //this.middleContainer.add(this.epicDetailPanel);
        }
       
    },
    
    _loadAllEpicDetailsData: function(){
        
        this.leftContainer = Ext.create('Ext.container.Container',{
            layout: {
                type: 'vbox',
                align: 'left',
                padding: 10
            }
        });
        
        var epicName = '';
        var ownerName = '';
        var refinedEstimate='';
        var targetLaunch ='';
        
       if(this.selectedIndustryEpicData){
                //prepare display data for epic details panel.
                epicName = this.selectedIndustryEpicData.get('Name');
                ownerName = this.selectedIndustryEpicData.get('Owner') !== null ? 
                                (this.selectedIndustryEpicData.get('Owner')._refObjectName !== null? 
                                    this.selectedIndustryEpicData.get('Owner')._refObjectName : 'No Owner') 
                                : 'No Owner';
                refinedEstimate = this.selectedIndustryEpicData.get('RefinedEstimate');
                targetLaunch = this.selectedIndustryEpicData.get('c_TargetLaunch') !== null?this.selectedIndustryEpicData.get('c_TargetLaunch').toString() : 'No Target Specified';
       }
       
        var leftItems = [
                            {
                                xtype: 'displayfield',
                                fieldLabel: 'Name',
                                name: 'name',
                                value: epicName
                            }, 
                            {
                                xtype: 'displayfield',
                                fieldLabel: 'Owner',
                                name: 'owner',
                                value: ownerName
                            }, 
                            {
                                xtype: 'displayfield',
                                fieldLabel: 'Refined Estimate',
                                name: 'refined_estimate',
                                value: refinedEstimate
                            }, 
                            {
                                xtype: 'displayfield',
                                fieldLabel: 'Target Launch',
                                name: 'target_launch',
                                value: targetLaunch
                            }];
                this.leftContainer.add(leftItems);
        
    },
    
    _loadEpicPercentageDoneData: function(){
        
         this.rightContainer = Ext.create('Ext.container.Container',{
            layout: {
                type: 'hbox',
                align: 'left',
                padding: 10
            }
        });
        
        if(this.myStore){
        
            this._calculateConsolidatedPercentDoneByStoryCount();
            var rightItems = [
                                {
                                    xtype: 'displayfield',
                                    fieldLabel: 'Consolidated Percentage Done',
                                    name: 'percentageDone'
                                },
                                {
                                    xtype: 'rallypercentdone',
                                    fieldLabel: 'Consolidated Percentage Done',
                                    percentDone: this.consolidatedPercentDoneByStoryCount,
                                    width: 150
                                }];
            this.rightContainer.add(rightItems);
        }
    },
    
     _calculateConsolidatedPercentDoneByStoryCount:function(){
        // Calculate the consolidated % done by story count
        var records = []; 
        records = this.myStore.getRecords();
        this.totalAcceptedLeafStoryCount = 0;
        this.totalLeafStoryCount = 0;
        Ext.Array.each(records, function(thisRecord) {
            // Returns the count by percentage story done
            this.totalAcceptedLeafStoryCount = this.totalAcceptedLeafStoryCount + parseInt(thisRecord.get('AcceptedLeafStoryCount'));
            this.totalLeafStoryCount = this.totalLeafStoryCount + parseInt(thisRecord.get('LeafStoryCount'));
        }, this);
        this.consolidatedPercentDoneByStoryCount = this.totalAcceptedLeafStoryCount/this.totalLeafStoryCount;
        console.log('consolidatedPercentDoneByStoryCount : ', this.consolidatedPercentDoneByStoryCount);

    }
});