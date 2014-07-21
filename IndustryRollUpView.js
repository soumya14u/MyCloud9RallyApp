Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    items:[
        //Adding containers
        {
            xtype: 'container',
            itemId: 'top',
            layout: { 
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
    
    //TODO: Naming conventions of widget variables should incoporate the widget class.
    //e.g. filterCheckBox.
    //TODO: cleanup code.
    
    //declaring all global variables.
    industrySolutionEpicStore : undefined,          //stores all epics of Industry Solutions.
    comboBoxStore : undefined,             //store all data to be displayed in Epic Combo.
    selectedIndustryEpicID: undefined,      //contains selected Industry Epic ID
    selectedIndustryEpicData: undefined,    //contains selected Industry Epic data
    checkBoxCheckedValue: true,             //captures the current check box checked value.
    filteredDataForComboBox: undefined,    //contains all the filtered epics for combo.
    
    totalAcceptedLeafStoryCount: 0,
    totalLeafStoryCount: 0,
    consolidatedPercentDoneByStoryCount: 0,
    
    launch: function() {
        
        this._loadIndustryEpicDataStore();
    },
    
     _loadIndustryEpicDataStore: function(){
            
        // If the store exists, just reload data
        if(this.industrySolutionEpicStore){
            this.industrySolutionEpicStore.load();
        }
        // else create the store
        else{
                this.industrySolutionEpicStore = Ext.create('Rally.data.wsapi.Store', {
                model: 'PortfolioItem/Epic',
                fetch: ['Name', 'State', 'FormattedID', 'Owner', 'Tags', 'PreliminaryEstimate', 'c_TargetLaunch'],
                autoLoad: true,
                context: {
                    workspace: '/workspace/1089940415',
                    project: '/project/11656855707',
                    projectScopeUp: false,
                    projectScopeDown: true
                },
                listeners: {
                    load: function(industrySolutionEpicStore, data, success) {
                         this._loadComboBox();
                         this._loadEpicFilterContainer();
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
    
    _loadComboBox: function(){
        if(this.industrySolutionEpicStore)
        {
            //prepare the filtered Epic Data.
            this._filterOutIndustrySolutionEpicStoreData();
            
            //get all the epic data for populating combobox.
            this._createComboBoxStore();
            
            if(this.comboBoxStore)
            {
                //if the combo selectorexists. dispose it off.
                if(!this.comboBox)
                {
                    //create the combo dropdown list control.
                    this.comboBox = Ext.create('Ext.form.ComboBox',{
                        fieldLabel:'Select Epics ',
                        itemId:'industryEpicCombobox',
                        store: this.comboBoxStore,
                        queryMode: 'local',
                        displayField: 'Name',
                        valueField: 'ID',
                        triggerAction: 'all',
                        width: 600,
                        padding: '0 10 0 0',
                        listeners: {
                            select: this._onComboBoxSelect,
                            scope: this}
                    });
                    
                    //add the combo box control to the app container.
                    this.down('#top').add(this.comboBox);
                }
                else{
                    
                    //clearing all selection from combobox and rebinding the store.
                     this.comboBox.clearValue();
                     this.comboBox.bindStore(this.comboBoxStore);
                     
                     //cleaning up all components from middle container.
                     if(this.down('#middle')){
                         this.down('#middle').removeAll(true);
                         if(this.summaryPanel)
                            this.summaryPanel = null;
                     }
                     
                     //cleaning up all components from bottom container.
                     if(this.down('#bottom')){
                         this.down('#bottom').removeAll(true);
                         //marking the grid empty.
                         if(this.rollupViewGrid)
                            this.rollupViewGrid = null;
                        //marking the panel empty.
                         if(this.gridPanel)
                            this.gridPanel = null;
                     }
                     
                }
            }
        }
    },
    
    _loadEpicFilterContainer: function(){
        
        if(!this.filterCheckBox){
            this.filterCheckBox = Ext.create( 'Ext.form.field.Checkbox', {
                renderTo: Ext.getBody(),
                id: 'filterCheckBox',
                boxLabel: 'Exclude all "No Entry", "Launched", "Assessment", "On Ramp" or "Break it down" Epics. ', 
                name: 'epicFilterCheckBox', 
                inputValue: 'PortfolioItems/Epic ', 
                checked: true,
                width: 500,
                listeners:{
                    change: function(){
                        console.log('checkbox check change event is fired!');
                        this.checkBoxCheckedValue = this.down('#filterCheckBox').getValue();
                        console.log('The checked value is?', this.checkBoxCheckedValue);
                    },
                    scope: this
                }
            });
            
            this.down('#top').add(this.filterCheckBox);
        }
        
        if(!this.filterButton){
            this.filterButton = Ext.create('Rally.ui.Button',{
                text: 'Filter',
                renderTo: Ext.getBody(),
                handler: this._filterButtonClicked,
                scope: this
            });
            
            this.down('#top').add(this.filterButton);
        }
        
    },
    
    _filterButtonClicked: function(){
        
        console.log('Filter Button is clicked!');
        this.checkBoxCheckedValue = this.down('#filterCheckBox').getValue();
        console.log('The checked value is?', this.checkBoxCheckedValue);
        this._loadIndustryEpicDataStore();
    },
    
        
    _filterOutIndustrySolutionEpicStoreData: function(){
        this.filteredDataForComboBox = [];
        
        if(this.checkBoxCheckedValue)
        {
            var epicDataCol = [];
            //fetch the epic data for Combo list.
            Ext.Array.each(this.industrySolutionEpicStore.getRecords(),function(thisIndustryEpic){
                var epicState = thisIndustryEpic.get('State');
                if(epicState!==null){
                    var epicStateName = epicState.Name;
                    if(epicStateName!==null && epicStateName !== 'Launched' && epicStateName !== 'Assessment' && epicStateName !== 'On Ramp' && epicStateName !== 'Break it Down')
                        epicDataCol.push(thisIndustryEpic);
                }
            });
            
            this.filteredDataForComboBox = epicDataCol;
        }
        else
            this.filteredDataForComboBox = this.industrySolutionEpicStore.getRecords();
        
    },
    
    _onComboBoxSelect: function(){
        
        //retrive all epic info for selected item.
        this.selectedIndustryEpicID = this.down('#industryEpicCombobox').getValue();
        console.log('Selected value?', this.selectedIndustryEpicID);
        this._loadSelectedEpicDetailsFromStore();
        this._loadGridStore();
    },
    
    _loadSelectedEpicDetailsFromStore: function(){
        
        if(this.industrySolutionEpicStore && this.selectedIndustryEpicID){
            var records = this.industrySolutionEpicStore.getRecords();
            var index = this.industrySolutionEpicStore.find('FormattedID', this.selectedIndustryEpicID);
            this.selectedIndustryEpicData = records[index];
        }
    },
        
    _createComboBoxStore: function(){
        
        if(this.filteredDataForComboBox)
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
                    
            Ext.Array.each(this.filteredDataForComboBox,function(thisIndustryEpic){
                var epicName = thisIndustryEpic.get('Name');
                var epicId = thisIndustryEpic.get('FormattedID');
                var epicComboName = epicId + ': ' + epicName;
                
                var epicData = Ext.create('Epic',{
                    ID: epicId,
                    Name: epicComboName
                });
                
                epicDataCol.push(epicData);
            });
            
            //create the store for the combo list.            
            this.comboBoxStore = Ext.create('Ext.data.Store',{
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
        //TODO: investigate how to render a grid inside a container.
        
        this.rollupViewGrid = Ext.create('Rally.ui.grid.Grid', {
                    store:this.gridStore,
                    columnCfgs: [
                        'FormattedID',
                         'Name',
                         'PercentDoneByStoryCount',
                         'Owner',
                         'Project',
                         'PlannedStartDate',
                         'PlannedEndDate',
                         'PreliminaryEstimate',
                         'State'
                     ]
                    });
 
        this.gridPanel=Ext.create('Ext.form.Panel', {
                        renderTo: Ext.getBody(),
                        layout: {
                            type: 'vbox',
                            align: 'stretch',
                            padding: 10
                        },
                        
                        items: [this.rollupViewGrid]
                       
                    });
        this.down('#bottom').add(this.gridPanel);
    },
   

    _loadGridStore: function(){
        
        console.log('loading grid');
        // If the store exists, just reload data
        var thisFilter = {
                property: 'Tags.Name',
                value: this.selectedIndustryEpicID
            };
        
        if(this.gridStore){
            this.gridStore.setFilter(thisFilter);
            this.gridStore.load();
        }
        // else create the store
        else{
        
                this.gridStore = Ext.create('Rally.data.wsapi.Store', {
                model: 'PortfolioItem',
                fetch: ['Name', 'Project','State', 'FormattedID', 'Owner','Parent', 'PreliminaryEstimate','Tags','PlannedStartDate','PlannedEndDate','PercentDoneByStoryCount'],
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
                    load: function(gridStore, data, success) {
                        this._loadSummaryPanel();
                        if (!this.rollupViewGrid) {
                            this._createGrid();
                        }
                    },
                    scope:this
                }
                
            });
        }
           
    },
    
    _loadSummaryPanel: function(){
        
        this._loadAllEpicDetailsData();
        this._loadEpicPercentageDoneData();
        
        if(this.summaryPanel)
        {
            this.summaryPanel.removeAll(true);
            this.summaryPanel.add(this.leftContainer, this.rightContainer);
        }
        else{
             this.summaryPanel = Ext.create('Ext.form.Panel', {
                    renderTo: Ext.getBody(),
                    width: 800,
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
             this.down('#middle').add(this.summaryPanel);
        }
       
    },
    
    _loadAllEpicDetailsData: function(){
      
        this.leftContainer = Ext.create('Ext.container.Container',{
            layout: {
                type: 'vbox',
                align: 'left',
                padding: 10
            },
            width: 500
        });
        
        var epicName = '';
        var ownerName = '';
        var targetLaunch ='';
        
       if(this.selectedIndustryEpicData){
                //prepare display data for epic details panel.
                epicName = this.selectedIndustryEpicData.get('Name');
                ownerName = this.selectedIndustryEpicData.get('Owner') !== null ? 
                                (this.selectedIndustryEpicData.get('Owner')._refObjectName !== null? 
                                    this.selectedIndustryEpicData.get('Owner')._refObjectName : 'No Owner') 
                                : 'No Owner';
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
                                fieldLabel: 'Target Launch',
                                name: 'target_launch',
                                value: targetLaunch
                            }];
        this.leftContainer.add(leftItems);
    },
    
    _loadEpicPercentageDoneData: function(){
        
         this.rightContainer = Ext.create('Ext.container.Container',{
            layout: {
                type: 'vbox',
                align: 'left',
                padding: 10
            },
            width: 300
        });
        
        this.progressBarContainer = Ext.create('Ext.container.Container',{
            layout: {
                type: 'hbox',
                align: 'left',
                padding: 0
            },
            width: 300
        });
        
        this.rightContainer.add(this.progressBarContainer);
        
        if(this.gridStore){
            
            this._calculateConsolidatedPercentDoneByStoryCount();
            var progressBarItems = [
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
            this.progressBarContainer.add(progressBarItems);
        }
        
        if(this.selectedIndustryEpicData){
            
            var preliminaryEstimate='';
            preliminaryEstimate = this.selectedIndustryEpicData.get('PreliminaryEstimate');
            
            var rightItems = [
                {
                    xtype: 'displayfield',
                    fieldLabel: 'Preliminary Estimate',
                    name: 'preliminary_estimate',
                    value: preliminaryEstimate
                }];
            
            this.rightContainer.add(rightItems);
        }
    },
    
     _calculateConsolidatedPercentDoneByStoryCount:function(){
        // Calculate the consolidated % done by story count
        var records = []; 
        records = this.gridStore.getRecords();
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